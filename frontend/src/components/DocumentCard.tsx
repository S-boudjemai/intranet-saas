// src/components/DocumentCard.tsx

import type { DocumentType } from "../types";
import Card from "./ui/Card";
import { DocumentTextIcon, DownloadIcon, TagIcon, TrashIcon, EyeIcon } from "../components/icons";

// --- FIN DES ICÔNES SVG ---

interface DocumentCardProps {
  doc: DocumentType;
  canManage: boolean;
  onDelete: (id: string) => void;
  onPreview: (url: string, name: string) => void;
  onDownload: (url: string) => void;
  onTagClick: (tagId: string) => void;
  onManageTags: () => void;
}

export default function DocumentCard({
  doc,
  canManage,
  onDelete,
  onPreview,
  onDownload,
  onTagClick,
  onManageTags,
}: DocumentCardProps) {
  return (
    <Card 
      hover={true} 
      className="flex flex-col group animate-slide-up"
    >
      <div className="p-5 flex-grow">
        <div className="flex items-start justify-between">
          <div className="p-2 bg-primary/10 rounded-lg mb-4">
            <DocumentTextIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {canManage && (
              <button
                onClick={onManageTags}
                className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                title="Gérer les tags"
              >
                <TagIcon className="h-5 w-5" />
              </button>
            )}
            {canManage && (
              <button
                onClick={() => onDelete(doc.id)}
                className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Supprimer le document"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <h3 className="font-bold text-lg text-card-foreground truncate mb-3">
          {doc.name}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-h-[52px]">
          {doc.tags?.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onTagClick(tag.id)}
              className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              # {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-2 bg-secondary/30 rounded-b-lg flex items-center justify-around">
        <button
          onClick={() => onPreview(doc.url, doc.name)}
          className="w-full text-sm font-semibold text-foreground/80 hover:text-primary flex items-center justify-center gap-2 p-2 rounded-md hover:bg-primary/10 transition-colors"
        >
          <EyeIcon className="h-5 w-5" />
          <span>Aperçu</span>
        </button>
        <button
          onClick={() => onDownload(doc.url)}
          className="w-full text-sm font-semibold text-foreground/80 hover:text-primary flex items-center justify-center gap-2 p-2 rounded-md hover:bg-primary/10 transition-colors"
        >
          <DownloadIcon className="h-5 w-5" />
          <span>Télécharger</span>
        </button>
      </div>
    </Card>
  );
}
