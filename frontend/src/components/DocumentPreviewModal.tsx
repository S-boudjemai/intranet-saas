// src/components/DocumentPreviewModal.tsx


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
  // Détecter le type de fichier depuis le nom, et utiliser l'URL comme fallback
  let fileName = name;
  
  // Si le nom n'a pas d'extension, essayer d'extraire depuis l'URL
  if (!name.includes('.')) {
    const urlWithoutParams = url.split('?')[0]; // Enlever les paramètres query
    const urlParts = urlWithoutParams.split('/');
    fileName = urlParts[urlParts.length - 1];
  }
  
  const isPdf = fileName.toLowerCase().endsWith(".pdf");
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
  

  return (
    // Overlay Waitify
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
    >
      {/* Container Waitify */}
      <div
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }}
      >
        {/* Header Waitify */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{name}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-300"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu Waitify */}
        <div className="p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
          {isPdf ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <iframe
                src={url}
                title={name}
                className="w-full h-[75vh]"
                onError={() => {
                  // PDF loading error
                }}
              />
            </div>
          ) : isImage ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
              <img
                src={url}
                alt={name}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
                onError={() => {
                  // Image loading error
                }}
                onLoad={() => {
                  // Image loaded successfully
                }}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center h-[75vh] text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4">
                <div className="text-4xl">📄</div>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{name}</p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Aperçu non disponible pour ce type de fichier
              </p>
              <button
                onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md font-medium"
              >
                Ouvrir dans un nouvel onglet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
