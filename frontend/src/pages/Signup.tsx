// src/pages/Signup.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { InviteType } from "../types";
import CityAutocomplete from "../components/CityAutocomplete";
import Button from "../components/ui/Button";
import Card, { CardContent } from "../components/ui/Card";
import { SpinnerIcon, ExclamationCircleIcon } from "../components/icons";

export default function Signup() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const navigate = useNavigate();
  const { setAuthFromSignup } = useAuth();

  const [invite, setInvite] = useState<InviteType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantCity, setRestaurantCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {

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
      .then((inv: InviteType) => {
        setInvite(inv);
        // Pré-remplir les champs si l'invitation contient des infos restaurant
        if (inv.restaurant_name) setRestaurantName(inv.restaurant_name);
        if (inv.restaurant_city) setRestaurantCity(inv.restaurant_city);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingInvite(false));
  }, [inviteToken]);

  // Validation temps réel du mot de passe
  useEffect(() => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
    });
  }, [password]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

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
            // Exclure complètement les champs vides pour éviter les validations
            ...(restaurantName.trim() && { restaurant_name: restaurantName.trim() }),
            ...(restaurantCity.trim() && { restaurant_city: restaurantCity.trim() }),
          }),
        }
      );
      
      
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        
        // Extraire le message d'erreur correctement
        let errorMessage = `Erreur de création (${res.status})`;
        if (body.error?.message) {
          if (Array.isArray(body.error.message)) {
            errorMessage = body.error.message.join(', ');
          } else {
            errorMessage = body.error.message;
          }
        } else if (body.message) {
          errorMessage = body.message;
        }
        
        throw new Error(errorMessage);
      }
      
      // Succès ! Récupérer le token et connecter automatiquement
      const responseData = await res.json();
      
      const access_token = responseData.access_token || responseData.data?.access_token;
      if (!access_token) {
        throw new Error('Token manquant dans la réponse signup');
      }
      
      setAuthFromSignup(access_token);
      
      // Redirection automatique vers dashboard
      navigate("/dashboard", {
        replace: true // Remplace l'entrée signup dans l'historique
      });
    } catch (err: any) {
      // Error handling complete
      setError(err.message);
      // Scroller vers le haut pour voir l'erreur
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

          {/* Affichage d'erreur directement dans le formulaire */}
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm border border-destructive/20">
              <div className="flex items-start gap-3">
                <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Erreur de validation</h4>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Informations du restaurant */}
          <Card padding="md" className="bg-accent/20 border-accent/30">
            <CardContent>
              <h3 className="text-lg font-semibold text-foreground mb-4">Informations du restaurant</h3>
            <div>
              <label
                htmlFor="restaurant-name"
                className="block text-sm font-medium text-muted-foreground mb-2"
              >
                Nom du restaurant
              </label>
              <input
                id="restaurant-name"
                type="text"
                className={inputClasses}
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Ex: Pizzalif Lyon Centre"
              />
            </div>
            <div>
              <CityAutocomplete
                id="restaurant-city"
                label="Ville du restaurant"
                value={restaurantCity}
                onChange={setRestaurantCity}
                placeholder="Commencez à taper le nom de la ville..."
              />
            </div>
            </CardContent>
          </Card>

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
              className={`${inputClasses} ${password && !isPasswordValid ? 'border-destructive focus:border-destructive focus:ring-destructive/30' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Ex: MonMotDePasse123!"
            />
            
            {/* Indicateurs de validation permanents */}
            <div className="mt-2 space-y-1">
              <div className="grid grid-cols-1 gap-1 text-xs">
                <div className={`flex items-center gap-2 transition-colors ${
                  !password ? 'text-muted-foreground' : 
                  passwordValidation.minLength ? 'text-green-600' : 'text-destructive'
                }`}>
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all ${
                    !password ? 'border-muted-foreground bg-transparent' :
                    passwordValidation.minLength ? 'border-green-600 bg-green-600' : 'border-destructive bg-transparent'
                  }`}>
                    {password && passwordValidation.minLength && (
                      <span className="text-white text-[10px] font-bold">✓</span>
                    )}
                    {password && !passwordValidation.minLength && (
                      <span className="text-destructive text-[10px] font-bold">✕</span>
                    )}
                  </span>
                  Au moins 8 caractères
                </div>
                <div className={`flex items-center gap-2 transition-colors ${
                  !password ? 'text-muted-foreground' : 
                  passwordValidation.hasUppercase ? 'text-green-600' : 'text-destructive'
                }`}>
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all ${
                    !password ? 'border-muted-foreground bg-transparent' :
                    passwordValidation.hasUppercase ? 'border-green-600 bg-green-600' : 'border-destructive bg-transparent'
                  }`}>
                    {password && passwordValidation.hasUppercase && (
                      <span className="text-white text-[10px] font-bold">✓</span>
                    )}
                    {password && !passwordValidation.hasUppercase && (
                      <span className="text-destructive text-[10px] font-bold">✕</span>
                    )}
                  </span>
                  Une majuscule (A-Z)
                </div>
                <div className={`flex items-center gap-2 transition-colors ${
                  !password ? 'text-muted-foreground' : 
                  passwordValidation.hasLowercase ? 'text-green-600' : 'text-destructive'
                }`}>
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all ${
                    !password ? 'border-muted-foreground bg-transparent' :
                    passwordValidation.hasLowercase ? 'border-green-600 bg-green-600' : 'border-destructive bg-transparent'
                  }`}>
                    {password && passwordValidation.hasLowercase && (
                      <span className="text-white text-[10px] font-bold">✓</span>
                    )}
                    {password && !passwordValidation.hasLowercase && (
                      <span className="text-destructive text-[10px] font-bold">✕</span>
                    )}
                  </span>
                  Une minuscule (a-z)
                </div>
                <div className={`flex items-center gap-2 transition-colors ${
                  !password ? 'text-muted-foreground' : 
                  passwordValidation.hasNumber ? 'text-green-600' : 'text-destructive'
                }`}>
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all ${
                    !password ? 'border-muted-foreground bg-transparent' :
                    passwordValidation.hasNumber ? 'border-green-600 bg-green-600' : 'border-destructive bg-transparent'
                  }`}>
                    {password && passwordValidation.hasNumber && (
                      <span className="text-white text-[10px] font-bold">✓</span>
                    )}
                    {password && !passwordValidation.hasNumber && (
                      <span className="text-destructive text-[10px] font-bold">✕</span>
                    )}
                  </span>
                  Un chiffre (0-9)
                </div>
                <div className={`flex items-center gap-2 transition-colors ${
                  !password ? 'text-muted-foreground' : 
                  passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-destructive'
                }`}>
                  <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-all ${
                    !password ? 'border-muted-foreground bg-transparent' :
                    passwordValidation.hasSpecialChar ? 'border-green-600 bg-green-600' : 'border-destructive bg-transparent'
                  }`}>
                    {password && passwordValidation.hasSpecialChar && (
                      <span className="text-white text-[10px] font-bold">✓</span>
                    )}
                    {password && !passwordValidation.hasSpecialChar && (
                      <span className="text-destructive text-[10px] font-bold">✕</span>
                    )}
                  </span>
                  Un caractère spécial (@$!%*?&)
                </div>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Button
              type="submit"
              disabled={submitting || !isPasswordValid}
              loading={submitting}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Créer mon compte
            </Button>
            {!isPasswordValid && password && (
              <p className="text-xs text-destructive text-center mt-2">
                Veuillez respecter tous les critères du mot de passe
              </p>
            )}
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
