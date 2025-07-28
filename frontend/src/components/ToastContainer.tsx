import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Toast, { ToastProps } from './Toast';

interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5
}) => {
  const [toasts, setToasts] = useState<(ToastProps & { createdAt: number })[]>([]);

  const addToast = useCallback((toastData: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = {
      ...toastData,
      id,
      createdAt: Date.now(),
      onClose: (toastId: string) => removeToast(toastId)
    };

    setToasts(current => {
      // Ajouter le nouveau toast
      let updated = [...current, newToast];
      
      // Limiter le nombre de toasts affichés
      if (updated.length > maxToasts) {
        updated = updated.slice(-maxToasts);
      }
      
      return updated;
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-0 right-0 items-start';
      case 'top-left':
        return 'top-0 left-0 items-start';
      case 'bottom-right':
        return 'bottom-0 right-0 items-end';
      case 'bottom-left':
        return 'bottom-0 left-0 items-end';
      case 'top-center':
        return 'top-0 left-1/2 transform -translate-x-1/2 items-start';
      case 'bottom-center':
        return 'bottom-0 left-1/2 transform -translate-x-1/2 items-end';
      default:
        return 'top-0 right-0 items-start';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, clearAll }}>
      {children}
      
      {/* Toast Container */}
      <div
        className={`
          fixed z-50 p-4 space-y-4 pointer-events-none
          ${getPositionClasses()}
        `}
        style={{ maxWidth: '400px' }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              className="pointer-events-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Toast {...toast} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

// Hook utilitaires pour les cas d'usage courants
export const useToastHelpers = () => {
  const { addToast } = useToast();

  return {
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    
    warning: (title: string, description?: string) =>
      addToast({ type: 'warning', title, description }),
    
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
    
    // Messages spécifiques à FranchiseDesk
    ticketCreated: () =>
      addToast({
        type: 'success',
        title: 'Ticket créé avec succès',
        description: 'Votre demande de support a été transmise à l\'équipe.'
      }),
    
    ticketArchived: () =>
      addToast({
        type: 'info',
        title: 'Ticket archivé',
        description: 'Le ticket a été déplacé vers les archives.'
      }),
    
    documentUploaded: (fileName: string) =>
      addToast({
        type: 'success',
        title: 'Document uploadé',
        description: `${fileName} a été ajouté avec succès.`
      }),
    
    auditCompleted: () =>
      addToast({
        type: 'success',
        title: 'Audit terminé',
        description: 'L\'audit a été marqué comme terminé.'
      }),
    
    networkError: () =>
      addToast({
        type: 'error',
        title: 'Erreur de connexion',
        description: 'Vérifiez votre connexion internet et réessayez.',
        duration: 0, // Persistant
        action: {
          label: 'Réessayer',
          onClick: () => window.location.reload()
        }
      })
  };
};