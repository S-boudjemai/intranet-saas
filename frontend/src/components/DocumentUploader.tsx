import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToastHelpers } from './ToastContainer';
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  XIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from './icons';

interface DocumentUploaderProps {
  tenant_id?: number;
  categoryId?: string;
  onUploadSuccess: (uploadedDocument?: any) => Promise<void>;
  compact?: boolean; // Mode compact pour intégration
}

interface UploadFile {
  file: File;
  id: string;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function DocumentUploader({ 
  tenant_id, 
  categoryId, 
  onUploadSuccess,
  compact = false 
}: DocumentUploaderProps) {
  const { token } = useAuth();
  const toast = useToastHelpers();
  
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Gestion drag & drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  // Validation et ajout des fichiers
  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`Format non supporté: ${file.name}`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`Fichier trop volumineux: ${file.name}`);
        return false;
      }
      
      return true;
    });

    const uploadFiles: UploadFile[] = validFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name.split('.').slice(0, -1).join('.') || file.name,
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
    
    // Auto-upload si un seul fichier en mode compact
    if (compact && uploadFiles.length === 1) {
      setTimeout(() => startUpload(uploadFiles[0]), 100);
    }
  }, [compact, toast]);

  // Upload avec retry et gestion d'erreurs améliorée
  const uploadFileWithRetry = async (uploadFile: UploadFile, retries = 3): Promise<any> => {
    const { file, name } = uploadFile;
    
    // Validation tenant_id
    if (!tenant_id || typeof tenant_id !== 'number') {
      throw new Error('Identifiant tenant manquant ou invalide');
    }
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Essayer d'abord l'upload via backend (évite CORS S3)
        updateFileStatus(uploadFile.id, 'uploading', 20);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name.trim());
        if (categoryId) formData.append('categoryId', categoryId);
        formData.append('tenant_id', tenant_id.toString());

        const directUploadResponse = await fetchWithTimeout(
          `${import.meta.env.VITE_API_URL}/documents/direct-upload`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
            timeout: 30000
          }
        );

        if (directUploadResponse.ok) {
          const uploadedDocument = await directUploadResponse.json();
          updateFileStatus(uploadFile.id, 'success', 100);
          return uploadedDocument; // Retourner le document créé
        }

        // Log de l'erreur backend pour debug
        console.log(`Backend upload failed: ${directUploadResponse.status}, falling back to S3...`);

        // Fallback vers upload S3 si endpoint direct n'existe pas (production uniquement)
        console.log('Direct upload failed, trying S3 method...');
        
        // Étape 1: Obtenir l'URL d'upload S3
        updateFileStatus(uploadFile.id, 'uploading', 10);
        
        const safeName = encodeURIComponent(file.name);
        const response1 = await fetchWithTimeout(
          `${import.meta.env.VITE_API_URL}/documents/upload-url?filename=${safeName}&mimetype=${file.type}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );
        
        if (!response1.ok) {
          throw new Error(`Erreur serveur: ${response1.status}`);
        }
        
        const response1Data = await response1.json();
        const uploadUrl = response1Data.url || response1Data.data?.url;
        
        if (!uploadUrl) {
          throw new Error('URL d\'upload manquante dans la réponse serveur');
        }
        updateFileStatus(uploadFile.id, 'uploading', 30);

        // Étape 2: Upload vers S3
        const response2 = await fetchWithTimeout(uploadUrl, {
          method: 'PUT',
          headers: { 
            'Content-Type': file.type
          },
          body: file,
          timeout: 30000
        });

        if (!response2.ok) {
          throw new Error(`Échec upload S3: ${response2.status}`);
        }
        
        updateFileStatus(uploadFile.id, 'uploading', 70);

        // Étape 3: Enregistrer en base
        // Construire l'URL à partir de l'URL d'upload pour éviter les erreurs de construction
        const uploadUrlObj = new URL(uploadUrl);
        const fileUrl = `${uploadUrlObj.protocol}//${uploadUrlObj.host}/${safeName}`;
        
        const documentData = {
          name: name.trim(),
          url: fileUrl,
          tenant_id: Number(tenant_id),
          ...(categoryId ? { categoryId } : {})
        };

        const response3 = await fetchWithTimeout(
          `${import.meta.env.VITE_API_URL}/documents`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(documentData),
            timeout: 10000
          }
        );

        if (!response3.ok) {
          throw new Error(`Erreur sauvegarde: ${response3.status}`);
        }

        updateFileStatus(uploadFile.id, 'success', 100);
        
        // Pour le fallback S3, récupérer l'objet document complet depuis la réponse
        const savedDocument = await response3.json();
        return savedDocument;

      } catch (error) {
        console.error(`Upload attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          // Dernier essai échoué
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          updateFileStatus(uploadFile.id, 'error', 0, errorMessage);
          throw error;
        }
        
        // Attendre avant le prochain essai
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };

  // Fetch avec timeout
  const fetchWithTimeout = async (url: string, options: any & { timeout?: number }) => {
    const { timeout = 8000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Utilitaires
  const updateFileStatus = (id: string, status: UploadFile['status'], progress: number, error?: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status, progress, error } : f
    ));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const startUpload = async (uploadFile: UploadFile) => {
    setIsUploading(true);
    try {
      const uploadedDocument = await uploadFileWithRetry(uploadFile);
      await onUploadSuccess(uploadedDocument);
      
      if (compact) {
        // En mode compact, supprimer le fichier après succès
        setTimeout(() => removeFile(uploadFile.id), 1500);
      }
    } catch (error) {
      toast.error('Échec de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const startAllUploads = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      // Upload en parallèle (max 2 simultanés)
      const chunks = [];
      for (let i = 0; i < pendingFiles.length; i += 2) {
        chunks.push(pendingFiles.slice(i, i + 2));
      }

      for (const chunk of chunks) {
        await Promise.allSettled(
          chunk.map(file => uploadFileWithRetry(file))
        );
      }

      await onUploadSuccess();
      toast.success(`${pendingFiles.length} document(s) uploadé(s) !`);
      
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
  };

  // Interface compacte pour intégration
  if (compact) {
    return (
      <div className="space-y-3">
        <motion.div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragOver 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={false}
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
            className="hidden"
          />
          
          <CloudArrowUpIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground">
            Glissez un fichier ici ou cliquez
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, PNG, JPG jusqu'à 10MB
          </p>
        </motion.div>

        {/* Liste des fichiers compacte */}
        <AnimatePresence>
          {files.map((uploadFile) => (
            <motion.div
              key={uploadFile.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
            >
              <div className="flex-shrink-0">
                {uploadFile.status === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : uploadFile.status === 'error' ? (
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <DocumentTextIcon className="h-5 w-5 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {uploadFile.name}
                </p>
                {uploadFile.status === 'uploading' && (
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <motion.div
                      className="bg-primary h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadFile.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
                {uploadFile.status === 'error' && (
                  <p className="text-xs text-red-500 mt-1">{uploadFile.error}</p>
                )}
              </div>

              <button
                onClick={() => removeFile(uploadFile.id)}
                className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Interface complète
  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragOver 
            ? 'border-primary bg-primary/10 scale-105' 
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
          className="hidden"
        />
        
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Glissez vos fichiers ici
        </h3>
        <p className="text-muted-foreground mb-4">
          ou cliquez pour sélectionner des fichiers
        </p>
        <p className="text-xs text-muted-foreground">
          Formats supportés : PDF, PNG, JPG • Taille max : 10MB par fichier
        </p>
      </motion.div>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">
              {files.length} fichier(s) sélectionné(s)
            </h4>
            <div className="flex gap-2">
              <button
                onClick={clearAll}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Tout effacer
              </button>
              {files.some(f => f.status === 'pending') && (
                <button
                  onClick={startAllUploads}
                  disabled={isUploading}
                  className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                >
                  {isUploading ? 'Upload...' : 'Tout uploader'}
                </button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {files.map((uploadFile) => (
              <motion.div
                key={uploadFile.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
              >
                <div className="flex-shrink-0">
                  {uploadFile.status === 'success' ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  ) : uploadFile.status === 'error' ? (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                  ) : (
                    <DocumentTextIcon className="h-6 w-6 text-primary" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {uploadFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  
                  {uploadFile.status === 'uploading' && (
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <motion.div
                        className="bg-primary h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadFile.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                  
                  {uploadFile.status === 'error' && (
                    <p className="text-sm text-red-500 mt-1">{uploadFile.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {uploadFile.status === 'pending' && (
                    <button
                      onClick={() => startUpload(uploadFile)}
                      disabled={isUploading}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <CloudArrowUpIcon className="h-4 w-4" />
                      {isUploading ? 'Upload...' : 'Uploader'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}