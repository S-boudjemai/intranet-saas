import React from 'react';
import { useToast, type Toast, type ToastType } from '../../contexts/ToastContext';
import { XIcon } from '../icons';

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const iconClass = "w-5 h-5 mr-3 flex-shrink-0";
  
  switch (type) {
    case 'success':
      return (
        <svg className={`${iconClass} text-green-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className={`${iconClass} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={`${iconClass} text-yellow-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'info':
      return (
        <svg className={`${iconClass} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const { hideToast } = useToast();

  const getToastStyles = (type: ToastType) => {
    const baseStyles = "flex items-center w-full max-w-md mx-auto mb-4 text-sm bg-white rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-in-out";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-500 text-green-800`;
      case 'error':
        return `${baseStyles} border-red-500 text-red-800`;
      case 'warning':
        return `${baseStyles} border-yellow-500 text-yellow-800`;
      case 'info':
        return `${baseStyles} border-blue-500 text-blue-800`;
      default:
        return `${baseStyles} border-gray-500 text-gray-800`;
    }
  };

  const animationClass = toast.isVisible 
    ? "transform translate-x-0 opacity-100" 
    : "transform translate-x-full opacity-0";

  return (
    <div className={`${getToastStyles(toast.type)} ${animationClass}`}>
      <ToastIcon type={toast.type} />
      <div className="flex-1 p-4">
        <p className="font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => hideToast(toast.id)}
        className="p-2 text-gray-900 hover:text-gray-700 transition-colors duration-200"
        aria-label="Fermer notification"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <div className="space-y-2 pointer-events-auto">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
};