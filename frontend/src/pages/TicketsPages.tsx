// src/pages/TicketsPages.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
      
      // Gérer le format transformé par l'intercepteur global
      const list = response.data || response;
      setTickets(Array.isArray(list) ? list : []);
      
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
    try {
      const response = await fetch(
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
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Extraire le message d'erreur de validation
        let errorMessage = 'Erreur lors de l\'ajout du commentaire';
        if (errorData.error && errorData.error.message) {
          if (Array.isArray(errorData.error.message)) {
            errorMessage = errorData.error.message[0]; // Prendre le premier message d'erreur
          } else {
            errorMessage = errorData.error.message;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      loadTickets();
    } catch (error) {
      console.error('Erreur complète:', error);
      throw error; // Re-lancer l'erreur pour que TicketItem puisse la capturer
    }
  };

  const handleDeleteAllTickets = async () => {
    if (!token || !isManager) return;
    
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer TOUS les tickets ? Cette action est irréversible.'
    );
    
    if (!confirmed) return;
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/tickets/delete-all`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setTickets([]);
      alert('Tous les tickets ont été supprimés avec succès.');
    } catch (error) {
      console.error('Erreur lors de la suppression des tickets:', error);
      alert('Erreur lors de la suppression des tickets.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8"
    >
      <div className="flex justify-between items-center mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-3xl font-bold text-foreground flex items-center gap-3"
        >
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="p-3 bg-primary/10 border border-primary/20 rounded-2xl"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <TicketIcon className="h-6 w-6 text-primary" />
          </motion.div>
          <span>Gestion des Tickets</span>
        </motion.h1>
        
        {isManager && tickets.length > 0 && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            onClick={handleDeleteAllTickets}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Supprimer tous les tickets
          </motion.button>
        )}
      </div>

      {isViewer && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <CreateTicketForm onSuccess={handleCreated} />
        </motion.div>
      )}

      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center space-x-2 text-muted-foreground p-8"
        >
          <SpinnerIcon className="h-6 w-6" />
          <span>Chargement…</span>
        </motion.div>
      ) : tickets.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-muted-foreground py-16 border-2 border-dashed border-border rounded-2xl bg-muted"
        >
          <p>Aucun ticket trouvé.</p>
        </motion.div>
      ) : (
        <motion.ul 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {tickets.map((t, index) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <TicketItem
                ticket={t}
                isManager={isManager}
                onStatusChange={changeStatus}
                onDeleteRequest={handleDeleteRequest}
                onAddComment={addComment}
              />
            </motion.li>
          ))}
        </motion.ul>
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
    </motion.div>
  );
}
