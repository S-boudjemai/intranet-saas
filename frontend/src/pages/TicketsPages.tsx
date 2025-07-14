// src/pages/TicketsPages.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CreateTicketForm from "../components/CreateTicketForm";
import TicketItem from "../components/TicketItem";
import ConfirmModal from "../components/ConfirmModal"; // <-- Importer la modale
import { parseJwt, type JwtPayload } from "../utils/jwt";
import type { TicketType } from "../types";

// --- ICÔNES SVG ---
const TicketIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12v.75m0 3v.75m0 3v.75m0 3V18m-3 .75h18A2.25 2.25 0 0021 16.5V7.5A2.25 2.25 0 0018.75 6H3.75A2.25 2.25 0 001.5 8.25v8.25A2.25 2.25 0 003.75 18z"
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

export default function TicketsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ÉTATS POUR LA MODALE ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<TicketType | null>(null);

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const isViewer = raw?.role === "viewer";
  const isManager = raw?.role === "manager" || raw?.role === "admin";

  const loadTickets = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      const response = await res.json();
      console.log('🎫 Frontend - Tickets response:', response);
      
      // Gérer le format transformé par l'intercepteur global
      const list = response.data || response;
      setTickets(Array.isArray(list) ? list : []);
      
      console.log('🎫 Frontend - Set tickets:', Array.isArray(list) ? list.length : 0, 'tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [token]);

  // --- LOGIQUE DE SUPPRESSION AVEC LA MODALE ---
  const handleDeleteRequest = (ticket: TicketType) => {
    setTicketToDelete(ticket);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!ticketToDelete || !token) return;
    await fetch(
      `${import.meta.env.VITE_API_URL}/tickets/${ticketToDelete.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    await loadTickets();
    setTicketToDelete(null);
  };

  // --- AUTRES HANDLERS (inchangés) ---
  const handleCreated = () => loadTickets();
  const changeStatus = async (
    ticketId: string,
    newStatus: TicketType["status"]
  ) => {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status: newStatus,
              updated_at: new Date().toISOString(),
            }
          : ticket
      )
    );
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/tickets/${ticketId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
    } catch (error) {
      loadTickets();
    }
  };
  const addComment = async (ticketId: string, message: string) => {
    await fetch(
      `${import.meta.env.VITE_API_URL}/tickets/${ticketId}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      }
    );
    loadTickets();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
        <div className="p-2 bg-card border border-border rounded-lg">
          <TicketIcon className="h-6 w-6 text-primary" />
        </div>
        <span>Gestion des Tickets</span>
      </h1>

      {isViewer && (
        <div className="mb-8">
          <CreateTicketForm onSuccess={handleCreated} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground p-8">
          <SpinnerIcon className="h-6 w-6" />
          <span>Chargement…</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border-2 border-dashed border-border rounded-lg">
          <p>Aucun ticket trouvé.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {tickets.map((t) => (
            <TicketItem
              key={t.id}
              ticket={t}
              isManager={isManager}
              onStatusChange={changeStatus}
              onDeleteRequest={handleDeleteRequest} // <-- CORRIGÉ : On passe la bonne prop
              onAddComment={addComment}
            />
          ))}
        </ul>
      )}

      {/* --- NOTRE MODALE DE CONFIRMATION --- */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le ticket"
      >
        Êtes-vous sûr de vouloir supprimer définitivement le ticket "
        <span className="font-bold">{ticketToDelete?.title}</span>" ? Cette
        action est irréversible.
      </ConfirmModal>
    </div>
  );
}
