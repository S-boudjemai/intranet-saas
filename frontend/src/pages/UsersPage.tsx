// src/pages/UsersPage.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import type { InviteType } from "../types";
import { UsersIcon, PaperAirplaneIcon, TrashIcon } from "../components/icons";

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
          <UsersIcon className="h-6 w-6 text-primary" />
        </motion.div>
        <span>Gestion des Utilisateurs</span>
      </motion.h1>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Colonne de gauche : Formulaire d'invitation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-1"
        >
          <form
            onSubmit={handleInviteSubmit}
            className="p-6 bg-card border border-border rounded-2xl space-y-4"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg font-bold text-card-foreground"
            >
              Inviter un nouveau franchisé
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
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
                className="bg-input border border-border rounded-xl w-full p-3 text-foreground focus:border-primary focus:ring-primary/20 focus:outline-none transition-all duration-300"
              />
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 px-4 rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              <span>Envoyer l'invitation</span>
            </motion.button>
            {status && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-center text-muted-foreground"
              >
                {status}
              </motion.p>
            )}
          </form>
        </motion.div>

        {/* Colonne de droite : Liste des invitations */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg font-bold text-foreground mb-4"
          >
            Invitations en attente
          </motion.h2>
          <div className="bg-card border border-border rounded-2xl" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <ul className="divide-y divide-border">
              {loading ? (
                <motion.li 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 text-center text-muted-foreground"
                >
                  Chargement...
                </motion.li>
              ) : invites.filter((inv) => !inv.used_at).length === 0 ? (
                <motion.li 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="p-4 text-center text-muted-foreground"
                >
                  Aucune invitation en attente.
                </motion.li>
              ) : (
                invites
                  .filter((inv) => !inv.used_at)
                  .map((invite, index) => (
                    <motion.li
                      key={invite.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="p-4 flex justify-between items-center hover:bg-accent transition-colors duration-200"
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
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRevokeRequest(invite)}
                        className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </motion.button>
                    </motion.li>
                  ))
              )}
            </ul>
          </div>
        </motion.div>
      </motion.div>

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
    </motion.div>
  );
}
