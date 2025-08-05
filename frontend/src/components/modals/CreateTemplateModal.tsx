// src/components/modals/CreateTemplateModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  PlusIcon, 
  TrashIcon,
  DocumentReportIcon,
  ClipboardIcon
} from '../icons';
import { AuditCategory, AuditFrequency, QuestionType, CreateAuditTemplateDto } from '../../types';
import { AuditTemplateWithItems } from '../../services/auditTemplatesService';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (templateData: CreateAuditTemplateDto) => Promise<boolean>;
  template?: AuditTemplateWithItems; // Pour l'édition
}

interface TemplateItem {
  question: string;
  type: QuestionType;
  options?: string[];
  is_required: boolean;
  help_text?: string;
}

const CATEGORIES = [
  { value: AuditCategory.HYGIENE_SECURITY, label: 'Hygiène & Sécurité' },
  { value: AuditCategory.CUSTOMER_SERVICE, label: 'Service Client' },
  { value: AuditCategory.PROCESS_COMPLIANCE, label: 'Conformité Process' },
  { value: AuditCategory.EQUIPMENT_STANDARDS, label: 'Standards Équipement' },
  { value: AuditCategory.FINANCIAL_MANAGEMENT, label: 'Gestion Financière' },
  { value: AuditCategory.STAFF_MANAGEMENT, label: 'Gestion Personnel' },
];

const FREQUENCIES = [
  { value: AuditFrequency.DAILY, label: 'Quotidien' },
  { value: AuditFrequency.WEEKLY, label: 'Hebdomadaire' },
  { value: AuditFrequency.MONTHLY, label: 'Mensuel' },
  { value: AuditFrequency.QUARTERLY, label: 'Trimestriel' },
  { value: AuditFrequency.YEARLY, label: 'Annuel' },
  { value: AuditFrequency.ON_DEMAND, label: 'À la demande' },
];

const QUESTION_TYPES = [
  { value: QuestionType.SCORE_1_5, label: 'Score 1-5' },
  { value: QuestionType.YES_NO, label: 'Oui/Non' },
  { value: QuestionType.TEXT, label: 'Texte libre' },
  { value: QuestionType.SELECT, label: 'Choix multiple' },
  { value: QuestionType.PHOTO, label: 'Photo' },
  { value: QuestionType.TEMPERATURE, label: 'Température' },
];

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  template
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: AuditCategory.HYGIENE_SECURITY,
    frequency: AuditFrequency.WEEKLY,
    estimated_duration: 30,
  });

  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialiser le formulaire si on édite un template
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        frequency: template.frequency,
        estimated_duration: template.estimated_duration,
      });
      setItems(template.items?.map(item => ({
        question: item.question,
        type: item.type,
        options: item.options || [],
        is_required: item.is_required,
        help_text: item.help_text || '',
      })) || []);
    } else {
      // Reset pour création
      setFormData({
        name: '',
        description: '',
        category: AuditCategory.HYGIENE_SECURITY,
        frequency: AuditFrequency.WEEKLY,
        estimated_duration: 30,
      });
      setItems([]);
    }
  }, [template, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Ajoutez au moins une question');
      return;
    }

    setLoading(true);
    const templateData: CreateAuditTemplateDto = {
      ...formData,
      items: items.map((item, index) => ({
        ...item,
        order_index: index,
        options: item.type === QuestionType.SELECT ? item.options : undefined,
      })),
    };

    const success = await onSubmit(templateData);
    setLoading(false);
    
    if (success) {
      onClose();
    }
  };

  const addItem = () => {
    setItems([...items, {
      question: '',
      type: QuestionType.TEXT,
      is_required: true,
      help_text: '',
    }]);
  };

  const updateItem = (index: number, field: keyof TemplateItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addOption = (itemIndex: number) => {
    const newItems = [...items];
    if (!newItems[itemIndex].options) {
      newItems[itemIndex].options = [];
    }
    newItems[itemIndex].options!.push('');
    setItems(newItems);
  };

  const updateOption = (itemIndex: number, optionIndex: number, value: string) => {
    const newItems = [...items];
    newItems[itemIndex].options![optionIndex] = value;
    setItems(newItems);
  };

  const removeOption = (itemIndex: number, optionIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].options = newItems[itemIndex].options!.filter((_, i) => i !== optionIndex);
    setItems(newItems);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <DocumentReportIcon className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  {template ? 'Modifier le template' : 'Nouveau template d\'audit'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations de base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nom du template *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      placeholder="Ex: Audit Hygiène Restaurant"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Catégorie *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as AuditCategory })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Fréquence *
                    </label>
                    <select
                      required
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value as AuditFrequency })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    >
                      {FREQUENCIES.map(freq => (
                        <option key={freq.value} value={freq.value}>{freq.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Durée estimée (minutes) *
                    </label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="480"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Description détaillée du template..."
                  />
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Questions d'audit</h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Ajouter une question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, itemIndex) => (
                      <div key={itemIndex} className="bg-muted/20 p-4 rounded-lg border border-border">
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-sm font-medium text-muted-foreground">
                            Question #{itemIndex + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(itemIndex)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Question *
                            </label>
                            <input
                              type="text"
                              required
                              value={item.question}
                              onChange={(e) => updateItem(itemIndex, 'question', e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                              placeholder="Posez votre question..."
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Type de réponse *
                            </label>
                            <select
                              required
                              value={item.type}
                              onChange={(e) => updateItem(itemIndex, 'type', e.target.value as QuestionType)}
                              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            >
                              {QUESTION_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.is_required}
                                onChange={(e) => updateItem(itemIndex, 'is_required', e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <span className="text-sm text-foreground">Question obligatoire</span>
                            </label>
                          </div>
                        </div>

                        {item.type === QuestionType.SELECT && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-foreground">
                                Options de choix
                              </label>
                              <button
                                type="button"
                                onClick={() => addOption(itemIndex)}
                                className="text-primary hover:text-primary/80 text-sm"
                              >
                                + Ajouter option
                              </button>
                            </div>
                            <div className="space-y-2">
                              {item.options?.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateOption(itemIndex, optionIndex, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                                    placeholder="Option..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeOption(itemIndex, optionIndex)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Texte d'aide (optionnel)
                          </label>
                          <input
                            type="text"
                            value={item.help_text || ''}
                            onChange={(e) => updateItem(itemIndex, 'help_text', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                            placeholder="Instructions ou aide pour cette question..."
                          />
                        </div>
                      </div>
                    ))}

                    {items.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <ClipboardIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune question ajoutée</p>
                        <p className="text-sm">Cliquez sur "Ajouter une question" pour commencer</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors bg-background text-foreground"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || items.length === 0}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Enregistrement...' : template ? 'Mettre à jour' : 'Créer le template'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateTemplateModal;