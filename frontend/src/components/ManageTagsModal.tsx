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

  const inputClasses = `flex-grow bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300`;

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }}
      >
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <TagIcon className="h-5 w-5 text-blue-600" />
              </div>
              Gérer les Tags
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-300"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Pour le document:{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {documentName}
            </span>
          </p>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Créer un nouveau tag
            </h4>
            <div className="flex gap-3">
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isCreating ? "..." : "Créer"}
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Tags assignés
            </h4>
            <div className="flex flex-wrap gap-2 min-h-[48px] bg-gray-50 p-4 rounded-xl border border-gray-200">
              {assignedTagObjects.length > 0 ? (
                assignedTagObjects.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className="bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-blue-200 transition-all duration-300"
                  >
                    {tag.name}
                    <XIcon className="h-3 w-3" />
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  Aucun tag assigné.
                </p>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              Tags disponibles
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableTagObjects.length > 0 ? (
                availableTagObjects.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  >
                    + {tag.name}
                  </button>
                ))
              ) : (
                <p className="text-gray-500 text-sm">
                  Aucun autre tag disponible.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
          >
            Annuler
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isSaving ? "Sauvegarde..." : "Sauvegarder les changements"}
          </button>
        </div>
      </div>
    </div>
  );
}
