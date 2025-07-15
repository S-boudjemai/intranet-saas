import { useState } from 'react';
import type { TicketAttachment } from '../types';
import { XMarkIcon, MagnifyingGlassIcon } from '../components/icons';

interface AttachmentGalleryProps {
  attachments: TicketAttachment[];
  className?: string;
}

const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({ 
  attachments, 
  className = '' 
}) => {
  const [selectedImage, setSelectedImage] = useState<TicketAttachment | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className={`${className}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="relative group cursor-pointer"
              onClick={() => setSelectedImage(attachment)}
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                <img
                  src={attachment.url}
                  alt={attachment.filename}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Overlay au survol */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <MagnifyingGlassIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {/* Info du fichier */}
              <div className="mt-1 text-xs text-muted-foreground truncate">
                <div className="truncate" title={attachment.filename}>
                  {attachment.filename}
                </div>
                <div className="flex justify-between">
                  <span>{formatFileSize(attachment.file_size)}</span>
                  <span>{formatDate(attachment.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de prévisualisation */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-full bg-card rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-medium text-foreground" title={selectedImage.filename}>
                  {selectedImage.filename}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedImage.file_size)} • {formatDate(selectedImage.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-full hover:bg-accent transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Image */}
            <div className="p-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded"
              />
            </div>
            
            {/* Actions */}
            <div className="flex justify-center gap-3 p-4 border-t border-border">
              <a
                href={selectedImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Ouvrir dans un nouvel onglet
              </a>
              <a
                href={selectedImage.url}
                download={selectedImage.filename}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                Télécharger
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttachmentGallery;