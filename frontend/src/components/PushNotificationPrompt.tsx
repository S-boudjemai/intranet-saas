// src/components/PushNotificationPrompt.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellIcon, XIcon } from './icons';
import { oneSignalService } from '../services/oneSignalService';

interface PushNotificationPromptProps {
  onDismiss?: () => void;
  onAccept?: () => void;
}

export const PushNotificationPrompt = ({ onDismiss, onAccept }: PushNotificationPromptProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier si les notifications sont supportées et non encore activées
    const checkPermission = async () => {
      if (!oneSignalService.isBrowserSupported()) return;
      
      const permission = Notification.permission;
      const hasShownPrompt = localStorage.getItem('push-prompt-shown');
      
      // Détection iOS/PWA
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      // Sur iOS, attendre que la PWA soit installée
      if (isIOS && !isPWA) {
        console.log('[Push Prompt] iOS détecté sans PWA - attente installation');
        return;
      }
      
      // Afficher seulement si pas encore demandé et supporté
      if (permission === 'default' && !hasShownPrompt) {
        setIsVisible(true);
      }
    };

    // Délai plus long sur iOS pour laisser temps d'installer la PWA
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const delay = isIOS ? 10000 : 3000; // 10s sur iOS, 3s ailleurs
    
    setTimeout(checkPermission, delay);
  }, []);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const granted = await oneSignalService.requestPermission();
      
      if (granted) {
        // Permission accordée, s'abonner
        await oneSignalService.subscribeUser();
        onAccept?.();
        localStorage.setItem('push-prompt-shown', 'true');
        setIsVisible(false);
      } else {
        // Permission refusée ou bloquée
        // Le message d'aide sera affiché par requestPermission
        localStorage.setItem('push-prompt-shown', 'true');
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Push notification error:', error);
      // En cas d'erreur, fermer quand même le prompt
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-prompt-shown', 'true');
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="p-3 bg-primary/10 rounded-xl flex-shrink-0"
            >
              <BellIcon className="h-6 w-6 text-primary" />
            </motion.div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                Restez informé
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Recevez des notifications pour les nouvelles annonces, documents et tickets
                {/iPad|iPhone|iPod/.test(navigator.userAgent) && (
                  <span className="block mt-1 text-xs text-amber-600 dark:text-amber-400">
                    💡 Sur iOS, installez d'abord l'app depuis Safari
                  </span>
                )}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 bg-primary text-primary-foreground text-sm px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {isLoading ? 'Configuration...' : 'Activer'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};