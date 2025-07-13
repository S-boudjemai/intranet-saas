// src/components/CreateAnnouncementForm.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import MultiSelect from "./MultiSelect"; // <-- ON IMPORTE LE NOUVEAU COMPOSANT

// --- ICÔNE SVG ---
const SpeakerphoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M10.5 6a7.5 7.5 0 100 12h-3a7.5 7.5 0 00-7.5-7.5h1.5v-1.5a7.5 7.5 0 007.5-7.5h3z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 18.75h-1.5a7.5 7.5 0 00-7.5-7.5h-1.5v-1.5a7.5 7.5 0 017.5-7.5h1.5v16.5z"
    />
  </svg>
);
// --- FIN ICÔNE SVG ---

interface Restaurant {
  id: number;
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
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState<number[]>(
    []
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL}/restaurants`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => Array.isArray(data) && setRestaurants(data))
      .catch(() => setStatus("Erreur: Impossible de charger les restaurants."));
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
    } = {
      title,
      content,
    };

    if (selectedRestaurantIds.length > 0) {
      payload.restaurant_ids = selectedRestaurantIds;
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
