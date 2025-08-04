// src/components/ui/ErrorDisplay.tsx
// SOFIANE : Composant d'affichage d'erreurs centralisé

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import Card from './Card';
import { XMarkIcon, ExclamationCircleIcon, ClipboardIcon } from '../../components/icons';
import type { ErrorState } from '../../hooks/useErrorHandler';

interface ErrorDisplayProps {
  error: ErrorState | null;
  onRetry?: () => void;
  onClose?: () => void;
  compact?: boolean;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onClose,
  compact = false,
  className = ''
}) => {
  if (!error) return null;

  const getIcon = () => {
    switch (error.type) {
      case 'network':
        return <ExclamationCircleIcon className="h-8 w-8 text-red-500" />;
      case 'api':
        return <ExclamationCircleIcon className="h-8 w-8 text-orange-500" />;
      case 'validation':
        return <ClipboardIcon className="h-8 w-8 text-yellow-500" />;
      default:
        return <ExclamationCircleIcon className="h-8 w-8 text-red-500" />;
    }
  };

  const getBgColor = () => {
    switch (error.type) {
      case 'network':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'api':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'validation':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    }
  };

  if (compact) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`rounded-lg border p-4 ${getBgColor()} ${className}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getIcon()}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {error.message}
                </p>
                {error.code && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Code: {error.code}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRetry}
                  className="text-xs"
                >
                  Réessayer
                </Button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={className}
      >
        <Card className={`p-8 text-center ${getBgColor()}`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className="mb-4"
          >
            {getIcon()}
          </motion.div>
          
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {error.type === 'network' && 'Problème de Connexion'}
            {error.type === 'api' && 'Erreur du Serveur'}
            {error.type === 'validation' && 'Données Invalides'}
            {error.type === 'unknown' && 'Erreur Inattendue'}
          </h3>
          
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {error.message}
          </p>

          {error.code && (
            <p className="text-xs text-muted-foreground mb-4">
              Code d'erreur: {error.code}
            </p>
          )}

          <div className="flex justify-center gap-3">
            {onRetry && error.type === 'network' && (
              <Button
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <ExclamationCircleIcon className="h-4 w-4" />
                Réessayer
              </Button>
            )}
            
            {onRetry && error.type === 'api' && (
              <Button
                onClick={onRetry}
                variant="outline"
              >
                Réessayer
              </Button>
            )}
            
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
              >
                Fermer
              </Button>
            )}
          </div>

          {error.details && process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Détails techniques (dev only)
              </summary>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorDisplay;