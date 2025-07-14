// src/components/TicketItem.tsx
import React, { useState } from "react";
import type { TicketType, TicketAttachment } from "../types"; // Importer depuis le fichier central
import TicketBadge from "./TicketBadge";
import ImageUpload from "./ImageUpload";
import AttachmentGallery from "./AttachmentGallery";

// --- ICÔNES SVG ---
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
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
const ChatAlt2Icon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M17.25 8.25h-10.5a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25h.75a2.25 2.25 0 012.25 2.25v.01M6 8.25v-1.5a2.25 2.25 0 012.25-2.25h10.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-1.5m-9-3.75h.008v.008H7.5v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
);
// --- FIN ICÔNES SVG ---

interface TicketItemProps {
  ticket: TicketType;
  isManager: boolean;
  onStatusChange: (id: string, status: TicketType["status"]) => void;
  onDeleteRequest: (ticket: TicketType) => void; // <-- MODIFIÉ
  onAddComment: (id: string, message: string) => void;
  defaultExpanded?: boolean;
}


export default function TicketItem({
  ticket,
  isManager,
  onStatusChange,
  onDeleteRequest, // <-- MODIFIÉ
  onAddComment,
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

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentInputRef.current?.value) {
      onAddComment(ticket.id, commentInputRef.current.value);
      commentInputRef.current.value = "";
    }
  };

  const inputClasses =
    "bg-input border border-border rounded-md w-full p-2 text-foreground focus:border-primary focus:ring-primary/30 focus:outline-none transition-all";

  return (
    <div className="bg-card border border-border rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center p-4"
      >
        <div className="flex items-center gap-4">
          {isManager && ticket.restaurant && (
            <span className="text-sm font-semibold text-sky-400 bg-sky-500/10 px-2 py-1 rounded">
              {ticket.restaurant.name}
            </span>
          )}
          <h2 className="font-bold text-lg text-card-foreground">
            {ticket.title}
          </h2>
          <TicketBadge status={ticket.status} />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            M.à.j {new Date(ticket.updated_at).toLocaleDateString()}
          </span>
          <ChevronDownIcon
            className={`h-6 w-6 text-muted-foreground transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? "max-h-[1000px]" : "max-h-0"
        }`}
      >
        <div className="border-t border-border p-4 space-y-6">
          {ticket.description && (
            <p className="text-foreground/80">{ticket.description}</p>
          )}
          
          {/* Affichage des images du ticket */}
          {ticketAttachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-foreground text-sm">Images du ticket :</h4>
              <AttachmentGallery attachments={ticketAttachments} />
            </div>
          )}
          
          {isManager && (
            <div className="border-2 border-dashed border-border rounded-lg p-4 bg-gradient-to-r from-muted/30 to-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground bg-accent/50 px-3 py-1 rounded-full border border-border">
                    Gestion du ticket
                  </span>
                  <div className="flex items-center gap-2">
                    {(["non_traitee", "en_cours", "traitee"] as const).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => onStatusChange(ticket.id, status)}
                          disabled={ticket.status === status}
                          className="disabled:cursor-not-allowed hover:scale-105 transition-transform duration-200"
                        >
                          <TicketBadge status={status} />
                        </button>
                      )
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteRequest(ticket)} // <-- MODIFIÉ
                  className="p-2 rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive border border-transparent hover:border-destructive/30 transition-all duration-200"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
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
                      onUploadError={(error) => {
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
                <div key={c.id} className="p-3 bg-secondary rounded-lg text-sm space-y-2">
                  <p className="text-secondary-foreground">{c.message}</p>
                  
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
