import { useState } from 'react';
import { FiX, FiPlus, FiTrash2, FiMove } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

interface AuditItem {
  id: string;
  question: string;
  type: 'yes_no' | 'score' | 'text' | 'photo';
  is_required: boolean;
  max_score?: number;
  help_text?: string;
  critical?: boolean;
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  restaurantType?: string;
}

const QUESTION_TYPES = {
  yes_no: 'Oui/Non',
  score: 'Score (1-5)',
  text: 'Texte libre',
  photo: 'Photo'
};

const CATEGORIES = [
  { id: 'hygiene', label: '🧽 Hygiène & Sécurité Alimentaire', icon: '🧽' },
  { id: 'security', label: '🔥 Sécurité Incendie & Équipements', icon: '🔥' },
  { id: 'service', label: '👥 Service Client & Accueil', icon: '👥' },
  { id: 'management', label: '📊 Gestion & Administratif', icon: '📊' },
  { id: 'environment', label: '🌿 Environnement & Développement Durable', icon: '🌿' },
  { id: 'infrastructure', label: '🏢 Infrastructure & Maintenance', icon: '🏢' },
  { id: 'finance', label: '💰 Gestion Financière & Stocks', icon: '💰' }
];

const FREQUENCIES = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Bi-mensuel' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestriel' },
  { value: 'biannual', label: 'Semestriel' },
  { value: 'annual', label: 'Annuel' },
  { value: 'oneTime', label: 'Ponctuel' }
];

// Questions prédéfinies par catégorie
const PREDEFINED_QUESTIONS = {
  hygiene: [
    {
      question: "La chaîne du froid est-elle respectée?",
      type: 'yes_no' as const,
      critical: true,
      help_text: "Vérifier les températures frigo/congélateur"
    },
    {
      question: "État de propreté des surfaces de travail",
      type: 'score' as const,
      max_score: 5,
      help_text: "1=Sale, 5=Impeccable"
    },
    {
      question: "Lavage des mains - Procédure affichée et respectée?",
      type: 'yes_no' as const,
      critical: true
    },
    {
      question: "Date limite de consommation respectée?",
      type: 'yes_no' as const,
      critical: true
    },
    {
      question: "Température des réfrigérateurs",
      type: 'text' as const,
      help_text: "Ex: Frigo 1: 4°C, Frigo 2: 3°C"
    }
  ],
  security: [
    {
      question: "Extincteurs vérifiés et accessibles?",
      type: 'yes_no' as const,
      critical: true
    },
    {
      question: "Issues de secours dégagées?",
      type: 'yes_no' as const,
      critical: true
    },
    {
      question: "État des équipements électriques",
      type: 'score' as const,
      max_score: 5
    }
  ],
  service: [
    {
      question: "Temps d'attente moyen client",
      type: 'text' as const,
      help_text: "Ex: 5-10 minutes"
    },
    {
      question: "Propreté de la salle et des tables",
      type: 'score' as const,
      max_score: 5
    },
    {
      question: "Uniforme du personnel propre et conforme?",
      type: 'yes_no' as const
    }
  ]
};

