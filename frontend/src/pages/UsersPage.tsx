// src/pages/UsersPage.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import type { InviteType } from "../types";
import { UsersIcon, PaperAirplaneIcon, TrashIcon } from "../components/icons";
import { UserListSkeleton } from "../components/Skeleton";

// --- ICÔNES LOCALES SUPPRIMÉES, UTILISATION CENTRALISÉE ---

export default function UsersPage() {
  const { token } = useAuth();
  const [invites, setInvites] = useState<InviteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [inviteToRevoke, setInviteToRevoke] = useState<InviteType | null>(null);

  const loadInvites = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const responseData = await res.json();
      // L'API retourne {success: true, data: [...]} 
      const data = responseData.data || responseData;
      setInvites(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, [token]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Envoi en cours...");
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          email,
          // Ne pas envoyer les champs optionnels vides pour éviter les validations
          // Optional fields can be added later
        }),
      });
      setStatus(`✅ Invitation envoyée à ${email}`);
      setEmail("");
      await loadInvites();
    } catch {
      setStatus("Erreur lors de l'envoi de l'invitation.");
    }
  };

  const handleRevokeRequest = (invite: InviteType) => {
    setInviteToRevoke(invite);
    setIsConfirmModalOpen(true);
  };

  const confirmRevoke = async () => {
    if (!inviteToRevoke) return;
    await fetch(
      `${import.meta.env.VITE_API_URL}/invites/${inviteToRevoke.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    await loadInvites();
    setInviteToRevoke(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Gestion des Utilisateurs
            </h1>
          </div>
          <p className="text-muted-foreground">
            Invitez et gérez les utilisateurs de votre franchise
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Colonne de gauche : Formulaire d'invitation */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6">
              <form onSubmit={handleInviteSubmit} className="space-y-4">
              <h2 className="text-lg font-bold text-card-foreground">
                Inviter un nouveau franchisé
              </h2>
              <div>
                <label
                  htmlFor="email-invite"
                  className="block text-sm font-medium text-muted-foreground mb-2"
                >
                  Email du destinataire
                </label>
                <input
                  id="email-invite"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nom@exemple.com"
                  className="w-full p-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
              </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  <span>Envoyer l'invitation</span>
                </button>
                {status && (
                  <p className="text-sm text-center text-muted-foreground">
                    {status}
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Colonne de droite : Liste des invitations */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">
                  Invitations en attente
                </h2>
              </div>
              <ul className="divide-y divide-border">
                {loading ? (
                  <li className="p-4">
                    <UserListSkeleton />
                  </li>
                ) : invites.filter((inv) => !inv.used_at).length === 0 ? (
                  <li className="p-6 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-muted rounded-xl">
                        <UsersIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium">Aucune invitation en attente</p>
                      <p className="text-sm">Les nouvelles invitations apparaîtront ici</p>
                    </div>
                  </li>
                ) : (
                  invites
                    .filter((inv) => !inv.used_at)
                    .map((invite, index) => (
                      <li
                        key={invite.id}
                        className="p-4 flex justify-between items-center hover:bg-accent transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {invite.invite_email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expire le{" "}
                            {new Date(invite.expires_at).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRevokeRequest(invite)}
                          className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmRevoke}
        title="Révoquer l'invitation"
      >
        Êtes-vous sûr de vouloir révoquer l'invitation pour "
        <span className="font-bold">{inviteToRevoke?.invite_email}</span>" ? Le
        lien ne sera plus valide.
      </ConfirmModal>
    </div>
  );
}
