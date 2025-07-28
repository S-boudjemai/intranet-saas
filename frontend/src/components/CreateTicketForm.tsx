// src/components/CreateTicketForm.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import type { TicketType } from "../types";
import { CheckCircleIcon, DocumentTextIcon, XIcon, CloudArrowUpIcon } from "./icons";

interface CreateTicketFormProps {
  onSuccess: (newTicket: TicketType) => void;
}

export default function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const canGoNext = () => {
    if (currentStep === 1) return title.trim().length > 0;
    return true;
  };

  const inputClasses = `bg-background border border-border rounded-xl w-full p-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all`;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          {[1, 2, 3].map((step) => (
            <motion.div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === currentStep
                  ? "w-8 bg-primary"
                  : step < currentStep
                  ? "w-8 bg-primary/30"
                  : "w-2 bg-muted"
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: step === currentStep ? 1 : 0.8 }}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          Étape {currentStep} sur 3
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {/* Étape 1: Titre */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Quel est votre problème ?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Décrivez brièvement votre demande d'assistance
                </p>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Problème avec la caisse enregistreuse"
                  className={inputClasses}
                  required
                />
              </div>
            </motion.div>
          )}

          {/* Étape 2: Description */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Détails supplémentaires
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Ajoutez plus de contexte pour nous aider à mieux comprendre
                </p>
                <textarea
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le problème plus en détail..."
                  rows={6}
                  className={inputClasses}
                />
              </div>
            </motion.div>
          )}

          {/* Étape 3: Images */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Ajouter des images
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Les captures d'écran nous aident à mieux comprendre le problème
                </p>

                {/* Zone de drag & drop */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                    transition-all duration-300
                    ${isDragOver 
                      ? 'border-primary bg-primary/5 scale-[1.02]' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
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
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <CloudArrowUpIcon className="h-10 w-10 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Glissez vos images ici
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ou cliquez pour sélectionner
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, GIF, WebP • Max 5MB par image
                    </p>
                  </label>
                </div>

                {/* Prévisualisation des images */}
                {previewImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previewImages.map((preview, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group"
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-xl border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                        >
                          ×
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boutons de navigation */}
        <div className="flex justify-between mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              Précédent
            </button>
          )}
          
          <div className="ml-auto flex gap-3">
            {currentStep < 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canGoNext()}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Suivant
              </button>
            )}
            
            {currentStep === 3 && (
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4" />
                    Créer le ticket
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Status message */}
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-xl text-sm font-medium text-center ${
              status.includes("✅")
                ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                : status.includes("Erreur")
                ? "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                : "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            }`}
          >
            {status}
          </motion.div>
        )}
      </form>
    </div>
  );
}