export default function CreateTemplateModal({ isOpen, onClose, onSuccess, restaurantType }: CreateTemplateModalProps) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState({
    name: '',
    description: '',
    category: '',
    frequency: 'monthly',
    is_mandatory: false,
    estimated_duration: 30
  });
  const [questions, setQuestions] = useState<AuditItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addQuestion = (predefined?: any) => {
    const newQuestion: AuditItem = {
      id: generateId(),
      question: predefined?.question || '',
      type: predefined?.type || 'yes_no',
      is_required: predefined?.critical || false,
      max_score: predefined?.max_score,
      help_text: predefined?.help_text,
      critical: predefined?.critical
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newQuestions = [...questions];
    const draggedItem = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(dropIndex, 0, draggedItem);
    
    setQuestions(newQuestions);
    setDraggedIndex(null);
  };

  const handleSubmit = async () => {
    try {
      const finalTemplate = {
        name: template.name,
        description: template.description,
        category: template.category,
        items: questions.map((q, index) => ({ ...q, order: index + 1 }))
      };

      // Utiliser le token du contexte d'auth
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audit-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(finalTemplate),
      });

      if (response.ok) {
        onSuccess?.();
        onClose();
      } else {
        const error = await response.json();
        // Template creation error
        alert('Erreur lors de la création du template');
      }
    } catch (error) {
      // Template creation error
      alert('Erreur lors de la création du template');
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Nouveau Template d'Audit
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Étape {step} sur 4 - {restaurantType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b bg-muted">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
            <span className="w-8 text-center">Infos générales</span>
            <span className="w-12"></span>
            <span className="w-8 text-center">Configuration</span>
            <span className="w-12"></span>
            <span className="w-8 text-center">Questions</span>
            <span className="w-12"></span>
            <span className="w-8 text-center">Validation</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nom du template *
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                  placeholder="Ex: Hygiène Cuisine Q1"
                  className="w-full px-3 py-2 border bg-background text-gray-900 placeholder:text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={template.description}
                  onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                  placeholder="Description du template..."
                  rows={3}
                  className="w-full px-3 py-2 border bg-background text-gray-900 placeholder:text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Catégorie *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setTemplate({ ...template, category: category.id })}
                      className={`p-3 text-left rounded-lg border-2 transition-colors ${
                        template.category === category.id
                          ? 'border-primary bg-primary/10'
                          : 'border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="text-sm font-medium">{category.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fréquence d'audit
                </label>
                <select
                  value={template.frequency}
                  onChange={(e) => setTemplate({ ...template, frequency: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {FREQUENCIES.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Durée estimée (minutes)
                </label>
                <select
                  value={template.estimated_duration}
                  onChange={(e) => setTemplate({ ...template, estimated_duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 heure</option>
                  <option value={120}>2 heures</option>
                  <option value={240}>4+ heures</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="mandatory"
                  checked={template.is_mandatory}
                  onChange={(e) => setTemplate({ ...template, is_mandatory: e.target.checked })}
                  className="w-4 h-4 text-primary bg-background border rounded focus:ring-primary"
                />
                <label htmlFor="mandatory" className="text-sm font-medium text-foreground">
                  Audit obligatoire pour tous les restaurants
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* Questions prédéfinies */}
              {template.category && PREDEFINED_QUESTIONS[template.category as keyof typeof PREDEFINED_QUESTIONS] && (
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Questions suggérées pour {CATEGORIES.find(c => c.id === template.category)?.label}
                  </h3>
                  <div className="grid gap-3">
                    {PREDEFINED_QUESTIONS[template.category as keyof typeof PREDEFINED_QUESTIONS].map((predefined, index) => {
                      const isSelected = questions.some(q => q.question === predefined.question);
                      return (
                        <div key={index} className={`p-3 border rounded-lg transition-colors ${
                          isSelected ? 'bg-primary/10 border-primary' : 'bg-muted hover:bg-muted/70'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{predefined.question}</p>
                              <p className="text-sm text-muted-foreground">
                                Type: {QUESTION_TYPES[predefined.type]}
                                {(predefined as any).critical && <span className="ml-2 text-red-600 font-medium">⚠️ Critique</span>}
                              </p>
                              {(predefined as any).help_text && (
                                <p className="text-sm text-muted-foreground mt-1">{(predefined as any).help_text}</p>
                              )}
                            </div>
                            <button
                              onClick={() => !isSelected && addQuestion(predefined)}
                              disabled={isSelected}
                              className={`ml-3 px-3 py-1 text-sm rounded transition-colors ${
                                isSelected 
                                  ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-300' 
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {isSelected ? '✓ Ajoutée' : 'Ajouter'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Questions ajoutées */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-foreground">
                    Questions du template ({questions.length})
                  </h3>
                  <button
                    onClick={() => addQuestion()}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Question personnalisée</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="p-4 border rounded-lg bg-background cursor-move hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-3">
                        <FiMove className="w-5 h-5 text-muted-foreground mt-1" />
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={question.question}
                            onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                            placeholder="Votre question..."
                            className="w-full px-3 py-2 border bg-background text-gray-900 placeholder:text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          
                          <div className="flex items-center space-x-4">
                            <select
                              value={question.type}
                              onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                              className="px-3 py-1 border bg-background text-foreground rounded-md text-sm"
                            >
                              {Object.entries(QUESTION_TYPES).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>

                            {question.type === 'score' && (
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={question.max_score || 5}
                                onChange={(e) => updateQuestion(question.id, 'max_score', parseInt(e.target.value))}
                                className="w-20 px-2 py-1 border bg-background text-gray-900 placeholder:text-gray-500 rounded-md text-sm"
                                placeholder="Max"
                              />
                            )}

                            <label className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={question.is_required}
                                onChange={(e) => updateQuestion(question.id, 'is_required', e.target.checked)}
                                className="w-4 h-4 text-primary bg-background border rounded"
                              />
                              <span>Obligatoire</span>
                            </label>

                            <label className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={question.critical}
                                onChange={(e) => updateQuestion(question.id, 'critical', e.target.checked)}
                                className="w-4 h-4 text-red-600 bg-background border rounded"
                              />
                              <span className="text-red-600">⚠️ Critique</span>
                            </label>
                          </div>

                          <input
                            type="text"
                            value={question.help_text || ''}
                            onChange={(e) => updateQuestion(question.id, 'help_text', e.target.value)}
                            placeholder="Texte d'aide (optionnel)"
                            className="w-full px-3 py-2 border bg-background text-gray-900 placeholder:text-gray-500 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <button
                          onClick={() => removeQuestion(question.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-primary/10 p-4 rounded-lg border">
                <h3 className="text-lg font-medium text-foreground mb-2">Résumé du template</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Nom:</strong> {template.name}</p>
                  <p><strong>Catégorie:</strong> {CATEGORIES.find(c => c.id === template.category)?.label}</p>
                  <p><strong>Fréquence:</strong> {FREQUENCIES.find(f => f.value === template.frequency)?.label}</p>
                  <p><strong>Durée estimée:</strong> {template.estimated_duration} minutes</p>
                  <p><strong>Questions:</strong> {questions.length}</p>
                  <p><strong>Questions critiques:</strong> {questions.filter(q => q.critical).length}</p>
                  {template.is_mandatory && <p className="text-orange-600 font-medium">⚠️ Audit obligatoire</p>}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg border">
                <h4 className="font-medium text-foreground mb-2">📋 Aperçu des questions</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {questions.map((question, index) => (
                    <div key={question.id} className="text-sm">
                      <span className="font-medium text-foreground">{index + 1}.</span>
                      <span className="ml-2 text-muted-foreground">{question.question}</span>
                      {question.critical && <span className="ml-2 text-red-600">⚠️</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted">
          <button
            onClick={step === 1 ? onClose : prevStep}
            className="px-4 py-2 text-foreground bg-background border rounded-lg hover:bg-muted transition-colors"
          >
            {step === 1 ? 'Annuler' : 'Précédent'}
          </button>
          
          <div className="flex space-x-3">
            {step < 4 ? (
              <button
                onClick={nextStep}
                disabled={
                  (step === 1 && (!template.name || !template.category)) ||
                  (step === 3 && questions.length === 0)
                }
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Créer le template
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}