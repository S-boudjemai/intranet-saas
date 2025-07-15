// src/pages/AnnouncementsPage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import CreateAnnouncementForm from "../components/CreateAnnouncementForm";
import AnnouncementCard from "../components/AnnouncementCard";
import ConfirmModal from "../components/ConfirmModal"; // <-- Importer la modale
import { parseJwt, type JwtPayload } from "../utils/jwt";
import type { Announcement } from "../types"; // <-- Importer depuis le fichier central
import { SpeakerphoneIcon, ExclamationCircleIcon, SpinnerIcon } from "../components/icons";

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
      return (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground p-8">
          <SpinnerIcon className="h-6 w-6" />
          <span>Chargement...</span>
        </div>
      );
    }
    if (err) {
      return (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center space-x-3">
          <ExclamationCircleIcon className="h-6 w-6" />
          <span>Erreur : {err}</span>
        </div>
      );
    }
    if (anns.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-16 border-2 border-dashed border-border rounded-lg">
          <p>Aucune annonce pour le moment.</p>
        </div>
      );
    }
    return (
      <div className="space-y-8">
        {anns.map((a) => (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            canManage={canManage}
            onDeleteRequest={handleDeleteRequest} // <-- On passe la nouvelle fonction
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
        <div className="p-2 bg-card border border-border rounded-lg">
          <SpeakerphoneIcon className="h-6 w-6 text-primary" />
        </div>
        <span>Fil d'Annonces</span>
      </h1>

      {canManage && (
        <div className="mb-12">
          <CreateAnnouncementForm onSuccess={loadAnnouncements} />
        </div>
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
    </div>
  );
}
