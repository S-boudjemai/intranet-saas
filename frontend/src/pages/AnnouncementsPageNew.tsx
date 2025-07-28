import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToastHelpers } from '../components/ToastContainer';
import AnnouncementComposer from '../components/AnnouncementComposer';
import AnnouncementFeed from '../components/AnnouncementFeed';
import ConfirmModal from '../components/ConfirmModal';
import { parseJwt, type JwtPayload } from '../utils/jwt';
import type { Announcement } from '../types';
import { 
  SpeakerphoneIcon, 
  PlusIcon,
  SparklesIcon 
} from '../components/icons';
import Button from '../components/ui/Button';

export default function AnnouncementsPageNew() {
  const { token } = useAuth();
  const toast = useToastHelpers();
  
  const [showComposer, setShowComposer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // États pour la suppression
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const canManage = raw?.role === 'manager' || raw?.role === 'admin';

  // Gestionnaire de succès de création
  const handleCreateSuccess = useCallback(() => {
    setShowComposer(false);
    setRefreshKey(prev => prev + 1); // Force refresh du feed
    toast.success('Annonce publiée avec succès !');
  }, [toast]);

  // Gestionnaire de demande de suppression
  const handleDeleteRequest = useCallback((announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setIsConfirmModalOpen(true);
  }, []);

  // Gestionnaire de confirmation de suppression
  const handleConfirmDelete = useCallback(async () => {
    if (!announcementToDelete || !token) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/announcements/${announcementToDelete.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      toast.success('Annonce supprimée avec succès');
      setRefreshKey(prev => prev + 1); // Force refresh du feed
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
      setIsConfirmModalOpen(false);
      setAnnouncementToDelete(null);
    }
  }, [announcementToDelete, token, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 rounded-2xl"
              >
                <SpeakerphoneIcon className="h-8 w-8 text-primary" />
              </motion.div>
              
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Communication
                </h1>
                <p className="text-muted-foreground mt-1">
                  Partagez des informations importantes avec vos restaurants
                </p>
              </div>
            </div>

            {canManage && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <AnimatePresence mode="wait">
                  {!showComposer ? (
                    <motion.div
                      key="create-button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Button
                        onClick={() => setShowComposer(true)}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Nouvelle annonce
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cancel-button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        onClick={() => setShowComposer(false)}
                      >
                        Annuler
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.header>

        {/* Composer (si affiché) */}
        <AnimatePresence>
          {showComposer && canManage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <AnnouncementComposer
                onSuccess={handleCreateSuccess}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed des annonces */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: showComposer ? 0 : 0.4 }}
        >
          <AnnouncementFeed
            key={refreshKey} // Force refresh when key changes
            onDeleteRequest={handleDeleteRequest}
          />
        </motion.div>

        {/* Message pour les utilisateurs sans permissions */}
        {!canManage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center"
          >
            <SparklesIcon className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-primary font-medium">
              Vous recevez toutes les annonces importantes de votre franchiseur
            </p>
            <p className="text-primary/70 text-sm mt-1">
              Les nouvelles annonces apparaîtront automatiquement ici
            </p>
          </motion.div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => !isDeleting && setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'annonce"
        loading={isDeleting}
        destructive
      >
        <div className="space-y-3">
          <p>
            Êtes-vous sûr de vouloir supprimer définitivement l'annonce{' '}
            <span className="font-bold text-foreground">
              "{announcementToDelete?.title}"
            </span>{' '}
            ?
          </p>
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible et l'annonce sera supprimée pour tous les utilisateurs.
          </p>
        </div>
      </ConfirmModal>
    </motion.div>
  );
}