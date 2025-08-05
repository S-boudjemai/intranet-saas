import React from 'react';
import toast from 'react-hot-toast';

export const ToastTest: React.FC = () => {
  // Toast functions

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      <div className="bg-background p-4 rounded-lg shadow-lg border border-border">
        <h3 className="font-bold mb-2 text-foreground">Test Toast System</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toast.success('Opération réussie !')}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Success
          </button>
          <button
            onClick={() => toast.error('Une erreur est survenue')}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Error
          </button>
          <button
            onClick={() => toast('Attention requise', { icon: '⚠️' })}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
          >
            Warning
          </button>
          <button
            onClick={() => toast('Information importante', { icon: 'ℹ️' })}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Info
          </button>
        </div>
      </div>
    </div>
  );
};