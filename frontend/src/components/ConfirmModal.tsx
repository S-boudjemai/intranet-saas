// src/components/ConfirmModal.tsx
import React from "react";

// --- ICÔNE SVG ---
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
    />
  </svg>
);

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    // Overlay
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      {/* Conteneur de la modale */}
      <div
        className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md animate-scale-in"
        onClick={(e) => e.stopPropagation()} // Empêche la fermeture en cliquant sur la modale
      >
        <div className="p-6 flex items-start space-x-4">
          {/* Icône d'avertissement */}
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 sm:mx-0 sm:h-10 sm:w-10">
            <ExclamationTriangleIcon
              className="h-6 w-6 text-destructive"
              aria-hidden="true"
            />
          </div>

          <div className="mt-0 text-left">
            <h3
              className="text-lg font-bold leading-6 text-foreground"
              id="modal-title"
            >
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">{children}</p>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="bg-muted/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90 sm:ml-3 sm:w-auto"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirmer
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-muted sm:mt-0 sm:w-auto"
            onClick={onClose}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
