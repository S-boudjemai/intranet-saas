// src/components/CreateAnnouncementForm.tsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import MultiSelect from "./MultiSelect"; // <-- ON IMPORTE LE NOUVEAU COMPOSANT
import UploadDocument from "./UploadDocument"; // <-- IMPORT POUR L'UPLOAD
import { parseJwt, type JwtPayload } from "../utils/jwt";
import { SpeakerphoneIcon } from "./icons";


interface Restaurant {
  id: number;
  name: string;
}

interface Document {
  id: string;
  name: string;
}

interface CreateAnnouncementFormProps {
  onSuccess: () => void;
}

export default function CreateAnnouncementForm({
  onSuccess,
}: CreateAnnouncementFormProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState<number[]>(
    []
  );
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [showUploadDocument, setShowUploadDocument] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Extraire tenant_id du token pour UploadDocument
  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const tenantId = raw?.tenant_id;

  const loadDocuments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const response = await res.json();
      const data = response.data || response;
      if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch (error) {
      // Error loading documents
      setStatus("Erreur: Impossible de charger les documents.");
    }
  };

  useEffect(() => {
    if (!token) return;
    
    // Charger les restaurants
    fetch(`${import.meta.env.VITE_API_URL}/restaurants`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((response) => {
        const data = response.data || response;
        Array.isArray(data) && setRestaurants(data);
      })
      .catch(() => setStatus("Erreur: Impossible de charger les restaurants."));

    // Charger les documents
    loadDocuments();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setStatus("Erreur : Le titre et le contenu sont obligatoires.");
      return;
    }
    setLoading(true);
    setStatus("Publication en cours...");

    const payload: {
      title: string;
      content: string;
      restaurant_ids?: number[];
      document_ids?: string[];
    } = {
      title,
      content,
    };

    if (selectedRestaurantIds.length > 0) {
      payload.restaurant_ids = selectedRestaurantIds;
    }

    if (selectedDocumentIds.length > 0) {
      payload.document_ids = selectedDocumentIds.map(id => id.toString());
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Une erreur inconnue est survenue." }));
        throw new Error(
          errorData.message || `Échec de la publication (${res.status})`
        );
      }
      setStatus("✅ Annonce publiée !");
      setTitle("");
      setContent("");
      setSelectedRestaurantIds([]);
      setSelectedDocumentIds([]);
      onSuccess();
    } catch (err: any) {
      setStatus(`Erreur : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = `bg-input border border-border rounded-md w-full p-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all`;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-card border border-border rounded-lg space-y-5"
    >
      <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
        <SpeakerphoneIcon className="h-6 w-6" />
        <span>Publier une nouvelle annonce</span>
      </h2>

      <div>
        <label
          htmlFor="ann-title"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          Titre
        </label>
        <input
          id="ann-title"
          className={inputClasses}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label
          htmlFor="ann-content"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          Contenu
        </label>
        <textarea
          id="ann-content"
          className={inputClasses}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
        />
      </div>

      {/* ON REMPLACE L'ANCIENNE LISTE PAR LE NOUVEAU COMPOSANT */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Restaurants concernés (laisser vide pour "tous")
        </label>
        <MultiSelect
          options={restaurants.map((r) => ({ value: r.id, label: r.name }))}
          selectedValues={selectedRestaurantIds}
          onChange={setSelectedRestaurantIds}
          placeholder="Sélectionner un ou plusieurs restaurants..."
        />
      </div>

      {/* Section Documents */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-muted-foreground">
            Documents à joindre (optionnel)
          </label>
          <button
            type="button"
            onClick={() => setShowUploadDocument(!showUploadDocument)}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            {showUploadDocument ? "📋 Sélectionner existants" : "📤 Uploader nouveau"}
          </button>
        </div>

        {showUploadDocument ? (
          // Mode Upload
          tenantId && (
            <UploadDocument
              tenant_id={tenantId}
              onUploadSuccess={async () => {
                await loadDocuments();
                setShowUploadDocument(false);
              }}
            />
          )
        ) : (
          // Mode Sélection
          <MultiSelect
            options={documents.map((d) => ({ value: parseInt(d.id), label: d.name }))}
            selectedValues={selectedDocumentIds}
            onChange={(selected: number[]) => setSelectedDocumentIds(selected)}
            placeholder="Sélectionner des documents à joindre..."
          />
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-md hover:bg-primary/90 active:scale-95 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Publication..." : "Publier l'annonce"}
        </button>
      </div>

      {status && (
        <p
          className={`text-sm font-medium text-center p-3 rounded-md
            ${status.includes("✅") ? "bg-primary/10 text-primary" : ""}
            ${
              status.includes("Erreur")
                ? "bg-destructive/10 text-destructive"
                : ""
            }
            ${
              status.includes("en cours")
                ? "bg-secondary text-secondary-foreground animate-pulse"
                : ""
            }`}
        >
          {status}
        </p>
      )}
    </form>
  );
}
