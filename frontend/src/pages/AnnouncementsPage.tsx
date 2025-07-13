// src/pages/AnnouncementsPage.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import CreateAnnouncementForm from "../components/CreateAnnouncementForm";
import AnnouncementCard from "../components/AnnouncementCard";
import ConfirmModal from "../components/ConfirmModal"; // <-- Importer la modale
import { parseJwt, type JwtPayload } from "../utils/jwt";
import type { Announcement } from "../types"; // <-- Importer depuis le fichier central

// --- ICÔNES SVG ---
const SpeakerphoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 6a7.5 7.5 0 100 12h-3a7.5 7.5 0 00-7.5-7.5h1.5v-1.5a7.5 7.5 0 007.5-7.5h3z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 18.75h-1.5a7.5 7.5 0 00-7.5-7.5h-1.5v-1.5a7.5 7.5 0 017.5-7.5h1.5v16.5z"
    />
  </svg>
);
const ExclamationCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);
const SpinnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    className="animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
// --- FIN ICÔNES SVG ---

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
      const data = await res.json();
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
