import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToastHelpers } from './ToastContainer';
import { parseJwt, type JwtPayload } from '../utils/jwt';
import DocumentUploader from './DocumentUploader';
import { 
  SpeakerphoneIcon, 
  PaperClipIcon, 
  UsersIcon, 
  PlusIcon,
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon
} from './icons';
import Button from './ui/Button';
import Badge from './ui/Badge';

interface Restaurant {
  id: number;
  name: string;
}

interface Document {
  id: string;
  name: string;
}

interface AnnouncementComposerProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

type Step = 'content' | 'targeting' | 'attachments' | 'review';

export default function AnnouncementComposer({ onSuccess, onCancel }: AnnouncementComposerProps) {
  const { token } = useAuth();
  const toast = useToastHelpers();
  
  // État du formulaire
  const [currentStep, setCurrentStep] = useState<Step>('content');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedRestaurants, setSelectedRestaurants] = useState<Restaurant[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Données
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showUploadDocument, setShowUploadDocument] = useState(false);

  const raw = token ? parseJwt<JwtPayload>(token) : null;

  // Fonction pour recharger les documents
  const loadDocuments = async () => {
    if (!token) return;
    try {
      const documentsRes = await fetch(`${import.meta.env.VITE_API_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (documentsRes.ok) {
        const documentsData = await documentsRes.json();
        setDocuments(documentsData.data || documentsData || []);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des documents');
    }
  };

  // Charger les données
  useEffect(() => {
    if (!token) return;
    
    const loadData = async () => {
      try {
        const [restaurantsRes, documentsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/restaurants`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${import.meta.env.VITE_API_URL}/documents`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (restaurantsRes.ok) {
          const restaurantsData = await restaurantsRes.json();
          setRestaurants(restaurantsData.data || restaurantsData || []);
        }

        if (documentsRes.ok) {
          const documentsData = await documentsRes.json();
          setDocuments(documentsData.data || documentsData || []);
        }
      } catch (error) {
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [token]);

  // Validation des étapes
  const isStepValid = (step: Step): boolean => {
    switch (step) {
      case 'content':
        return title.trim().length > 0 && content.trim().length > 0;
      case 'targeting':
        return true; // Optionnel
      case 'attachments':
        return true; // Optionnel
      case 'review':
        return isStepValid('content');
      default:
        return false;
    }
  };

  // Navigation entre étapes
  const nextStep = () => {
    const steps: Step[] = ['content', 'targeting', 'attachments', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['content', 'targeting', 'attachments', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Publication
  const handlePublish = async () => {
    if (!isStepValid('content')) return;

    setIsPublishing(true);
    try {
      const payload: any = { title, content };
      
      if (selectedRestaurants.length > 0) {
        payload.restaurant_ids = selectedRestaurants.map(r => r.id);
      }
      
      if (selectedDocuments.length > 0) {
        payload.document_ids = selectedDocuments.map(d => d.id);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      onSuccess();
      
      // Reset form
      setTitle('');
      setContent('');
      setSelectedRestaurants([]);
      setSelectedDocuments([]);
      setCurrentStep('content');
      
    } catch (error) {
      toast.error('Erreur lors de la publication');
    } finally {
      setIsPublishing(false);
    }
  };

  // Rendu des étapes
  const renderStepContent = () => {
    switch (currentStep) {
      case 'content':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Titre de l'annonce
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Nouvelle procédure de nettoyage..."
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {title.length}/100 caractères
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contenu du message
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Rédigez votre message ici..."
                rows={6}
                className="w-full p-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length}/2000 caractères
              </p>
            </div>
          </motion.div>
        );

      case 'targeting':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Cibler des restaurants spécifiques
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Laissez vide pour envoyer à tous les restaurants
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {restaurants.map((restaurant) => {
                  const isSelected = selectedRestaurants.some(r => r.id === restaurant.id);
                  return (
                    <button
                      key={restaurant.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedRestaurants(prev => prev.filter(r => r.id !== restaurant.id));
                        } else {
                          setSelectedRestaurants(prev => [...prev, restaurant]);
                        }
                      }}
                      className={`
                        p-3 border-2 rounded-lg text-left transition-colors
                        ${isSelected 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border bg-card text-card-foreground hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{restaurant.name}</span>
                        {isSelected && <CheckIcon className="h-4 w-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedRestaurants.length > 0 && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-primary font-medium">
                    {selectedRestaurants.length} restaurant(s) sélectionné(s)
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRestaurants.map((restaurant) => (
                      <Badge key={restaurant.id} variant="secondary">
                        {restaurant.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'attachments':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <PaperClipIcon className="h-5 w-5" />
                Joindre des documents
              </h3>
              
              {/* Zone d'upload principale */}
              {raw?.tenant_id && (
                <DocumentUploader
                  tenant_id={raw.tenant_id}
                  compact={true}
                  onUploadSuccess={async (uploadedDocument) => {
                    await loadDocuments();
                    // Auto-ajout du document uploadé à l'annonce (éviter les doublons)
                    if (uploadedDocument && uploadedDocument.id) {
                      setSelectedDocuments(prev => {
                        const exists = prev.some(doc => doc.id === uploadedDocument.id);
                        return exists ? prev : [...prev, uploadedDocument];
                      });
                    }
                  }}
                />
              )}

              {/* Option secondaire pour documents existants */}
              {documents.length > 0 && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowUploadDocument(!showUploadDocument)}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    ou choisir parmi {documents.length} document(s) déjà uploadé(s)
                  </button>
                  
                  {showUploadDocument && (
                    <div className="mt-4 grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {documents.map((document) => {
                        const isSelected = selectedDocuments.some(d => d.id === document.id);
                        return (
                          <button
                            key={document.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedDocuments(prev => prev.filter(d => d.id !== document.id));
                              } else {
                                setSelectedDocuments(prev => [...prev, document]);
                              }
                            }}
                            className={`
                              p-2 border rounded-md text-left text-sm transition-colors
                              ${isSelected 
                                ? 'border-primary bg-primary/10 text-primary' 
                                : 'border-border bg-card text-card-foreground hover:border-primary/50'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{document.name}</span>
                              {isSelected && <CheckIcon className="h-3 w-3 flex-shrink-0 ml-2" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Documents sélectionnés */}
              {selectedDocuments.length > 0 && (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary font-medium mb-2">
                    {selectedDocuments.length} document(s) joint(s) :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocuments.map((document) => (
                      <div key={document.id} className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded text-xs">
                        <span className="truncate max-w-[120px]">{document.name}</span>
                        <button
                          onClick={() => setSelectedDocuments(prev => prev.filter(d => d.id !== document.id))}
                          className="text-primary/60 hover:text-primary"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'review':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                Aperçu de votre annonce
              </h3>
              
              <div className="border border-border rounded-lg p-4 bg-card">
                <h4 className="font-bold text-card-foreground mb-2">{title}</h4>
                <p className="text-card-foreground whitespace-pre-wrap mb-4">{content}</p>
                
                {selectedRestaurants.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-2">Destinataires :</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRestaurants.map((restaurant) => (
                        <Badge key={restaurant.id} variant="secondary">
                          {restaurant.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDocuments.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Documents joints :</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocuments.map((document) => (
                        <Badge key={document.id} variant="outline">
                          <PaperClipIcon className="h-3 w-3 mr-1" />
                          {document.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (loadingData) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      {/* Header avec progression */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <SpeakerphoneIcon className="h-6 w-6 text-primary" />
            Composer une annonce
          </h2>
        </div>

        {/* Indicateur de progression */}
        <div className="flex items-center space-x-4">
          {(['content', 'targeting', 'attachments', 'review'] as Step[]).map((step, index) => {
            const stepLabels = {
              content: 'Contenu',
              targeting: 'Ciblage',
              attachments: 'Documents',
              review: 'Aperçu'
            };
            
            const isActive = currentStep === step;
            const isCompleted = ['content', 'targeting', 'attachments', 'review'].indexOf(currentStep) > index;
            
            return (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${isActive ? 'bg-primary text-primary-foreground' : ''}
                  ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                  ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                `}>
                  {isCompleted ? <CheckIcon className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {stepLabels[step]}
                </span>
                {index < 3 && (
                  <ArrowRightIcon className="h-4 w-4 text-muted-foreground mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-border">
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 'content'}
          >
            Précédent
          </Button>

          <div className="flex gap-3">
            {currentStep === 'review' ? (
              <Button
                onClick={handlePublish}
                disabled={!isStepValid('content') || isPublishing}
                className="min-w-[120px]"
              >
                {isPublishing ? 'Publication...' : 'Publier'}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
              >
                Suivant
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}