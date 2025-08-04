import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
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
  // toast importé directement
  
  const [showComposer, setShowComposer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // États pour la suppression
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const canManage = raw?.role === 'manager' || raw?.role === 'admin';
  
  // Force rebuild - 28/01/2025

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl">
                  <SpeakerphoneIcon className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  Communication
                </h1>
              </div>
              <p className="text-muted-foreground">
                Partagez des informations importantes avec vos restaurants
              </p>
            </div>

            {canManage && (
              <AnimatePresence mode="wait">
                {!showComposer ? (
                  <motion.div
                    key="create-button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => setShowComposer(true)}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Nouvelle annonce
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cancel-button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => setShowComposer(false)}
                      className="flex items-center gap-2 bg-muted text-muted-foreground px-4 py-2.5 rounded-xl font-medium hover:bg-muted/80 transition-colors"
                    >
                      Annuler
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
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
            className="mt-8"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <SparklesIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-primary font-medium">
                    Vous recevez toutes les annonces importantes de votre franchiseur
                  </p>
                  <p className="text-primary/70 text-sm">
                    Les nouvelles annonces apparaîtront automatiquement ici
                  </p>
                </div>
              </div>
            </div>
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
    </div>
  );
}