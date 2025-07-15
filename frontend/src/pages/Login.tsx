// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom"; // <-- Ajout de Link
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import { ExclamationCircleIcon, ArrowLeftIcon } from "../components/icons";

interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // Fonction pour déterminer la redirection basée sur le rôle
  const getRedirectPath = (userRole?: string) => {
    if (state?.from?.pathname) {
      return state.from.pathname;
    }
    
    // Redirection basée sur le rôle
    switch (userRole) {
      case 'admin':
      case 'manager':
        return '/dashboard';
      case 'viewer':
        return '/documents';
      default:
        return '/documents';
    }
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirection automatique après login réussi
  useEffect(() => {
    if (user) {
      const redirectPath = getRedirectPath(user.role);
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // La redirection se fait automatiquement via useEffect
    } catch (err: any) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    }
  };

  const inputClasses = `
    bg-input border border-border rounded-md w-full p-3 
    text-foreground placeholder:text-muted-foreground
    focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none
    transition-all duration-300
  `;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo de l'application */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground tracking-wider">
            FRANCHISE<span className="text-primary">HUB</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Connectez-vous à votre espace.
          </p>
        </div>

        {/* Formulaire de connexion */}
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border/50 rounded-lg p-8 space-y-6"
        >
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm font-medium flex items-center gap-2">
              <ExclamationCircleIcon className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              className={inputClasses}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              className={inputClasses}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Se connecter
            </Button>
          </div>
        </form>

        {/* ----- LIEN DE RETOUR AJOUTÉ ICI ----- */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
          >
            <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Retour à la page d'accueil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
