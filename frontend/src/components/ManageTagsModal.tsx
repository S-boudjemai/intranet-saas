// src/components/ManageTagsModal.tsx
import { useState } from "react";
import type { TagType } from "../types";

// --- DÉBUT DES ICÔNES SVG ---
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

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
// --- FIN DES ICÔNES SVG ---

interface ManageTagsModalProps {
  documentName: string;
  assignedTags: TagType[];
  allTags: TagType[];
  onClose: () => void;
  onSave: (tagIds: string[]) => Promise<void>;
  onCreateTag: (name: string) => Promise<void>;
  isSaving: boolean;
}

export default function ManageTagsModal({
  documentName,
  assignedTags,
  allTags,
  onClose,
  onSave,
  onCreateTag,
  isSaving,
}: ManageTagsModalProps) {
  const [currentTagIds, setCurrentTagIds] = useState<string[]>(
    assignedTags.map((t) => t.id)
  );
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleToggleTag = (tagId: string) => {
    setCurrentTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSaveClick = async () => {
    await onSave(currentTagIds);
  };

  const handleCreateClick = async () => {
    if (!newTagName.trim()) return;
    setIsCreating(true);
    await onCreateTag(newTagName.trim());
    setNewTagName("");
    setIsCreating(false);
  };

  const assignedTagObjects = allTags.filter((t) =>
    currentTagIds.includes(t.id)
  );
  const availableTagObjects = allTags.filter(
    (t) => !currentTagIds.includes(t.id)
  );

  const inputClasses = `flex-grow bg-input border border-border rounded-md p-2 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition`;

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-popover border border-border rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-popover-foreground flex items-center gap-2">
              <TagIcon className="h-6 w-6" />
              Gérer les Tags
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-muted-foreground hover:bg-accent"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            Pour le document:{" "}
            <span className="font-medium text-popover-foreground/90">
              {documentName}
            </span>
          </p>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Créer un nouveau tag
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nom du nouveau tag..."
                className={inputClasses}
              />
              <button
                onClick={handleCreateClick}
                disabled={isCreating || !newTagName.trim()}
                className="bg-secondary hover:bg-accent text-secondary-foreground font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {isCreating ? "..." : "Créer"}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Tags assignés
            </h4>
            <div className="flex flex-wrap gap-2 min-h-[36px] bg-secondary/50 p-3 rounded-md border border-border">
              {assignedTagObjects.length > 0 ? (
                assignedTagObjects.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary/30 transition-colors"
                  >
                    {tag.name}
                    <XIcon className="h-4 w-4" />
                  </button>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Aucun tag assigné.
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Tags disponibles
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableTagObjects.length > 0 ? (
                availableTagObjects.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className="bg-accent hover:bg-accent/80 text-accent-foreground px-3 py-1 rounded-full text-sm font-medium transition-colors"
                  >
                    + {tag.name}
                  </button>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Aucun autre tag disponible.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-secondary/30 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-secondary-foreground font-semibold hover:bg-accent transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? "Sauvegarde..." : "Sauvegarder les changements"}
          </button>
        </div>
      </div>
    </div>
  );
}
