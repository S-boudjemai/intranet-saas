import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon, SpinnerIcon, CheckIcon, LockClosedIcon, EnvelopeIcon, KeyIcon } from '../components/icons';
import { useToast } from '../contexts/ToastContext';

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [formData, setFormData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: 'Très faible',
    color: 'bg-red-500'
  });

  // Calcul de la force du mot de passe
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    let label = 'Très faible';
    let color = 'bg-red-500';

    if (password.length === 0) {
      setPasswordStrength({ score: 0, label: 'Très faible', color: 'bg-red-500' });
      return;
    }

    // Condition 1: Lettres + chiffres (minimum 6 caractères)
    if (password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password)) {
      score = 1;
      label = 'Faible';
      color = 'bg-red-500';
    }

    // Condition 2: + majuscule OU caractère spécial
    if (score === 1 && (/[A-Z]/.test(password) || /[@$!%*?&]/.test(password))) {
      score = 2;
      label = 'Moyenne';
      color = 'bg-orange-500';
    }

    // Condition 3: majuscule ET caractère spécial ET longueur >= 8
    if (password.length >= 8 && /[A-Z]/.test(password) && /[@$!%*?&]/.test(password) && /[a-zA-Z]/.test(password) && /\d/.test(password)) {
      score = 3;
      label = 'Forte';
      color = 'bg-green-500';
    }

    setPasswordStrength({ score, label, color });
  };

  const isPasswordValid = passwordStrength.score >= 2;

  // Countdown pour le bouton renvoyer
  useState(() => {
    const interval = setInterval(() => {
      setResendCooldown(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setCurrentStep('code');
        showToast('Code envoyé à votre email !', 'success');
        setResendCooldown(60);
      } else {
        const data = await response.json();
        showToast(data.message || 'Email non trouvé', 'error');
      }
    } catch (err) {
      showToast('Erreur de connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        showToast('Nouveau code envoyé !', 'success');
        setResendCooldown(60);
      }
    } catch (err) {
      showToast('Erreur lors de l\'envoi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/validate-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
        }),
      });

      if (response.ok) {
        setCurrentStep('password');
      } else {
        showToast('Code invalide ou expiré', 'error');
      }
    } catch (err) {
      showToast('Erreur de connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        setCurrentStep('success');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        showToast('Erreur lors de la réinitialisation', 'error');
      }
    } catch (err) {
      showToast('Erreur de connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `bg-input border border-border rounded-lg w-full p-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all text-lg`;

  const renderStep = () => {
    switch (currentStep) {
      case 'email':
        return (
          <motion.form 
            key="email"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            onSubmit={handleSendCode}
            className="space-y-6"
          >
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Mot de passe oublié ?</h2>
              <p className="text-muted-foreground">Entrez votre email pour recevoir un code</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClasses}
                placeholder="exemple@email.com"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.email}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le code'
              )}
            </button>
          </motion.form>
        );

      case 'code':
        return (
          <motion.form
            key="code"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            onSubmit={handleValidateCode}
            className="space-y-6"
          >
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Vérifiez votre email</h2>
              <p className="text-muted-foreground">Code envoyé à {formData.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Code de validation
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                className={`${inputClasses} text-center text-2xl font-mono tracking-widest`}
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || formData.code.length !== 6}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                  Validation...
                </>
              ) : (
                'Valider le code'
              )}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendCooldown > 0 || loading}
              className="w-full text-primary hover:text-primary/80 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resendCooldown > 0 
                ? `Renvoyer le code dans ${resendCooldown}s` 
                : 'Je n\'ai pas reçu le code'}
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('email')}
              className="w-full text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Changer d'email
            </button>
          </motion.form>
        );

      case 'password':
        return (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            onSubmit={handleResetPassword}
            className="space-y-6"
            layout
          >
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockClosedIcon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Nouveau mot de passe</h2>
              <p className="text-muted-foreground">Créez un mot de passe sécurisé</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                required
                value={formData.newPassword}
                onChange={(e) => {
                  setFormData({ ...formData, newPassword: e.target.value });
                  calculatePasswordStrength(e.target.value);
                }}
                className={inputClasses}
                placeholder="••••••••"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={inputClasses}
                placeholder="••••••••"
              />
            </div>

            {/* Barre de sécurité du mot de passe */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Sécurité :</span>
                  <span className={`text-sm font-medium ${
                    passwordStrength.score === 1 ? 'text-red-600 dark:text-red-400' :
                    passwordStrength.score === 2 ? 'text-orange-600 dark:text-orange-400' :
                    passwordStrength.score === 3 ? 'text-green-600 dark:text-green-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                
                {/* Barre de progression */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 3) * 100}%` }}
                  />
                </div>
                
                {/* Conditions */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className={`transition-colors ${
                    passwordStrength.score >= 1 ? 'text-green-600 dark:text-green-400' : ''
                  }`}>
                    • 6 caractères minimum avec lettres et chiffres
                  </div>
                  <div className={`transition-colors ${
                    passwordStrength.score >= 2 ? 'text-green-600 dark:text-green-400' : ''
                  }`}>
                    • Ajouter une majuscule ou un caractère spécial
                  </div>
                  <div className={`transition-colors ${
                    passwordStrength.score >= 3 ? 'text-green-600 dark:text-green-400' : ''
                  }`}>
                    • 8 caractères avec majuscule et caractère spécial
                  </div>
                  <div className={`transition-colors ${
                    formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword 
                      ? 'text-green-600 dark:text-green-400' 
                      : formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-muted-foreground'
                  }`}>
                    • Les mots de passe correspondent
                  </div>
                </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || formData.newPassword !== formData.confirmPassword}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 px-6 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
          </motion.form>
        );

      case 'success':
        return (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Mot de passe réinitialisé !</h2>
            <p className="text-muted-foreground">Redirection vers la connexion...</p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3 }}
              />
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {['email', 'code', 'password'].map((step, index) => (
              <div
                key={step}
                className={`flex-1 h-1 mx-1 rounded-full transition-all ${
                  ['email', 'code', 'password', 'success'].indexOf(currentStep) >= index
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 transition-all duration-300 ease-out">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {currentStep !== 'success' && (
            <div className="mt-8 text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}