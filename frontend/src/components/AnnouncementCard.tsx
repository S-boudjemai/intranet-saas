// src/components/AnnouncementCard.tsx
import React, { useState } from "react";
import type { Announcement } from "../types"; // <-- Importer depuis le fichier central
import { useAuth } from "../contexts/AuthContext";
import DocumentPreviewModal from "./DocumentPreviewModal";
import { SpeakerphoneIcon, EyeIcon, TrashIcon } from "./icons";

// --- ICÔNES LOCALES SUPPRIMÉES, UTILISATION CENTRALISÉE ---

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
  const { token } = useAuth();
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  // Fonction pour prévisualiser un document
  const handlePreview = async (documentUrl: string, name: string) => {
    if (!token) return;
    
    try {
      // Extraire le nom du fichier depuis l'URL stockée en base
      let filename = documentUrl;
      
      // Si c'est une URL S3 complète, extraire juste le nom du fichier
      if (documentUrl.includes('amazonaws.com/')) {
        const urlParts = documentUrl.split('/');
        filename = urlParts[urlParts.length - 1].split('?')[0]; // Enlever les paramètres query
      }
      
      console.log('🔍 Preview - Original URL:', documentUrl);
      console.log('🔍 Preview - Extracted filename:', filename);
      
      // Utiliser l'endpoint de téléchargement pour avoir une URL présignée fraîche
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/documents/download-url?filename=${encodeURIComponent(filename)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!res.ok) {
        throw new Error(`Could not get preview URL: ${res.status}`);
      }
      
      const response = await res.json();
      const { url } = response.data || response;
      
      console.log('✅ Preview - Got presigned URL:', url);
      setPreview({ url, name });
    } catch (error) {
      console.error("❌ Error getting preview URL:", error);
      // Fallback: essayer avec l'URL originale
      setPreview({ url: documentUrl, name });
    }
  };

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

        {/* Documents attachés */}
        {announcement.documents && announcement.documents.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Documents joints :
            </p>
            <div className="space-y-2">
              {announcement.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-primary">📄</span>
                    <span className="text-sm font-medium text-secondary-foreground truncate">
                      {doc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(doc.url, doc.name)}
                      className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                      title="Aperçu"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de prévisualisation */}
      {preview && (
        <DocumentPreviewModal {...preview} onClose={() => setPreview(null)} />
      )}
    </div>
  );
}
