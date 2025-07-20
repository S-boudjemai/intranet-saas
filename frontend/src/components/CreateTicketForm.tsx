// src/components/CreateTicketForm.tsx
import { useState } from "react";
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Empêcher la double soumission
    if (isSubmitting) return;
    
    if (!title.trim()) {
      setStatus("Erreur : Le titre est obligatoire.");
      return;
    }
    
    setIsSubmitting(true);
    setStatus("Création en cours...");
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          title: title.trim(), 
          description: description.trim() 
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData?.error?.message || errorData?.message || `Erreur du serveur (${res.status})`;
        throw new Error(errorMessage);
      }

      const response = await res.json();
      const created: TicketType = response.data || response;
      
      // Uploader les images en attente vers le ticket créé
      if (pendingFiles.length > 0) {
        setStatus("Upload des images en cours...");
        
        for (const file of pendingFiles) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('ticketId', created.id);
            
            await fetch(`${import.meta.env.VITE_API_URL}/tickets/upload-image`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });
          } catch (err) {
          }
        }
      }
      
      onSuccess(created);
      setTitle("");
      setDescription("");
      setPendingFiles([]);
      setPreviewImages([]);
      setStatus("✅ Ticket créé avec succès !");
      
      // Réinitialiser le statut après 3 secondes
      setTimeout(() => {
        setStatus("");
        setIsSubmitting(false);
      }, 3000);
      
    } catch (err: any) {
      console.error("Erreur création ticket:", err);
      setStatus(`Erreur : ${err.message}`);
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      // Vérification du type et de la taille
      if (file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/) && file.size <= 5 * 1024 * 1024) {
        validFiles.push(file);
        // Créer une prévisualisation
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreviewImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
    
    setPendingFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
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

      {/* Upload d'images */}
      <div className="space-y-3">
        <details className="group">
          <summary className="cursor-pointer list-none flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <span className="inline-block w-4 h-4 border border-border rounded bg-accent/30 group-open:rotate-90 transition-transform">
              <svg className="w-3 h-3 ml-0.5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
            📷 Ajouter des images ({pendingFiles.length})
          </summary>
          
          <div className="mt-3 space-y-3">
            {/* Zone de drop */}
            <div
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files);
              }}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="text-2xl">📷</div>
                <div className="text-sm">
                  <span className="font-medium text-primary">Cliquez pour ajouter</span>
                  <span className="text-muted-foreground"> ou glissez vos images</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  JPEG, PNG, GIF, WebP - Max 5MB par image
                </div>
              </label>
            </div>
            
            {/* Prévisualisation des images */}
            {previewImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {previewImages.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                      {pendingFiles[index]?.name.substring(0, 10)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground font-bold py-3 px-4 rounded-md hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
        >
          <span>{isSubmitting ? "Création..." : "Créer le Ticket"}</span>
          {!isSubmitting && <HiOutlineArrowRight className="h-5 w-5" />}
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
