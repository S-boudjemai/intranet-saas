// src/pages/AnnouncementsPage.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import CreateAnnouncementForm from "../components/CreateAnnouncementForm";
import AnnouncementCard from "../components/AnnouncementCard";
import ConfirmModal from "../components/ConfirmModal";
import { parseJwt, type JwtPayload } from "../utils/jwt";
import type { Announcement } from "../types";
import { SpeakerphoneIcon, ExclamationCircleIcon } from "../components/icons";
import { AnnouncementFeedSkeleton } from "../components/Skeleton";

// --- ICÔNES LOCALES SUPPRIMÉES, UTILISATION CENTRALISÉE ---

export default function AnnouncementsPage() {
  const { token } = useAuth();
  const [anns, setAnns] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // --- NOUVEAUX ÉTATS POUR LA MODALE ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] =
    useState<Announcement | null>(null);

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const canManage = raw?.role === "manager" || raw?.role === "admin";

  const loadAnnouncements = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/announcements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error(
          `Erreur de communication avec le serveur (${res.status})`
        );
      const response = await res.json();
      const data = response.data || response;
      setAnns(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [token]);


  // --- LOGIQUE DE SUPPRESSION MISE À JOUR ---
  const handleDeleteRequest = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete || !token) return;
    await fetch(
      `${import.meta.env.VITE_API_URL}/announcements/${
        announcementToDelete.id
      }`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    await loadAnnouncements();
    setAnnouncementToDelete(null);
  };

  const renderContent = () => {
    if (loading) {
      return <AnnouncementFeedSkeleton />;
    }
    if (err) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 text-destructive p-4 rounded-2xl flex items-center space-x-3 border border-destructive/20"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        >
          <ExclamationCircleIcon className="h-6 w-6" />
          <span>Erreur : {err}</span>
        </motion.div>
      );
    }
    if (anns.length === 0) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-muted-foreground py-16 border-2 border-dashed border-border rounded-2xl bg-muted"
        >
          <p>Aucune annonce pour le moment.</p>
        </motion.div>
      );
    }
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-8"
      >
        {anns.map((a, index) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <AnnouncementCard
              announcement={a}
              canManage={canManage}
              onDeleteRequest={handleDeleteRequest}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3"
      >
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="p-3 bg-primary/10 border border-primary/20 rounded-2xl"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        >
          <SpeakerphoneIcon className="h-6 w-6 text-primary" />
        </motion.div>
        <span>Fil d'Annonces</span>
      </motion.h1>

      {canManage && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-12"
        >
          <CreateAnnouncementForm onSuccess={loadAnnouncements} />
        </motion.div>
      )}

      {renderContent()}

      {/* --- NOTRE MODALE DE CONFIRMATION --- */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer l'annonce"
      >
        Êtes-vous sûr de vouloir supprimer définitivement l'annonce "
        <span className="font-bold">{announcementToDelete?.title}</span>" ?
        Cette action est irréversible.
      </ConfirmModal>
    </motion.div>
  );
}
