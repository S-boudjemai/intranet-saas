// src/components/AnnouncementViewModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { XIcon, UserCircleIcon, ClockIcon, EyeIcon } from './icons';

interface AnnouncementView {
  id: number;
  viewed_at: string;
  user: {
    id: number;
    email: string;
    role: string;
    restaurant_id?: number;
  };
}

interface AnnouncementViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcementId: number;
  announcementTitle: string;
}

export default function AnnouncementViewModal({
  isOpen,
  onClose,
  announcementId,
  announcementTitle,
}: AnnouncementViewModalProps) {
  const { token } = useAuth();
  const [views, setViews] = useState<AnnouncementView[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;

    const fetchViews = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/announcements/${announcementId}/views`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setViews(data.data || data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des vues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  }, [isOpen, announcementId, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950';
      case 'manager': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950';
      case 'viewer': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-950';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-background border border-border rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Qui a lu cette annonce ?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {announcementTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-muted-foreground">Chargement...</span>
                </div>
              ) : views.length === 0 ? (
                <div className="text-center py-8">
                  <EyeIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-lg font-medium text-foreground">Aucune lecture</p>
                  <p className="text-sm text-muted-foreground">
                    Personne n'a encore lu cette annonce.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {views.map((view) => (
                    <motion.div
                      key={view.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <UserCircleIcon className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {view.user.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(view.user.role)}`}>
                              {view.user.role}
                            </span>
                            {view.user.restaurant_id && (
                              <span className="text-xs text-muted-foreground">
                                Restaurant #{view.user.restaurant_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatDate(view.viewed_at)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                {views.length} lecture{views.length > 1 ? 's' : ''} au total
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}