// src/components/DocumentCard.tsx
import { motion } from "framer-motion";
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: "easeOut" 
      }}
      whileHover={{ 
        y: -8,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      className="bg-card border border-border rounded-2xl p-6 flex flex-col group cursor-pointer"
      style={{
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}
    >
      <div className="flex-grow">
        <div className="flex items-start justify-between mb-4">
          <motion.div 
            whileHover={{ 
              scale: 1.1,
              rotate: 3,
              transition: { type: "spring", stiffness: 400, damping: 17 }
            }}
            className="p-3 bg-primary/10 rounded-xl"
          >
            <DocumentTextIcon className="h-6 w-6 text-primary" />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 0, x: 0 }}
            whileHover={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            {canManage && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onManageTags}
                className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300"
                title="Gérer les tags"
              >
                <TagIcon className="h-5 w-5" />
              </motion.button>
            )}
            {canManage && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(doc.id)}
                className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                title="Supprimer le document"
              >
                <TrashIcon className="h-5 w-5" />
              </motion.button>
            )}
          </motion.div>
        </div>

        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-bold text-lg text-foreground truncate mb-4"
        >
          {doc.name}
        </motion.h3>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center gap-2 min-h-[40px]"
        >
          {doc.tags?.map((tag, index) => (
            <motion.button
              key={tag.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTagClick(tag.id)}
              className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
              #{tag.name}
            </motion.button>
          ))}
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="border-t border-border pt-4 mt-4 flex items-center justify-around gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPreview(doc.url, doc.name)}
          className="flex-1 text-sm font-medium text-muted-foreground hover:text-primary flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-primary/10 transition-all duration-300"
        >
          <EyeIcon className="h-4 w-4" />
          <span>Aperçu</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onDownload(doc.url)}
          className="flex-1 text-sm font-medium text-muted-foreground hover:text-primary flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-primary/10 transition-all duration-300"
        >
          <DownloadIcon className="h-4 w-4" />
          <span>Télécharger</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
