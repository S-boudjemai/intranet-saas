// src/components/CreateTicketForm.tsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { TicketType } from "../types"; // <-- CORRECTION: Import depuis le fichier central
import { HiOutlineArrowRight } from "react-icons/hi";

interface CreateTicketFormProps {
  onSuccess: (newTicket: TicketType) => void;
}

export default function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setStatus("Erreur : Le titre est obligatoire.");
      return;
    }
    setStatus("Création en cours...");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });
      if (!res.ok) throw new Error(`Erreur du serveur (${res.status})`);

      const created: TicketType = await res.json();
      onSuccess(created);
      setTitle("");
      setDescription("");
      setStatus("✅ Ticket créé avec succès !");
    } catch (err: any) {
      setStatus(`Erreur : ${err.message}`);
    }
  };

  const inputClasses = `bg-input border border-border rounded-md w-full p-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all`;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-card border border-border rounded-lg space-y-5"
    >
      <h2 className="text-xl font-bold text-foreground">
        Ouvrir une nouvelle requête
      </h2>

      <div>
        <label
          htmlFor="ticket-title"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          Titre de la requête
        </label>
        <input
          id="ticket-title"
          className={inputClasses}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Problème avec la caisse enregistreuse"
          required
        />
      </div>

      <div>
        <label
          htmlFor="ticket-description"
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          Description (optionnel)
        </label>
        <textarea
          id="ticket-description"
          className={inputClasses}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez le problème plus en détail..."
          rows={4}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground font-bold py-3 px-4 rounded-md hover:bg-primary/90 active:scale-95 transition-all"
        >
          <span>Créer le Ticket</span>
          <HiOutlineArrowRight className="h-5 w-5" />
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
                ? "bg-sky-500/10 text-sky-400 animate-pulse"
                : ""
            }`}
        >
          {status}
        </p>
      )}
    </form>
  );
}
