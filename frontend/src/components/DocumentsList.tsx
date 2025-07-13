// src/components/DocumentsList.tsx
import React from "react";

// --- ICÔNES SVG ---
const DocumentTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);
// --- FIN ICÔNES SVG ---

// Note: L'interface DocumentType devrait être importée depuis un fichier central `src/types`
export interface DocumentType {
  id: string;
  name: string;
  tenant_id: string;
  is_deleted: boolean;
  url: string;
}

interface DocumentsListProps {
  documents: DocumentType[];
  onDownload: (filename: string) => void;
}

export default function DocumentsList({
  documents,
  onDownload,
}: DocumentsListProps) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-foreground mb-4 tracking-tight">
        Documents Disponibles
      </h2>
      <ul className="space-y-3">
        {documents.length === 0 && (
          <li className="bg-card/50 border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
            Aucun document disponible pour le moment.
          </li>
        )}
        {documents.map(
          (doc) =>
            !doc.is_deleted && (
              <li
                key={doc.id}
                className="
                  bg-card border border-border 
                  rounded-lg p-3 pr-4
                  flex justify-between items-center 
                  transition-all duration-300
                  hover:border-primary/30 hover:bg-secondary
                "
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="h-6 w-6 text-primary mr-4" />
                  <span className="font-medium text-foreground">
                    {doc.name}
                  </span>
                </div>
                <button
                  className="
                    flex items-center space-x-2
                    px-3 py-2 rounded-md 
                    text-sm font-semibold
                    bg-primary/10 text-primary 
                    hover:bg-primary/20
                    transition-colors duration-200
                  "
                  onClick={() => onDownload(doc.url)}
                >
                  <DownloadIcon className="h-5 w-5" />
                  <span>Télécharger</span>
                </button>
              </li>
            )
        )}
      </ul>
    </div>
  );
}
