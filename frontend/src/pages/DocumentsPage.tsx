// src/pages/DocumentsPage.tsx
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import UploadDocument from "../components/UploadDocument";
import DocumentCard from "../components/DocumentCard";
import CategoryTree from "../components/CategoryTree";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import ManageTagsModal from "../components/ManageTagsModal";
import ConfirmModal from "../components/ConfirmModal"; // <-- Import de la modale
import type { DocumentType, TagType } from "../types";
import { DocumentTextIcon, SearchIcon } from "../components/icons";

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
      return;
    }
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

  useEffect(() => {
    loadTags();
  }, [token]);
  const memoizedFilterTags = useMemo(() => filterTags, [filterTags.join(',')]);

  useEffect(() => {
    loadDocs();
  }, [token, category, search, memoizedFilterTags]);

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
      transition={{ duration: 0.5 }}
      className="p-6 space-y-8"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="p-3 bg-primary/10 border border-primary/20 rounded-2xl"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <DocumentTextIcon className="h-7 w-7 text-primary" />
          </motion.div>
          <span>Gestion des Documents</span>
        </h1>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="lg:grid lg:grid-cols-12 lg:gap-8"
      >
        <motion.aside 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Catégories
            </h2>
            <CategoryTree
              selectedId={category}
              onSelect={(id) =>
                setCategory((prev) => (prev === id ? undefined : id))
              }
            />
          </div>
          {canManage && tenantId && (
            <UploadDocument
              tenant_id={tenantId}
              categoryId={category}
              onUploadSuccess={loadDocs}
            />
          )}
        </motion.aside>

        <motion.main 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="lg:col-span-9 mt-8 lg:mt-0"
        >
          <div className="space-y-6 p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="relative">
              <SearchIcon className="absolute top-1/2 left-4 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un document par nom..."
                className="bg-background border border-border rounded-xl w-full p-4 pl-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-300"
              />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
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
                    className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                      active
                        ? "bg-primary/10 text-primary ring-2 ring-primary/30 shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:shadow-sm"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            {docs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {docs.map((d, index) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <DocumentCard
                      doc={d}
                      canManage={canManage}
                      onDelete={() => handleDeleteRequest(d)} // <-- On appelle la nouvelle fonction
                      onPreview={handlePreview}
                      onTagClick={handleTagClick}
                      onDownload={handleDownload}
                      onManageTags={() => setManagingTagsDoc(d)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-16 border-2 border-dashed border-border rounded-2xl bg-muted/50">
                <div className="flex flex-col items-center gap-3">
                  <DocumentTextIcon className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">Aucun document trouvé</p>
                  <p className="text-sm">Essayez d'ajuster vos critères de recherche</p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.main>
      </motion.div>

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
