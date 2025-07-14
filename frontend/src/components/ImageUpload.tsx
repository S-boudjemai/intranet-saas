import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { TicketAttachment } from '../types';

interface ImageUploadProps {
  ticketId?: string;
  commentId?: string;
  onUploadSuccess?: (attachment: TicketAttachment) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

// Icônes SVG
const PhotoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const CloudArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18.75 19.5H6.75Z" />
  </svg>
);

const SpinnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const ImageUpload: React.FC<ImageUploadProps> = ({
  ticketId,
  commentId,
  onUploadSuccess,
  onUploadError,
  className = '',
  disabled = false
}) => {
  const { token } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadImage = async (file: File) => {
    if (!token) {
      onUploadError?.('Non authentifié');
      return;
    }

    if (!ticketId && !commentId) {
      onUploadError?.('ID de ticket ou commentaire requis');
      return;
    }

    // Vérifier le type de fichier
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      onUploadError?.('Seules les images sont autorisées (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      onUploadError?.('La taille du fichier ne doit pas dépasser 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (ticketId) formData.append('ticketId', ticketId);
      if (commentId) formData.append('commentId', commentId);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'upload');
      }

      const json = await response.json();
      const attachment: TicketAttachment = json.data || json;
      onUploadSuccess?.(attachment);
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
    // Reset input pour permettre de sélectionner le même fichier à nouveau
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  return (
    <div className={`${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200
          ${dragOver 
            ? 'border-primary bg-primary/5 scale-105' 
            : 'border-border hover:border-primary/50 hover:bg-accent/30'
          }
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!disabled && !isUploading) {
            document.getElementById('image-upload-input')?.click();
          }
        }}
      >
        <input
          id="image-upload-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <>
              <SpinnerIcon className="h-8 w-8 text-primary" />
              <span className="text-sm text-muted-foreground">Upload en cours...</span>
            </>
          ) : (
            <>
              {dragOver ? (
                <CloudArrowUpIcon className="h-8 w-8 text-primary" />
              ) : (
                <PhotoIcon className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="text-sm">
                <span className="font-medium text-primary">Cliquez pour ajouter</span>
                <span className="text-muted-foreground"> ou glissez une image</span>
              </div>
              <span className="text-xs text-muted-foreground">
                JPEG, PNG, GIF, WebP - Max 5MB
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;