// src/components/AnnouncementCard.tsx
import React from "react";
import type { Announcement } from "../types"; // <-- Importer depuis le fichier central

// --- ICÔNES SVG ---
const SpeakerphoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M10.5 6a7.5 7.5 0 100 12h-3a7.5 7.5 0 00-7.5-7.5h1.5v-1.5a7.5 7.5 0 007.5-7.5h3z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 18.75h-1.5a7.5 7.5 0 00-7.5-7.5h-1.5v-1.5a7.5 7.5 0 017.5-7.5h1.5v16.5z"
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
// --- FIN DES ICÔNES SVG ---

interface AnnouncementCardProps {
  announcement: Announcement;
  canManage: boolean;
  onDeleteRequest: (announcement: Announcement) => void; // <-- MODIFIÉ
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AnnouncementCard({
  announcement,
  canManage,
  onDeleteRequest, // <-- MODIFIÉ
}: AnnouncementCardProps) {
  return (
    <div className="relative pl-12">
      {/* Timeline Dot & Line */}
      <div className="absolute left-4 top-1 h-full border-l-2 border-border"></div>
      <div className="absolute left-4 top-1 transform -translate-x-1/2 bg-secondary rounded-full p-1">
        <SpeakerphoneIcon className="h-4 w-4 text-primary" />
      </div>

      {/* Announcement Card */}
      <div className="bg-card border border-border rounded-lg p-5 group">
        <div className="flex justify-between items-start gap-4">
          <h2 className="font-bold text-lg text-card-foreground">
            {announcement.title}
          </h2>
          <div className="flex items-center gap-2">
            <small className="text-muted-foreground text-xs text-right flex-shrink-0">
              {formatDate(announcement.created_at)}
            </small>
            {canManage && (
              <button
                onClick={() => onDeleteRequest(announcement)} // <-- MODIFIÉ
                className="p-1 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-foreground/80 leading-relaxed">
          {announcement.content}
        </p>
      </div>
    </div>
  );
}
