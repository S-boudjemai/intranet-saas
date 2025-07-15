import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiMove } from 'react-icons/fi';
import type { AuditTemplate } from '../../types';

interface EditableAuditItem {
  id: string;
  question: string;
  type: 'yes_no' | 'score' | 'text' | 'photo';
  is_required: boolean;
  order: number;
  max_score?: number;
  help_text?: string;
}

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (template: any) => void;
  template: AuditTemplate | null;
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

export default function EditTemplateModal({ isOpen, onClose, onSubmit, template }: EditTemplateModalProps) {
  const [editedTemplate, setEditedTemplate] = useState({
    name: '',
    description: '',
    category: '',
  });
  const [questions, setQuestions] = useState<EditableAuditItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (template) {
      setEditedTemplate({
        name: template.name,
        description: template.description || '',
        category: template.category,
      });
      // Convertir les items du template en format d'édition
      setQuestions(template.items.map(item => ({
        ...item,
        id: item.id?.toString() || Math.random().toString(36).substr(2, 9),
      })));
    }
  }, [template]);

  if (!isOpen || !template) return null;

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addQuestion = () => {
    const newQuestion = {
      id: generateId(),
      question: '',
      type: 'yes_no' as const,
      is_required: false,
      order: questions.length + 1,
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

  const handleSubmit = () => {
    const finalTemplate = {
      id: template.id,
      name: editedTemplate.name,
      description: editedTemplate.description,
      category: editedTemplate.category,
      items: questions.map((q, index) => ({
        ...q,
        order: index + 1,
        template_id: template.id
      }))
    };
    onSubmit(finalTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Modifier le Template d'Audit
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Modifiez les informations et questions du template
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Informations générales */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Informations générales</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom du template *
                  </label>
                  <input
                    type="text"
                    value={editedTemplate.name}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
                    placeholder="Ex: Hygiène Cuisine Q1"
                    className="w-full px-3 py-2 border bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={editedTemplate.description}
                    onChange={(e) => setEditedTemplate({ ...editedTemplate, description: e.target.value })}
                    placeholder="Description du template..."
                    rows={3}
                    className="w-full px-3 py-2 border bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                        onClick={() => setEditedTemplate({ ...editedTemplate, category: category.id })}
                        className={`p-3 text-left rounded-lg border-2 transition-colors ${
                          editedTemplate.category === category.id
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
            </div>

            {/* Questions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">
                  Questions du template ({questions.length})
                </h3>
                <button
                  onClick={addQuestion}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Ajouter une question</span>
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
                          className="w-full px-3 py-2 border bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
                              className="w-20 px-2 py-1 border bg-background text-foreground placeholder:text-muted-foreground rounded-md text-sm"
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
                        </div>

                        <input
                          type="text"
                          value={question.help_text || ''}
                          onChange={(e) => updateQuestion(question.id, 'help_text', e.target.value)}
                          placeholder="Texte d'aide (optionnel)"
                          className="w-full px-3 py-2 border bg-background text-foreground placeholder:text-muted-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground bg-background border rounded-lg hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!editedTemplate.name || !editedTemplate.category || questions.length === 0}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
          >
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}