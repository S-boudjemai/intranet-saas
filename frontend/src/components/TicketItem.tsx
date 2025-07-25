// src/components/TicketItem.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import type { TicketType, TicketAttachment } from "../types";
import TicketBadge from "./TicketBadge";
import ImageUpload from "./ImageUpload";
import AttachmentGallery from "./AttachmentGallery";
import { ChevronDownIcon, TrashIcon, ChatAlt2Icon, ArchiveIcon } from "./icons";

interface TicketItemProps {
  ticket: TicketType;
  isManager: boolean;
  onStatusChange: (id: string, status: TicketType["status"]) => void;
  onDeleteRequest: (ticket: TicketType) => void; // <-- MODIFIÉ
  onAddComment: (id: string, message: string) => void;
  onArchive?: (ticketId: string) => void;
  defaultExpanded?: boolean;
}


export default function TicketItem({
  ticket,
  isManager,
  onStatusChange,
  onDeleteRequest, // <-- MODIFIÉ
  onAddComment,
  onArchive,
  defaultExpanded = false,
}: TicketItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [ticketAttachments, setTicketAttachments] = useState<TicketAttachment[]>(ticket.attachments || []);
  const [commentAttachments] = useState<Record<string, TicketAttachment[]>>({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const commentInputRef = React.useRef<HTMLTextAreaElement>(null);

  // Fermer la modale d'upload quand le ticket se ferme
  React.useEffect(() => {
    if (!isExpanded) {
      setIsUploadModalOpen(false);
    }
  }, [isExpanded]);

  const [commentError, setCommentError] = useState<string>("");
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentInputRef.current?.value) {
      try {
        setCommentError("");
        await onAddComment(ticket.id, commentInputRef.current.value);
        commentInputRef.current.value = "";
      } catch (error: any) {
        setCommentError(error.message || "Erreur lors de l'ajout du commentaire");
      }
    }
  };

  const inputClasses =
    "bg-input border border-border rounded-md w-full p-2 text-foreground focus:border-primary focus:ring-primary/30 focus:outline-none transition-all";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        ease: "easeOut" 
      }}
      whileHover={{ 
        y: -4,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className="bg-card border border-border rounded-2xl"
      style={{
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}
    >
      <motion.button
        whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.02)" }}
        whileTap={{ scale: 0.995 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-6 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          {isManager && ticket.restaurant && (
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20"
            >
              {ticket.restaurant.name}
            </motion.span>
          )}
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-bold text-lg text-card-foreground"
          >
            {ticket.title}
          </motion.h2>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <TicketBadge status={ticket.status} />
          </motion.div>
        </div>
        <div className="flex items-center gap-4">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground"
          >
            M.à.j {new Date(ticket.updated_at).toLocaleDateString()}
          </motion.span>
          <motion.div
            whileHover={{ rotate: isExpanded ? 180 : -10 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <ChevronDownIcon
              className={`h-6 w-6 text-muted-foreground transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </motion.div>
        </div>
      </motion.button>

      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ 
          duration: 0.5, 
          ease: "easeInOut",
          opacity: { delay: isExpanded ? 0.2 : 0 }
        }}
        className="overflow-hidden"
      >
        <div className="border-t border-border p-6 space-y-6">
          {ticket.description && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground leading-relaxed"
            >
              {ticket.description}
            </motion.p>
          )}
          
          {/* Affichage des images du ticket */}
          {ticketAttachments.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h4 className="font-medium text-foreground text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Images du ticket :
              </h4>
              <AttachmentGallery attachments={ticketAttachments} />
            </motion.div>
          )}
          
          {isManager && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="border-2 border-dashed border-primary/20 rounded-2xl p-5 bg-gradient-to-r from-primary/5 to-primary/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.span 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20"
                  >
                    Gestion du ticket
                  </motion.span>
                  <div className="flex items-center gap-2">
                    {(["non_traitee", "en_cours", "traitee"] as const).map(
                      (status, index) => (
                        <motion.button
                          key={status}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onStatusChange(ticket.id, status)}
                          disabled={ticket.status === status}
                          className="disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <TicketBadge status={status} />
                        </motion.button>
                      )
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* Bouton archivage uniquement si ticket traité */}
                  {ticket.status === "traitee" && onArchive && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onArchive(ticket.id)}
                      className="p-2 rounded-full text-muted-foreground hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300"
                      title="Archiver le ticket traité"
                    >
                      <ArchiveIcon className="h-5 w-5" />
                    </motion.button>
                  )}
                  {/* Bouton suppression uniquement si ticket traité */}
                  {ticket.status === "traitee" && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDeleteRequest(ticket)}
                      className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all duration-300"
                      title="Supprimer le ticket traité"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ChatAlt2Icon className="h-5 w-5" />
                Commentaires
              </h3>
              
              {/* Upload d'images accessible à tous */}
              <div className="relative">
                <button
                  onClick={() => setIsUploadModalOpen(!isUploadModalOpen)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors bg-accent/20 px-2 py-1 rounded"
                >
                  <span className={`inline-block w-3 h-3 border border-border rounded bg-accent/30 transition-transform ${isUploadModalOpen ? 'rotate-90' : ''}`}>
                    <svg className="w-2 h-2 ml-0.5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  📷 Images
                </button>
                
                {isUploadModalOpen && (
                  <div className="absolute right-0 bottom-full mb-2 bg-card border border-border rounded-lg shadow-lg p-3 z-50 min-w-64 max-w-80">
                    {/* Bouton de fermeture */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-foreground">Ajouter une image</span>
                      <button
                        onClick={() => setIsUploadModalOpen(false)}
                        className="p-1 rounded-full hover:bg-accent transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <ImageUpload
                      ticketId={ticket.id}
                      onUploadSuccess={(attachment) => {
                        setTicketAttachments(prev => [...prev, attachment]);
                        setIsUploadModalOpen(false); // Fermer après upload réussi
                      }}
                      onUploadError={() => {
                      }}
                      className="w-full"
                    />
                    
                    {/* Petite flèche pointant vers le bouton */}
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border"></div>
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-card mt-[-1px]"></div>
                  </div>
                )}
              </div>
            </div>
            {ticket.comments.length === 0 && (
              <p className="text-sm text-muted-foreground pl-2">
                Aucun commentaire.
              </p>
            )}
            <div className="space-y-3">
              {ticket.comments.map((c) => (
                <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-2 border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-700 dark:text-gray-300">{c.message}</p>
                  
                  {/* Affichage des images du commentaire */}
                  {commentAttachments[c.id] && commentAttachments[c.id].length > 0 && (
                    <AttachmentGallery 
                      attachments={commentAttachments[c.id]} 
                      className="mt-2"
                    />
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Par {c.author_id} le{" "}
                    {new Date(c.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {isManager && (
            <div className="pt-4 border-t border-border/50 space-y-4">
              <form
                onSubmit={handleCommentSubmit}
                className="flex items-start gap-3"
              >
                <textarea
                  ref={commentInputRef}
                  rows={2}
                  className={inputClasses}
                  placeholder="Votre réponse..."
                  required
                />
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Envoyer
                </button>
              </form>
              
              {commentError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                  {commentError}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
