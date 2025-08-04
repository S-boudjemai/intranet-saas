// src/hooks/useErrorHandler.ts
// SOFIANE : Hook centralisé pour gestion d'erreurs dans module audits

import { useState } from 'react';

export interface ErrorState {
  message: string;
  type: 'network' | 'api' | 'validation' | 'unknown';
  code?: string;
  details?: any;
}

export const useErrorHandler = () => {
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = (error: any, context?: string): ErrorState => {
    console.error(`Error in ${context || 'unknown context'}:`, error);

    let errorState: ErrorState;

    if (error?.response) {
      // Erreur API avec réponse serveur
      const status = error.response.status;
      const data = error.response.data;

      if (status >= 400 && status < 500) {
        errorState = {
          message: data?.message || `Erreur client (${status})`,
          type: 'api',
          code: status.toString(),
          details: data
        };
      } else if (status >= 500) {
        errorState = {
          message: 'Erreur serveur. Veuillez réessayer plus tard.',
          type: 'api',
          code: status.toString()
        };
      } else {
        errorState = {
          message: data?.message || 'Erreur API inconnue',
          type: 'api',
          code: status.toString()
        };
      }
    } else if (error?.message?.includes('fetch') || error?.message?.includes('Network')) {
      // Erreur réseau
      errorState = {
        message: 'Problème de connexion réseau. Vérifiez votre connexion internet.',
        type: 'network'
      };
    } else if (error?.name === 'ValidationError') {
      // Erreur de validation
      errorState = {
        message: error.message || 'Données invalides',
        type: 'validation',
        details: error.details
      };
    } else {
      // Erreur générique
      errorState = {
        message: error?.message || 'Une erreur inattendue s\'est produite',
        type: 'unknown',
        details: error
      };
    }

    setError(errorState);
    return errorState;
  };

  const clearError = () => {
    setError(null);
  };

  const withErrorHandling = async <T>(
    asyncFn: () => Promise<T>, 
    context?: string,
    options?: {
      showToast?: boolean;
      onError?: (error: ErrorState) => void;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    clearError();

    try {
      const result = await asyncFn();
      setIsLoading(false);
      return result;
    } catch (err) {
      const errorState = handleError(err, context);
      setIsLoading(false);
      
      if (options?.onError) {
        options.onError(errorState);
      }
      
      return null;
    }
  };

  const getErrorMessage = (errorState?: ErrorState): string => {
    if (!errorState) return '';

    switch (errorState.type) {
      case 'network':
        return '🌐 ' + errorState.message;
      case 'api':
        return '⚠️ ' + errorState.message;
      case 'validation':
        return '📝 ' + errorState.message;
      default:
        return '❌ ' + errorState.message;
    }
  };

  const getErrorActions = (errorState?: ErrorState): Array<{label: string, action: () => void}> => {
    if (!errorState) return [];

    const actions: Array<{label: string, action: () => void}> = [
      { label: 'Fermer', action: clearError }
    ];

    if (errorState.type === 'network') {
      actions.unshift({ 
        label: 'Réessayer', 
        action: () => window.location.reload() 
      });
    }

    return actions;
  };

  return {
    error,
    isLoading,
    handleError,
    clearError,
    withErrorHandling,
    getErrorMessage,
    getErrorActions
  };
};

export default useErrorHandler;