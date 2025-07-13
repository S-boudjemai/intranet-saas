// src/pages/DocumentsPage.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import UploadDocument from "../components/UploadDocument";
import DocumentCard from "../components/DocumentCard";
import CategoryTree from "../components/CategoryTree";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import ManageTagsModal from "../components/ManageTagsModal";
import ConfirmModal from "../components/ConfirmModal"; // <-- Import de la modale
import type { DocumentType, TagType } from "../types";

// --- ICÔNES SVG ---
const DocumentTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);
// --- FIN ICÔNES SVG ---

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
    const data = await response.json();
    setDocs(data);
  };

  const loadTags = async () => {
    if (!token) return;
    const response = await fetch(`${import.meta.env.VITE_API_URL}/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setTags(data);
  };

  useEffect(() => {
    loadTags();
  }, [token]);
  useEffect(() => {
    loadDocs();
  }, [token, category, search, filterTags]);

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
  const handlePreview = async (filename: string, name: string) => {
    const res = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }/documents/download-url?filename=${encodeURIComponent(filename)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { url } = await res.json();
    setPreview({ url, name });
  };

  const handleDownload = async (fileUrl: string, name: string) => {
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/documents/download-url?filename=${encodeURIComponent(fileUrl)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Could not get download URL");
      const { url } = await res.json();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open document:", error);
    }
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
      console.error("Failed to update tags:", error);
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
