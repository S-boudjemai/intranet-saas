// src/components/AnnouncementCard.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import type { Announcement } from "../types";
import { useAuth } from "../contexts/AuthContext";
import DocumentPreviewModal from "./DocumentPreviewModal";
import { SpeakerphoneIcon, EyeIcon, TrashIcon } from "./icons";
import { useAnnouncementTracking } from "../hooks/useAnnouncementTracking";
import AnnouncementViewStats from "./AnnouncementViewStats";
import AnnouncementViewModal from "./AnnouncementViewModal";

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
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Auto-tracking : marquer l'annonce comme lue après 3 secondes
  const { isTracked } = useAnnouncementTracking(announcement.id);

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
      
      setPreview({ url, name });
    } catch (error) {
      // Error getting preview URL
      // Fallback: essayer avec l'URL originale
      setPreview({ url: documentUrl, name });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: "easeOut" 
      }}
      className="relative pl-12"
    >
      {/* Timeline Dot & Line */}
      <div className="absolute left-4 top-1 h-full border-l-2 border-border"></div>
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className="absolute left-4 top-1 transform -translate-x-1/2 bg-primary/10 rounded-full p-2"
      >
        <SpeakerphoneIcon className="h-4 w-4 text-primary" />
      </motion.div>

      {/* Announcement Card */}
      <motion.div 
        whileHover={{ 
          y: -8,
          transition: { type: "spring", stiffness: 300, damping: 20 }
        }}
        whileTap={{ scale: 0.98 }}
        className="bg-card border border-border rounded-2xl p-6 group cursor-pointer"
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
        }}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-bold text-lg text-card-foreground"
            >
              {announcement.title}
            </motion.h2>
            
            {/* Stats de lecture pour managers */}
            {canManage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-2"
              >
                <button
                  onClick={() => setShowViewModal(true)}
                  className="transition-transform hover:scale-105"
                >
                  <AnnouncementViewStats 
                    announcementId={announcement.id} 
                    canManage={canManage} 
                  />
                </button>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <motion.small 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-xs text-right flex-shrink-0"
            >
              {formatDate(announcement.created_at)}
            </motion.small>
            {canManage && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 0, x: 0 }}
                whileHover={{ opacity: 1, x: 0, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => onDeleteRequest(announcement)}
                className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <TrashIcon className="h-5 w-5" />
              </motion.button>
            )}
          </div>
        </div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-muted-foreground leading-relaxed"
        >
          {announcement.content}
        </motion.p>

        {/* Documents attachés */}
        {announcement.documents && announcement.documents.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-4 border-t border-border"
          >
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Documents joints :
            </p>
            <div className="space-y-2">
              {announcement.documents.map((doc, index) => (
                <motion.div 
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center justify-between p-3 bg-muted rounded-xl hover:bg-primary/5 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="p-2 bg-primary/10 rounded-lg"
                    >
                      <span className="text-primary text-sm">📄</span>
                    </motion.div>
                    <span className="text-sm font-medium text-foreground truncate">
                      {doc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePreview(doc.url, doc.name)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-300"
                      title="Aperçu"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Modal de prévisualisation */}
      {preview && (
        <DocumentPreviewModal {...preview} onClose={() => setPreview(null)} />
      )}

      {/* Modal des vues d'annonce */}
      <AnnouncementViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        announcementId={announcement.id}
        announcementTitle={announcement.title}
      />
    </motion.div>
  );
}
