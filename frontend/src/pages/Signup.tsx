// src/pages/Signup.tsx
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import type { InviteType } from "../types";

// --- ICÔNES SVG ---
const SpinnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg className="animate-spin" {...props}>
    {/* ... */}
  </svg>
);
const ExclamationCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props}>{/* ... */}</svg>
);
// --- FIN ICÔNES SVG ---

export default function Signup() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const navigate = useNavigate();

  const [invite, setInvite] = useState<InviteType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current === true) return;
    effectRan.current = true;

    if (!inviteToken) {
      setError("Le lien d’invitation est invalide.");
      setLoadingInvite(false);
      return;
    }

    // On appelle la nouvelle route qui vérifie le token sans l'utiliser
    fetch(`${import.meta.env.VITE_API_URL}/invites/check/${inviteToken}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Lien invalide ou expiré");
        }
        return res.json();
      })
      .then((inv: InviteType) => setInvite(inv))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingInvite(false));
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // On appelle la route d'authentification sécurisée
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/signup-with-invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: inviteToken,
            password: password,
          }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Erreur de création (${res.status})`);
      }
      // Succès ! On redirige vers la page de connexion avec un message.
      navigate("/login", {
        state: {
          successMessage:
            "Compte créé avec succès ! Vous pouvez maintenant vous connecter.",
        },
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = `bg-input border border-border rounded-md w-full p-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all`;

  const renderCardContent = () => {
    if (loadingInvite) {
      return (
        <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground p-8">
          <SpinnerIcon className="h-8 w-8" />
          <span>Vérification de l'invitation...</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-8 space-y-6">
          <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm font-medium flex flex-col items-center text-center gap-3">
            <ExclamationCircleIcon className="h-8 w-8" />
            <div>
              <h3 className="font-bold text-lg mb-1">Invitation Invalide</h3>
              <p className="text-destructive/80">{error}</p>
            </div>
          </div>
          <Link
            to="/login"
            className="block text-center text-sm text-primary hover:underline"
          >
            Retourner à la page de connexion
          </Link>
        </div>
      );
    }
    if (invite) {
      return (
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <p className="text-center text-muted-foreground">
              Vous êtes invité(e) en tant que :
            </p>
            <p className="text-center text-lg font-bold text-foreground">
              {invite.invite_email}
            </p>
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Choisissez votre mot de passe
            </label>
            <input
              id="password"
              type="password"
              className={inputClasses}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8 caractères minimum"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-md hover:bg-primary/90 active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all"
            >
              {submitting ? "Création en cours..." : "Créer mon compte"}
            </button>
          </div>
        </form>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground tracking-wider">
            FRANCHISE<span className="text-primary">HUB</span>
          </h1>
        </div>
        <div className="bg-card border border-border/50 rounded-lg">
          {renderCardContent()}
        </div>
      </div>
    </div>
  );
}
