// src/components/DocumentPreviewModal.tsx
import React from "react";

// --- ICÔNE SVG ---
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
// --- FIN ICÔNE SVG ---

export interface DocumentPreviewModalProps {
  url: string;
  name: string;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  url,
  name,
  onClose,
}) => {
  const isPdf = url.toLowerCase().endsWith(".pdf");

  return (
    // L'overlay avec un effet de flou et une animation de fondu
    <div
      className="
        fixed inset-0 
        bg-background/80 backdrop-blur-sm 
        flex items-center justify-center 
        z-50
        animate-fade-in
      "
      onClick={onClose} // Permet de fermer la modale en cliquant sur le fond
    >
      {/* On stoppe la propagation du clic pour ne pas fermer la modale en cliquant dessus */}
      <div
        className="
          bg-popover border border-border
          rounded-2xl shadow-xl 
          max-w-4xl w-full max-h-[90vh] 
          flex flex-col
          animate-scale-in
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de la modale */}
        <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-bold text-popover-foreground">{name}</h2>
          <button
            onClick={onClose}
            className="
              p-2 rounded-full text-muted-foreground
              hover:bg-accent hover:text-accent-foreground hover:rotate-90 
              transition-all duration-300
            "
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu de la prévisualisation */}
        <div className="p-4 overflow-auto">
          {isPdf ? (
            <iframe
              src={url}
              title={name}
              className="w-full h-[75vh] rounded-lg"
            />
          ) : (
            <img
              src={url}
              alt={name}
              className="w-full h-auto max-h-[75vh] object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
