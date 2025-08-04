import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { oneSignalService } from '../services/oneSignalService';

interface NotificationCounts {
  documents: number;
  announcements: number;
  tickets: number;
}

interface NotificationContextType {
  socket: Socket | null;
  notificationCounts: NotificationCounts;
  refreshCounts: () => Promise<void>;
  markAllAsRead: (notificationType: 'document_uploaded' | 'announcement_posted' | 'ticket_created' | 'ticket_commented' | 'ticket_status_updated') => Promise<void>;
  isProcessing: boolean;
  // OneSignal methods
  pushNotificationStatus: 'granted' | 'denied' | 'default' | 'unsupported';
  requestPushPermission: () => Promise<boolean>;
  testPushNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    documents: 0,
    announcements: 0,
    tickets: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [pushNotificationStatus, setPushNotificationStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  
  // Refs pour éviter les re-renders et debouncing
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cache des counts pour éviter les re-renders inutiles
  const countsRef = useRef<NotificationCounts>(notificationCounts);

  // Optimisation : Debounced refresh avec cache
  const refreshCounts = useCallback(async () => {
    if (!token) return;

    // Debounce : éviter les appels trop fréquents
    const now = Date.now();
    if (now - lastRefreshRef.current < 1000) return; // Max 1 call par seconde
    lastRefreshRef.current = now;

    // Annuler la requête précédente si en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/unread-counts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal
      });

      if (response.ok) {
        const json = await response.json();
        const counts = json.data || json;
        const newCounts = {
          documents: counts.documents || 0,
          announcements: counts.announcements || 0,
          tickets: counts.tickets || 0,
        };

        // Optimisation : ne mettre à jour que si les valeurs ont changé
        if (JSON.stringify(newCounts) !== JSON.stringify(countsRef.current)) {
          setNotificationCounts(newCounts);
          countsRef.current = newCounts;

          // Badge PWA avec optimisation
          const totalCount = newCounts.documents + newCounts.announcements + newCounts.tickets;
          if ('setAppBadge' in navigator) {
            try {
              if (totalCount > 0) {
                await (navigator as any).setAppBadge(totalCount);
              } else {
                await (navigator as any).clearAppBadge();
              }
            } catch (err) {
              // Badge PWA non supporté - ignorer silencieusement
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Requête annulée - normal
        return;
      }
      // Autres erreurs - ne pas afficher à l'utilisateur pour éviter le spam
    }
  }, [token]);

  // Optimisation WebSocket : Connection stable avec retry intelligent
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    
    const createSocket = () => {
      const newSocket = io(socketUrl, {
        auth: { token },
        autoConnect: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: Math.min(1000 * Math.pow(2, reconnectAttempts), 5000), // Backoff exponentiel
        timeout: 20000,
        forceNew: true,
        upgrade: true
      });

      // Handlers optimisés sans console.log
      newSocket.on('connect', () => {
        reconnectAttempts = 0;
      });

      newSocket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect' && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          setTimeout(() => newSocket.connect(), 1000 * reconnectAttempts);
        }
      });

      // Optimisation : Debounced refresh pour tous les événements
      const debouncedRefresh = () => {
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setTimeout(refreshCounts, 300); // Réduit de 500ms à 300ms
      };

      // Écouteurs d'événements optimisés
      const eventTypes = [
        'document_uploaded',
        'announcement_posted', 
        'ticket_created',
        'ticket_updated',
        'restaurant_joined'
      ];

      eventTypes.forEach(eventType => {
        newSocket.on(eventType, debouncedRefresh);
      });

      return newSocket;
    };

    const newSocket = createSocket();
    setSocket(newSocket);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      newSocket.close();
    };
  }, [token, user?.userId]); // Optimisation : dépendance sur userId uniquement

  // Charger les compteurs initial avec cache
  useEffect(() => {
    if (token && user) {
      refreshCounts();
    }
  }, [token, user?.userId, refreshCounts]); // Optimisation : userId au lieu de user complet

  // Optimisation : Mark as read avec cache invalidation
  const markAllAsRead = useCallback(async (notificationType: 'document_uploaded' | 'announcement_posted' | 'ticket_created' | 'ticket_commented' | 'ticket_status_updated') => {
    if (!token || isProcessing) return;

    setIsProcessing(true);
    try {
      const categoryMapping: Record<string, string> = {
        'document_uploaded': 'documents',
        'announcement_posted': 'announcements', 
        'ticket_created': 'tickets',
        'ticket_commented': 'tickets',
        'ticket_status_updated': 'tickets'
      };

      const category = categoryMapping[notificationType];
      if (!category) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/mark-category-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
      });

      if (response.ok) {
        // Optimisation : mise à jour optimiste du cache
        const newCounts = { ...countsRef.current };
        newCounts[category as keyof NotificationCounts] = 0;
        setNotificationCounts(newCounts);
        countsRef.current = newCounts;
        
        // Refresh complet en arrière-plan pour garantir la cohérence
        setTimeout(refreshCounts, 100);
      }
    } catch (error) {
      // Erreur silencieuse - pas d'alerte utilisateur
    } finally {
      setIsProcessing(false);
    }
  }, [token, isProcessing, refreshCounts]);

  // OneSignal methods
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await oneSignalService.requestPermission();
      setPushNotificationStatus(granted ? 'granted' : 'denied');
      if (granted) {
        await oneSignalService.subscribeUser();
      }
      return granted;
    } catch (error) {
      console.error('Push permission error:', error);
      setPushNotificationStatus('denied');
      return false;
    }
  }, []);

  const testPushNotification = useCallback(async (): Promise<void> => {
    try {
      await oneSignalService.testLocalNotification();
    } catch (error) {
      console.error('Test notification error:', error);
    }
  }, []);

  // Vérifier le statut des notifications push au démarrage
  useEffect(() => {
    const checkPushStatus = () => {
      if (!oneSignalService.isBrowserSupported()) {
        setPushNotificationStatus('unsupported');
        return;
      }
      
      if ('Notification' in window) {
        setPushNotificationStatus(Notification.permission as any);
      }
    };

    checkPushStatus();
  }, []);

  // Mémorisation de la valeur du contexte
  const contextValue = useMemo(() => ({
    socket,
    notificationCounts,
    refreshCounts,
    markAllAsRead,
    isProcessing,
    // OneSignal
    pushNotificationStatus,
    requestPushPermission,
    testPushNotification,
  }), [socket, notificationCounts, refreshCounts, markAllAsRead, isProcessing, pushNotificationStatus, requestPushPermission, testPushNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};