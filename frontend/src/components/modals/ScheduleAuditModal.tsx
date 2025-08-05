// src/components/modals/ScheduleAuditModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, User, Clock, FileText } from 'lucide-react';
import { CreateAuditExecutionDto } from '../../services/auditExecutionsService';
import { AuditTemplate } from '../../types';
import { useScheduleAuditData } from '../../hooks/useScheduleAuditData';

interface ScheduleAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAuditExecutionDto) => Promise<boolean>;
  selectedTemplate?: AuditTemplate;
  /** Templates disponibles (fournis par la page parent pour éviter le cache stale) */
  availableTemplates?: AuditTemplate[];
}

const ScheduleAuditModal: React.FC<ScheduleAuditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedTemplate,
  availableTemplates,
}) => {
  const { templates: hookTemplates, restaurants, managers, loading: dataLoading } = useScheduleAuditData();
  
  // Utiliser les templates fournis par le parent, sinon fallback sur ceux du hook
  const templates = availableTemplates || hookTemplates;
  
  const [formData, setFormData] = useState<CreateAuditExecutionDto>({
    title: '',
    description: '',
    scheduled_date: '',
    template_id: selectedTemplate?.id || '',
    restaurant_id: 0,
    auditor_id: undefined,
  });

  const [loading, setLoading] = useState(false);
  const [selectedTemplateData, setSelectedTemplateData] = useState<AuditTemplate | undefined>(selectedTemplate);

  // Réinitialiser le formulaire quand le template sélectionné change
  useEffect(() => {
    if (selectedTemplate) {
      setSelectedTemplateData(selectedTemplate);
      setFormData(prev => ({
        ...prev,
        title: `Audit ${selectedTemplate.name}`,
        template_id: selectedTemplate.id,
      }));
    }
  }, [selectedTemplate]);

  // Gérer le changement de template dans le select
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplateData(template);
    setFormData(prev => ({
      ...prev,
      template_id: templateId,
      title: template ? `Audit ${template.name}` : '',
    }));
  };

  // Réinitialiser quand on ferme
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        scheduled_date: '',
        template_id: selectedTemplate?.id || '',
        restaurant_id: 0,
        auditor_id: undefined,
      });
      setSelectedTemplateData(selectedTemplate);
    }
  }, [isOpen, selectedTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.template_id || !formData.restaurant_id || !formData.scheduled_date) {
      return;
    }

    setLoading(true);
    
    const success = await onSubmit({
      ...formData,
      auditor_id: formData.auditor_id === 0 ? undefined : formData.auditor_id,
    });
    
    if (success) {
      onClose();
    }
    
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'template_id') {
      handleTemplateChange(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'restaurant_id' || name === 'auditor_id' ? Number(value) : value,
      }));
    }
  };

  // Calculer la date minimale (aujourd'hui)
  const today = new Date().toISOString().split('T')[0];

  // Calculer la durée estimée en heures et minutes
  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Non spécifiée';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-background border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Planifier un Audit
                </h2>
                {selectedTemplateData && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Template: {selectedTemplateData.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Chargement des données */}
            {dataLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-gray-600 dark:text-gray-300">Chargement des données...</span>
              </div>
            )}

            {!dataLoading && (
              <>
                {/* Sélection du template */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Template d'audit *
                  </label>
                  <select
                    name="template_id"
                    value={formData.template_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                  >
                    <option value="">Sélectionner un template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.category.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Template Info */}
                {selectedTemplateData && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">
                      Informations du Template
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Catégorie:</span>
                        <p className="font-medium text-foreground">
                          {selectedTemplateData.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Durée estimée:</span>
                        <p className="font-medium text-foreground flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDuration(selectedTemplateData.estimated_duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Le titre sera automatique basé sur le template sélectionné */}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description (optionnelle)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
                placeholder="Description ou notes particulières pour cet audit..."
              />
            </div>

            {/* Restaurant */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Restaurant *
              </label>
              <select
                name="restaurant_id"
                value={formData.restaurant_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
              >
                <option value={0}>Sélectionner un restaurant</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name} {restaurant.city && `- ${restaurant.city}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date et heure */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date et heure prévues *
              </label>
              <input
                type="datetime-local"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                min={`${today}T00:00`}
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
              />
            </div>

            {/* Auditeur */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Auditeur assigné (optionnel)
              </label>
              <select
                name="auditor_id"
                value={formData.auditor_id || 0}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background text-foreground"
              >
                <option value={0}>Non assigné</option>
                {managers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name 
                      ? `${user.name} (${user.email})` 
                      : user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-foreground bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || dataLoading || !formData.template_id || !formData.restaurant_id || !formData.scheduled_date}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Planification...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Planifier l'Audit
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScheduleAuditModal;