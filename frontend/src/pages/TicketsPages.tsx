// src/pages/TicketsPages.tsx
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import CreateTicketForm from "../components/CreateTicketForm";
import TicketItem from "../components/TicketItem";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import { TicketItemSkeleton } from "../components/Skeleton";
import { parseJwt, type JwtPayload } from "../utils/jwt";
import type { TicketType } from "../types";
import { TicketIcon, PlusIcon, FilterIcon } from "../components/icons";

export default function TicketsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | TicketType['status']>('all');

  // --- ÉTATS POUR LA MODALE ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<TicketType | null>(null);

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const isViewer = raw?.role === "viewer";
  const isManager = raw?.role === "manager" || raw?.role === "admin";

  // Filtrage intelligent des tickets
  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter(ticket => ticket.status === statusFilter);
  }, [tickets, statusFilter]);

  // Statistiques pour les managers
  const ticketStats = useMemo(() => {
    const stats = {
      total: tickets.length,
      non_traitee: tickets.filter(t => t.status === 'non_traitee').length,
      en_cours: tickets.filter(t => t.status === 'en_cours').length,
      traitee: tickets.filter(t => t.status === 'traitee').length,
    };
    return stats;
  }, [tickets]);

  // Helper function pour les labels de statut
  const getStatusLabel = (status: TicketType['status']) => {
    switch (status) {
      case 'non_traitee': return 'non traité';
      case 'en_cours': return 'en cours';
      case 'traitee': return 'traité';
      default: return '';
    }
  };

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

  // --- AUTRES HANDLERS ---
  const handleCreated = () => {
    loadTickets();
    setShowCreateForm(false);
  };

  // --- ARCHIVAGE DE TICKET ---
  const archiveTicket = async (ticketId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/tickets/${ticketId}/archive`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        await loadTickets(); // Recharger la liste
      } else {
      }
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
    }
  };
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


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      {/* Header moderne avec actions */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl">
                <TicketIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tickets Support</h1>
                <p className="text-sm text-muted-foreground">
                  {isManager 
                    ? `${filteredTickets.length} ticket${filteredTickets.length !== 1 ? 's' : ''} ${statusFilter === 'all' ? 'au total' : getStatusLabel(statusFilter)}`
                    : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} créé${tickets.length !== 1 ? 's' : ''}`
                  }
                </p>
              </div>
            </div>
            
            {isViewer && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Nouveau ticket
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Filtres pour managers */}
        {isManager && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FilterIcon className="h-4 w-4" />
                Filtrer par statut:
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    statusFilter === 'all'
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Tous ({ticketStats.total})
                </button>
                
                <button
                  onClick={() => setStatusFilter('non_traitee')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    statusFilter === 'non_traitee'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Non traités ({ticketStats.non_traitee})
                </button>
                
                <button
                  onClick={() => setStatusFilter('en_cours')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    statusFilter === 'en_cours'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  En cours ({ticketStats.en_cours})
                </button>
                
                <button
                  onClick={() => setStatusFilter('traitee')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    statusFilter === 'traitee'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Traités ({ticketStats.traitee})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zone de création de ticket (collapsible pour viewers) */}
        {showCreateForm && isViewer && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Créer un nouveau ticket</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            <CreateTicketForm onSuccess={handleCreated} />
          </div>
        )}

        {/* Liste des tickets */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <TicketItemSkeleton key={i} />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center text-muted-foreground py-20 border-2 border-dashed border-border rounded-2xl bg-muted/30">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted rounded-2xl">
                  <TicketIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-medium">
                    {statusFilter === 'all' 
                      ? (isViewer ? "Aucun ticket créé" : "Aucun ticket") 
                      : `Aucun ticket ${getStatusLabel(statusFilter)}`
                    }
                  </p>
                  <p className="text-sm">
                    {isViewer 
                      ? "Créez votre premier ticket pour obtenir de l'aide"
                      : statusFilter === 'all' 
                        ? "Les nouveaux tickets apparaîtront ici"
                        : "Aucun ticket avec ce statut pour le moment"
                    }
                  </p>
                </div>
                {isViewer && statusFilter === 'all' && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Créer mon premier ticket
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTickets.map((t) => (
                <TicketItem
                  key={t.id}
                  ticket={t}
                  isManager={isManager}
                  onStatusChange={changeStatus}
                  onDeleteRequest={handleDeleteRequest}
                  onAddComment={addComment}
                  onArchive={archiveTicket}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
