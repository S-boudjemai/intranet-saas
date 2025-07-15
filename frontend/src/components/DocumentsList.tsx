// src/components/DocumentsList.tsx

import { DocumentTextIcon, DownloadIcon } from "../components/icons";

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
