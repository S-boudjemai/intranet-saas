import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
// Utilise OneSignal pour les notifications push

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

  // Récupérer les compteurs de notifications
  const refreshCounts = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/unread-counts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        const counts = json.data || json;
        const newCounts = {
          documents: counts.documents || 0,
          announcements: counts.announcements || 0,
          tickets: counts.tickets || 0,
        };
        setNotificationCounts(newCounts);
        
        // ✅ Badge PWA natif (plus besoin de Firebase)
        const totalCount = newCounts.documents + newCounts.announcements + newCounts.tickets;
        if ('setAppBadge' in navigator) {
          try {
            if (totalCount > 0) {
              await (navigator as any).setAppBadge(totalCount);
            } else {
              await (navigator as any).clearAppBadge();
            }
          } catch (err) {
            console.warn('Badge PWA non supporté:', err);
          }
        }
      }
    } catch (error) {
      // Error fetching notification counts
    }
  }, [token]);

  // Établir la connexion WebSocket
  useEffect(() => {
    if (token && user) {
      const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const newSocket = io(socketUrl, {
        auth: {
          token: token
        },
        autoConnect: true,
        transports: ['websocket', 'polling'],
        reconnection: true,        // ✅ Réactiver reconnexion automatique
        reconnectionAttempts: 5,   // ✅ Limite de tentatives
        reconnectionDelay: 1000,   // ✅ Délai entre tentatives
        timeout: 20000,
        forceNew: true,
        upgrade: true
      });

      newSocket.on('connect', () => {
      });

      newSocket.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          // Server disconnected, attempt to reconnect
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

      // Écouter les notifications en temps réel avec délai
      newSocket.on('document_uploaded', (data) => {
        setTimeout(refreshCounts, 500); // 0.5 seconde de délai
      });

      newSocket.on('announcement_posted', (data) => {
        setTimeout(refreshCounts, 500);
      });

      newSocket.on('ticket_created', (data) => {
        setTimeout(refreshCounts, 500);
      });

      newSocket.on('ticket_updated', (data) => {
        setTimeout(refreshCounts, 500);
      });

      newSocket.on('restaurant_joined', (data) => {
        setTimeout(refreshCounts, 500);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // ✅ Si pas de token/user, fermer WebSocket existant
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [token, user]); // ✅ RETIRER refreshCounts des dépendances

  // Charger les compteurs au montage
  useEffect(() => {
    if (token && user) {
      refreshCounts();
    }
  }, [token, user, refreshCounts]);


  const [isProcessing, setIsProcessing] = useState(false);

  // Marquer toutes les notifications d'un type comme lues
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
      if (!category) {
        // Unknown notification type
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/notifications/mark-category-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      // ✅ Rafraîchir les compteurs après avoir marqué comme lu
      await refreshCounts();
    } catch (error) {
      // Error marking notifications as read
      // TODO: Afficher une notification d'erreur à l'utilisateur
    } finally {
      setIsProcessing(false);
    }
  }, [token, isProcessing, refreshCounts]);

  const value = {
    socket,
    notificationCounts,
    refreshCounts,
    markAllAsRead,
    isProcessing,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};