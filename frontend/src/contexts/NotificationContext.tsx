import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

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
      const response = await fetch('http://localhost:3000/notifications/unread-counts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        const counts = json.data || json;
        setNotificationCounts({
          documents: counts.documents || 0,
          announcements: counts.announcements || 0,
          tickets: counts.tickets || 0,
        });
      }
    } catch (error) {
      // Error fetching notification counts
    }
  }, [token]);

  // Établir la connexion WebSocket
  useEffect(() => {
    if (token && user) {
      const newSocket = io('http://localhost:3000', {
        auth: {
          token: token
        },
        autoConnect: true
      });

      newSocket.on('connect', () => {
        // Connected to notifications server
      });

      newSocket.on('disconnect', () => {
        // Disconnected from notifications server
      });

      // Écouter les notifications en temps réel
      newSocket.on('document_uploaded', () => {
        refreshCounts();
      });

      newSocket.on('announcement_posted', () => {
        refreshCounts();
      });

      newSocket.on('ticket_created', () => {
        refreshCounts();
      });

      newSocket.on('ticket_updated', () => {
        refreshCounts();
      });

      newSocket.on('restaurant_joined', () => {
        refreshCounts();
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, user, refreshCounts]);

  // Charger les compteurs au montage
  useEffect(() => {
    if (token) {
      refreshCounts();
    }
  }, [token, refreshCounts]);


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
        console.warn('Type de notification non reconnu:', notificationType);
        return;
      }

      const response = await fetch('http://localhost:3000/notifications/mark-category-read', {
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

      // Rafraîchir les compteurs après avoir marqué comme lu
      await refreshCounts();
    } catch (error) {
      console.error('Erreur lors du marquage des notifications comme lues:', error);
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