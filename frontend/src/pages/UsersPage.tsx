// src/pages/UsersPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import type { InviteType } from "../types";

// --- ICÔNES SVG ---
const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.67c.12-.14.237-.285.35-.437m-1.548-3.07a.75.75 0 00-1.06-1.06l-1.5 1.5a.75.75 0 001.06 1.06l1.5-1.5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H15m-1.5 0H9"
    />
  </svg>
);
const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
    />
  </svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134h-3.868c-1.123 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0"
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
      const data = await res.json();
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
        body: JSON.stringify({ email }),
      });
      setStatus(`✅ Invitation envoyée à ${email}`);
      setEmail("");
      await loadInvites();
    } catch (error) {
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
