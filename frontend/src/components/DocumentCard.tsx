// src/components/DocumentCard.tsx
import React from "react";
import type { DocumentType } from "../types";
import Card from "./ui/Card";

// --- DÉBUT DES ICÔNES SVG ---
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

const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M2.036 12.322a1.012 1.012 0 010-.639l4.443-5.558a1.012 1.012 0 011.591 0l4.443 5.558a1.012 1.012 0 010 .639l-4.443 5.558a1.012 1.012 0 01-1.591 0l-4.443-5.558z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.033-2.134h-3.868c-1.123 0-2.033.954-2.033 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0"
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

const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 6h.008v.008H6V6z"
    />
  </svg>
);
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
