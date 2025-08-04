// src/components/modals/ExecuteAuditModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Camera, 
  Thermometer,
  FileText,
  Star,
  AlertCircle,
  Save,
  Send
} from 'lucide-react';
import { AuditExecutionWithTemplate } from '../../services/auditExecutionsService';
import { AuditTemplateItem, QuestionType } from '../../types';
import toast from 'react-hot-toast';

interface ExecuteAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit?: AuditExecutionWithTemplate;
  onSaveResponse: (executionId: string, itemId: string, response: any) => Promise<boolean>;
  onCompleteAudit: (auditId: string, summary?: any) => Promise<boolean>;
}

interface AuditResponse {
  template_item_id: string;
  score_value?: number;
  boolean_value?: boolean;
  text_value?: string;
  photo_url?: string;
  temperature_value?: number;
  notes?: string;
  completed: boolean;
}

const ExecuteAuditModal: React.FC<ExecuteAuditModalProps> = ({
  isOpen,
  onClose,
  audit,
  onSaveResponse,
  onCompleteAudit,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, AuditResponse>>({});
  const [loading, setSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = audit?.template?.items || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const completedQuestions = Object.values(responses).filter(r => r.completed).length;
  const progress = questions.length > 0 ? (completedQuestions / questions.length) * 100 : 0;

  useEffect(() => {
    if (isOpen && audit && questions.length > 0) {
      // Initialiser les réponses vides
      const initialResponses: Record<string, AuditResponse> = {};
      questions.forEach(item => {
        initialResponses[item.id] = {
          template_item_id: item.id,
          completed: false,
        };
      });
      setResponses(initialResponses);
      setCurrentQuestionIndex(0);
    }
  }, [isOpen, audit]);

  // Protection après tous les hooks
  if (!isOpen || !audit) return null;

  // Protection si les items du template ne sont pas chargés
  if (!audit.template?.items || audit.template.items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background rounded-xl shadow-xl p-6 max-w-md text-center"
        >
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Template non disponible</h3>
          <p className="text-muted-foreground mb-4">
            Les questions de ce template ne sont pas disponibles. Veuillez réessayer.
          </p>
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
          >
            Fermer
          </button>
        </motion.div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const updateResponse = (updates: Partial<AuditResponse>) => {
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        ...updates,
        template_item_id: currentQuestion.id,
      }
    }));
  };

  const markQuestionCompleted = () => {
    updateResponse({ completed: true });
  };

  const handleSaveAndNext = async () => {
    const response = responses[currentQuestion.id];
    if (!response.completed) {
      toast.error('Veuillez répondre à la question avant de continuer');
      return;
    }

    setSaving(true);
    try {
      await onSaveResponse(audit.id, currentQuestion.id, response);
      
      if (isLastQuestion) {
        // Dernier question - proposer de terminer l'audit
        setIsSubmitting(true);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteAudit = async () => {
    const summary = {
      total_questions: questions.length,
      answered_questions: completedQuestions,
      completion_rate: progress,
      responses: Object.values(responses).filter(r => r.completed),
    };

    try {
      setIsSubmitting(true);
      const success = await onCompleteAudit(audit.id, summary);
      if (success) {
        toast.success('Audit terminé avec succès !');
        onClose();
      }
    } catch (error) {
      toast.error('Erreur lors de la finalisation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const mapStringToQuestionType = (type: string): QuestionType => {
    switch (type) {
      case 'score_1_5': return QuestionType.SCORE_1_5;
      case 'yes_no': return QuestionType.YES_NO;
      case 'text': return QuestionType.TEXT;
      case 'select': return QuestionType.SELECT;
      case 'photo': return QuestionType.PHOTO;
      case 'temperature': return QuestionType.TEMPERATURE;
      default: return QuestionType.TEXT; // fallback par défaut
    }
  };

  const getQuestionIcon = (type: string) => {
    const questionType = mapStringToQuestionType(type);
    switch (questionType) {
      case QuestionType.SCORE_1_5: return <Star className="w-5 h-5" />;
      case QuestionType.YES_NO: return <Check className="w-5 h-5" />;
      case QuestionType.TEXT: return <FileText className="w-5 h-5" />;
      case QuestionType.SELECT: return <FileText className="w-5 h-5" />;
      case QuestionType.PHOTO: return <Camera className="w-5 h-5" />;
      case QuestionType.TEMPERATURE: return <Thermometer className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const renderQuestionInput = () => {
    const response = responses[currentQuestion.id] || {
      template_item_id: currentQuestion.id,
      completed: false,
    };
    const questionType = mapStringToQuestionType(currentQuestion.type);

    switch (questionType) {
      case QuestionType.SCORE_1_5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Notez de 1 à 5</p>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => {
                    updateResponse({ score_value: score });
                    markQuestionCompleted();
                  }}
                  className={`w-12 h-12 rounded-full border-2 transition-all ${
                    response.score_value === score
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted hover:border-primary'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        );

      case QuestionType.YES_NO:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  updateResponse({ boolean_value: true });
                  markQuestionCompleted();
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  response.boolean_value === true
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'border-muted hover:border-green-300'
                }`}
              >
                <Check className="w-6 h-6 mx-auto mb-2" />
                <span className="font-medium">Oui</span>
              </button>
              <button
                onClick={() => {
                  updateResponse({ boolean_value: false });
                  markQuestionCompleted();
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  response.boolean_value === false
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : 'border-muted hover:border-red-300'
                }`}
              >
                <X className="w-6 h-6 mx-auto mb-2" />
                <span className="font-medium">Non</span>
              </button>
            </div>
          </div>
        );

      case QuestionType.TEXT:
        return (
          <div className="space-y-4">
            <textarea
              value={response.text_value || ''}
              onChange={(e) => updateResponse({ text_value: e.target.value })}
              onBlur={() => {
                if (response.text_value?.trim()) {
                  markQuestionCompleted();
                }
              }}
              placeholder="Votre réponse..."
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24"
            />
          </div>
        );

      case QuestionType.SELECT:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    updateResponse({ text_value: option });
                    markQuestionCompleted();
                  }}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    response.text_value === option
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      case QuestionType.PHOTO:
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Prenez une photo</p>
              <button
                onClick={() => {
                  // TODO: Implémenter capture photo
                  updateResponse({ photo_url: 'photo_placeholder.jpg' });
                  markQuestionCompleted();
                  toast.success('Photo capturée (simulation)');
                }}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
              >
                <Camera className="w-4 h-4 mr-2 inline" />
                Capturer
              </button>
            </div>
          </div>
        );

      case QuestionType.TEMPERATURE:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Thermometer className="w-6 h-6 text-blue-500" />
              <input
                type="number"
                value={response.temperature_value || ''}
                onChange={(e) => updateResponse({ temperature_value: parseFloat(e.target.value) })}
                onBlur={() => {
                  if (response.temperature_value !== undefined) {
                    markQuestionCompleted();
                  }
                }}
                placeholder="°C"
                className="flex-1 p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <span className="text-muted-foreground">°C</span>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Type de question non supporté
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header fixe */}
          <div className="bg-primary text-primary-foreground p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-foreground/20 rounded-lg">
                  {getQuestionIcon(currentQuestion.type)}
                </div>
                <div>
                  <h2 className="font-semibold">{audit.title}</h2>
                  <p className="text-primary-foreground/80 text-sm">
                    Question {currentQuestionIndex + 1} sur {questions.length}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barre de progression */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-primary-foreground/80">
                <span>Progression</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-primary-foreground/20 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className="bg-primary-foreground h-2 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Contenu scrollable */}
          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Question courante */}
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {currentQuestion.question}
                </h3>
                {currentQuestion.help_text && (
                  <p className="text-muted-foreground">
                    {currentQuestion.help_text}
                  </p>
                )}
              </div>

              {/* Interface de réponse */}
              {renderQuestionInput()}

              {/* Notes additionnelles */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Notes additionnelles (optionnel)
                </label>
                <textarea
                  value={responses[currentQuestion.id]?.notes || ''}
                  onChange={(e) => updateResponse({ notes: e.target.value })}
                  placeholder="Ajoutez des commentaires..."
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-20"
                />
              </div>
            </motion.div>
          </div>

          {/* Footer fixe */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex justify-between items-center">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>

              {!isSubmitting ? (
                <button
                  onClick={handleSaveAndNext}
                  disabled={loading || !responses[currentQuestion.id]?.completed}
                  className="flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : isLastQuestion ? (
                    <Send className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span>{isLastQuestion ? 'Terminer' : 'Suivant'}</span>
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="font-medium text-green-700 dark:text-green-300">
                        Finalisation de l'audit...
                      </p>
                      <button
                        onClick={handleCompleteAudit}
                        className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Confirmer la finalisation
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExecuteAuditModal;