// src/pages/DocumentsPage.tsx
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import DocumentUploader from "../components/DocumentUploader";
import DocumentCard from "../components/DocumentCard";
import CategoryTree from "../components/CategoryTree";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import ManageTagsModal from "../components/ManageTagsModal";
import ConfirmModal from "../components/ConfirmModal";
import type { DocumentType, TagType } from "../types";
import { DocumentTextIcon, SearchIcon, FolderIcon, TagIcon, PlusIcon } from "../components/icons";
import { DocumentGridSkeleton } from "../components/Skeleton";

export default function DocumentsPage() {
  const { token } = useAuth();
  const [docs, setDocs] = useState<DocumentType[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState<string>("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(
    null
  );
  const [managingTagsDoc, setManagingTagsDoc] = useState<DocumentType | null>(
    null
  );
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- ÉTATS POUR LA MODALE DE CONFIRMATION ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<DocumentType | null>(null);

  // Auth & Permissions logic
  const raw = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const canManage = raw?.role === "manager" || raw?.role === "admin";
  const tenantId = raw?.tenant_id;
  

  // Data fetching logic
  const loadDocs = async () => {
    if (!token) {
      setDocs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("categoryId", category);
      if (search) params.set("q", search);
      if (filterTags.length) params.set("tagIds", filterTags.join(","));
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/documents?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await response.json();
      const data = json.data || json;
      setDocs(data);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    if (!token) return;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await response.json();
    const data = json.data || json;
    // S'assurer que data est un tableau
    setTags(Array.isArray(data) ? data : []);
  };

  // Hook pour redirection intelligente vers catégorie par défaut
  const [categories, setCategories] = useState<any[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadCategories = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      const data = json.data || json;
      setCategories(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      setCategories([]);
      return [];
    }
  };

  // Initialisation intelligente avec redirection
  useEffect(() => {
    const initializeDocumentsPage = async () => {
      if (!token || hasInitialized) return;
      
      // Charger catégories et tags en parallèle
      const [loadedCategories] = await Promise.all([
        loadCategories(),
        loadTags()
      ]);
      
      // Si aucune catégorie sélectionnée ET qu'il y a des catégories
      if (!category && loadedCategories.length > 0) {
        // Chercher "Documents Généraux" ou prendre la première
        const defaultCategory = loadedCategories.find(cat => cat.name === 'Documents Généraux') || loadedCategories[0];
        if (defaultCategory) {
          setCategory(defaultCategory.id);
        }
      }
      
      setHasInitialized(true);
    };

    initializeDocumentsPage();
  }, [token, hasInitialized]);

  const memoizedFilterTags = useMemo(() => filterTags, [filterTags.join(',')]);

  useEffect(() => {
    if (hasInitialized) {
      loadDocs();
    }
  }, [token, category, search, memoizedFilterTags, hasInitialized]);

  // --- LOGIQUE DE SUPPRESSION MISE À JOUR ---
  const handleDeleteRequest = (doc: DocumentType) => {
    setDocToDelete(doc);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete || !token) return;
    await fetch(`${import.meta.env.VITE_API_URL}/documents/${docToDelete.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await loadDocs();
    setDocToDelete(null);
  };

  // --- AUTRES HANDLERS ---
  const handlePreview = (url: string, name: string) => {
    // Les URLs sont déjà présignées depuis le backend
    setPreview({ url, name });
  };

  const handleDownload = (url: string) => {
    // Les URLs sont déjà présignées depuis le backend
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTagClick = (tagId: string) => {
    setFilterTags((currentTags) => {
      if (currentTags.includes(tagId)) {
        return currentTags;
      }
      return [...currentTags, tagId];
    });
  };

  const handleCreateTag = async (name: string) => {
    await fetch(`${import.meta.env.VITE_API_URL}/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    await loadTags();
  };

  const handleUpdateTags = async (newTagIds: string[]) => {
    if (!managingTagsDoc) return;
    setIsSavingTags(true);
    const initialTagIds = managingTagsDoc.tags?.map((t) => t.id) || [];
    const docId = managingTagsDoc.id;
    const tagsToAdd = newTagIds.filter((id) => !initialTagIds.includes(id));
    const tagsToRemove = initialTagIds.filter((id) => !newTagIds.includes(id));
    const addPromises = tagsToAdd.map((tagId) =>
      fetch(`${import.meta.env.VITE_API_URL}/documents/${docId}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tagId }),
      })
    );
    const removePromises = tagsToRemove.map((tagId) =>
      fetch(
        `${import.meta.env.VITE_API_URL}/documents/${docId}/tags/${tagId}`,
        {
          method: "DELETE", // <-- CORRECTION: La méthode est DELETE
          headers: { Authorization: `Bearer ${token}` },
        }
      )
    );
    try {
      await Promise.all([...addPromises, ...removePromises]);
    } catch (error) {
    } finally {
      await loadDocs();
      setIsSavingTags(false);
      setManagingTagsDoc(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      {/* Header moderne avec actions */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Documents</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {category && categories.length > 0 && (
                    <>
                      <span>📁</span>
                      <span className="font-medium text-foreground">
                        {categories.find(cat => cat.id === category)?.name || 'Catégorie'}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span>{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            {canManage && tenantId && (
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Nouveau document
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Toolbar unifiée */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          {/* Ligne principale: recherche + actions */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute top-1/2 left-4 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un document par nom..."
                className="bg-background border border-border rounded-xl w-full p-3 pl-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  showCategoryFilter ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <FolderIcon className="h-4 w-4" />
                Changer dossier
              </button>
              
              {category && (
                <button
                  onClick={() => setCategory(undefined)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors bg-muted text-muted-foreground hover:bg-muted/80"
                >
                  Tous les documents
                </button>
              )}
            </div>
          </div>

          {/* Filtres tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TagIcon className="h-4 w-4" />
                Tags:
              </div>
              {tags.map((t) => {
                const active = filterTags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() =>
                      setFilterTags((p) =>
                        p.includes(t.id)
                          ? p.filter((x) => x !== t.id)
                          : [...p, t.id]
                      )
                    }
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      active
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Panneau catégories (collapsible) */}
          {showCategoryFilter && (
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-foreground">Choisir un dossier</h3>
                <button
                  onClick={() => {
                    setCategory(undefined);
                    setShowCategoryFilter(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Tous les documents
                </button>
              </div>
              <CategoryTree
                selectedId={category}
                onSelect={(id) => {
                  setCategory(id);
                  setShowCategoryFilter(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Zone d'upload (collapsible) */}
        {showUploader && canManage && tenantId && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Ajouter un document</h2>
              <button
                onClick={() => setShowUploader(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Sélecteur de dossier intégré */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Dossier de destination
              </label>
              <select
                value={category || ''}
                onChange={(e) => setCategory(e.target.value || undefined)}
                className="w-full p-3 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              >
                <option value="">Aucun dossier (sans catégorie)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    📁 {cat.name}
                  </option>
                ))}
              </select>
              
              {!category && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  💡 Aucun dossier sélectionné. Le document sera ajouté sans catégorie.
                </p>
              )}
            </div>
            
            <DocumentUploader
              tenant_id={tenantId}
              categoryId={category}
              onUploadSuccess={async (uploadedDocument) => {
                await loadDocs();
                setShowUploader(false);
              }}
            />
          </div>
        )}

        {/* Grid documents */}
        <div className="space-y-6">
          {loading ? (
            <DocumentGridSkeleton />
          ) : docs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {docs.map((d) => (
                <DocumentCard
                  key={d.id}
                  doc={d}
                  canManage={canManage}
                  onDelete={() => handleDeleteRequest(d)}
                  onPreview={handlePreview}
                  onTagClick={handleTagClick}
                  onDownload={handleDownload}
                  onManageTags={() => setManagingTagsDoc(d)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-20 border-2 border-dashed border-border rounded-2xl bg-muted/30">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted rounded-2xl">
                  <DocumentTextIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-medium">Aucun document trouvé</p>
                  <p className="text-sm">
                    {search || filterTags.length || category
                      ? "Essayez d'ajuster vos critères de recherche"
                      : canManage ? "Commencez par ajouter votre premier document" : "Aucun document disponible pour l'instant"
                    }
                  </p>
                </div>
                {canManage && !search && !filterTags.length && !category && (
                  <button
                    onClick={() => setShowUploader(true)}
                    className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Ajouter un document
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <DocumentPreviewModal {...preview} onClose={() => setPreview(null)} />
      )}
      {managingTagsDoc && (
        <ManageTagsModal
          documentName={managingTagsDoc.name}
          assignedTags={managingTagsDoc.tags || []}
          allTags={tags}
          onClose={() => setManagingTagsDoc(null)}
          onSave={handleUpdateTags}
          onCreateTag={handleCreateTag}
          isSaving={isSavingTags}
        />
      )}

      {/* --- NOTRE NOUVELLE MODALE DE CONFIRMATION --- */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le document"
      >
        Êtes-vous sûr de vouloir supprimer définitivement le document "
        <span className="font-bold">{docToDelete?.name}</span>" ? Cette action
        est irréversible.
      </ConfirmModal>
    </motion.div>
  );
}
