// src/pages/UsersPage.tsx
import { useState, useEffect } from "react";
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
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
        <div className="p-2 bg-card border border-border rounded-lg">
          <UsersIcon className="h-6 w-6 text-primary" />
        </div>
        <span>Gestion des Utilisateurs</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne de gauche : Formulaire d'invitation */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handleInviteSubmit}
            className="p-6 bg-card border border-border rounded-lg space-y-4"
          >
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
                className="bg-input border border-border rounded-md w-full p-2 text-foreground focus:border-primary focus:ring-primary/30 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              <span>Envoyer l'invitation</span>
            </button>
            {status && (
              <p className="text-sm text-center text-muted-foreground">
                {status}
              </p>
            )}
          </form>
        </div>

        {/* Colonne de droite : Liste des invitations */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Invitations en attente
          </h2>
          <div className="bg-card border border-border rounded-lg">
            <ul className="divide-y divide-border">
              {loading ? (
                <li className="p-4 text-center text-muted-foreground">
                  Chargement...
                </li>
              ) : invites.filter((inv) => !inv.used_at).length === 0 ? (
                <li className="p-4 text-center text-muted-foreground">
                  Aucune invitation en attente.
                </li>
              ) : (
                invites
                  .filter((inv) => !inv.used_at)
                  .map((invite) => (
                    <li
                      key={invite.id}
                      className="p-4 flex justify-between items-center"
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
                        className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </li>
                  ))
              )}
            </ul>
          </div>
        </div>
      </div>

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
