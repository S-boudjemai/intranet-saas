// src/pages/TicketsPages.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CreateTicketForm from "../components/CreateTicketForm";
import TicketItem from "../components/TicketItem";
import ConfirmModal from "../components/ConfirmModal";
import { parseJwt, type JwtPayload } from "../utils/jwt";
import type { TicketType } from "../types";
import { TicketIcon, SpinnerIcon } from "../components/icons";

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
