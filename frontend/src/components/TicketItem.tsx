// src/components/TicketItem.tsx
import React, { useState } from "react";
import type { TicketType } from "../types"; // Importer depuis le fichier central

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

const StatusBadge: React.FC<{ status: TicketType["status"] }> = ({
  status,
}) => {
  const statusStyles = {
    non_traitee: "bg-destructive/10 text-destructive ring-destructive/20",
    en_cours: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    traitee: "bg-primary/10 text-primary ring-primary/20",
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full ring-1 ring-inset ${statusStyles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
};

export default function TicketItem({
  ticket,
  isManager,
  onStatusChange,
  onDeleteRequest, // <-- MODIFIÉ
  onAddComment,
  defaultExpanded = false,
}: TicketItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const commentInputRef = React.useRef<HTMLTextAreaElement>(null);

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
          <StatusBadge status={ticket.status} />
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
          {isManager && (
            <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-secondary-foreground">
                  Changer statut:
                </span>
                {(["non_traitee", "en_cours", "traitee"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => onStatusChange(ticket.id, status)}
                      disabled={ticket.status === status}
                      className="disabled:cursor-not-allowed"
                    >
                      <StatusBadge status={status} />
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() => onDeleteRequest(ticket)} // <-- MODIFIÉ
                className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <ChatAlt2Icon className="h-5 w-5" />
              Commentaires
            </h3>
            {ticket.comments.length === 0 && (
              <p className="text-sm text-muted-foreground pl-2">
                Aucun commentaire.
              </p>
            )}
            <div className="space-y-3">
              {ticket.comments.map((c) => (
                <div key={c.id} className="p-3 bg-secondary rounded-lg text-sm">
                  <p className="text-secondary-foreground">{c.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Par {c.author_id} le{" "}
                    {new Date(c.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {isManager && (
            <form
              onSubmit={handleCommentSubmit}
              className="flex items-start gap-3 pt-4 border-t border-border/50"
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
          )}
        </div>
      </div>
    </div>
  );
}
