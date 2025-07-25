import React from 'react';
import { useToast } from '../contexts/ToastContext';

export const ToastTest: React.FC = () => {
  const { showToast } = useToast();

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border dark:border-gray-700">
        <h3 className="font-bold mb-2 text-gray-900 dark:text-gray-100">Test Toast System</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => showToast('Opération réussie !', 'success')}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Success
          </button>
          <button
            onClick={() => showToast('Une erreur est survenue', 'error')}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Error
          </button>
          <button
            onClick={() => showToast('Attention requise', 'warning')}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
          >
            Warning
          </button>
          <button
            onClick={() => showToast('Information importante', 'info')}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Info
          </button>
        </div>
      </div>
    </div>
  );
};