// src/pages/DocumentsPage.tsx
import { useState, useEffect, useMemo } from "react";
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
  
  console.log('🔍 DocumentsPage - tenantId from JWT:', tenantId, typeof tenantId);

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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 bg-card border border-border rounded-lg">
            <DocumentTextIcon className="h-6 w-6 text-primary" />
          </div>
          <span>Gestion des Documents</span>
        </h1>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        <aside className="lg:col-span-3 space-y-8">
          <div className="p-5 bg-card border border-border rounded-lg">
            <h2 className="font-bold text-card-foreground mb-4">Catégories</h2>
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
        </aside>

        <main className="lg:col-span-9 mt-8 lg:mt-0">
          <div className="space-y-4 p-5 bg-card border border-border rounded-lg">
            <div className="relative">
              <SearchIcon className="absolute top-1/2 left-4 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un document par nom..."
                className="bg-input border border-border rounded-md w-full p-3 pl-12 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
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
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                      active
                        ? "bg-primary/10 text-primary ring-1 ring-primary/50"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            {docs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {docs.map((d) => (
                  <DocumentCard
                    key={d.id}
                    doc={d}
                    canManage={canManage}
                    onDelete={() => handleDeleteRequest(d)} // <-- On appelle la nouvelle fonction
                    onPreview={handlePreview}
                    onTagClick={handleTagClick}
                    onDownload={handleDownload}
                    onManageTags={() => setManagingTagsDoc(d)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-16 border-2 border-dashed border-border rounded-lg">
                <p>Aucun document ne correspond à vos critères.</p>
              </div>
            )}
          </div>
        </main>
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
    </div>
  );
}
