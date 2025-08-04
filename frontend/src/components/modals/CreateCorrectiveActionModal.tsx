// src/components/modals/CreateCorrectiveActionModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '../icons';
import { 
  ActionCategory, 
  ActionPriority, 
  CreateCorrectiveActionDto 
} from '../../hooks/useCorrectiveActions';
import { useAuth } from '../../contexts/AuthContext';
import restaurantService from '../../services/restaurantService';
import usersService from '../../services/usersService';
import toast from 'react-hot-toast';

interface CreateCorrectiveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCorrectiveActionDto) => Promise<void>;
  auditExecutionId?: string;
  defaultTitle?: string;
  defaultDescription?: string;
}

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  [ActionCategory.EQUIPMENT_REPAIR]: '🔧 Réparation matériel',
  [ActionCategory.STAFF_TRAINING]: '👥 Formation personnel',
  [ActionCategory.CLEANING_DISINFECTION]: '🧹 Nettoyage & Désinfection',
  [ActionCategory.PROCESS_IMPROVEMENT]: '📊 Amélioration process',
  [ActionCategory.COMPLIANCE_ISSUE]: '⚖️ Conformité',
  [ActionCategory.OTHER]: '📋 Autre'
};

const PRIORITY_LABELS: Record<ActionPriority, { label: string; color: string }> = {
  [ActionPriority.LOW]: { label: 'Faible', color: 'bg-green-100 text-green-800' },
  [ActionPriority.MEDIUM]: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800' },
  [ActionPriority.HIGH]: { label: 'Haute', color: 'bg-orange-100 text-orange-800' },
  [ActionPriority.CRITICAL]: { label: 'Critique', color: 'bg-red-100 text-red-800' }
};

const CreateCorrectiveActionModal: React.FC<CreateCorrectiveActionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  auditExecutionId,
  defaultTitle = '',
  defaultDescription = ''
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateCorrectiveActionDto>({
    title: defaultTitle,
    description: defaultDescription,
    category: ActionCategory.OTHER,
    priority: ActionPriority.MEDIUM,
    due_date: '',
    restaurant_id: 0,
    assigned_to: undefined,
    audit_execution_id: auditExecutionId
  });
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les restaurants et utilisateurs
  useEffect(() => {
    if (isOpen) {
      loadRestaurants();
      loadUsers();
    }
  }, [isOpen]);

  // Si lié à un audit, pré-remplir le titre et la description
  useEffect(() => {
    if (auditExecutionId && defaultTitle && defaultDescription) {
      setFormData(prev => ({
        ...prev,
        title: defaultTitle,
        description: defaultDescription,
        audit_execution_id: auditExecutionId
      }));
    }
  }, [auditExecutionId, defaultTitle, defaultDescription]);

  const loadRestaurants = async () => {
    try {
      const data = await restaurantService.getAll();
      setRestaurants(data);
      // Sélectionner le premier restaurant par défaut
      if (data.length > 0 && !formData.restaurant_id) {
        setFormData(prev => ({ ...prev, restaurant_id: data[0].id }));
      }
    } catch (error) {
      toast.error('Impossible de charger les restaurants');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await usersService.getAll();
      setUsers(data);
    } catch (error) {
      toast.error('Impossible de charger les utilisateurs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.due_date || formData.restaurant_id === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Préparer les données en supprimant les champs vides/invalides
      const cleanData: CreateCorrectiveActionDto = {
        title: formData.title,
        category: formData.category,
        priority: formData.priority,
        due_date: formData.due_date,
      };
      
      // Ajouter les champs optionnels seulement s'ils sont valides
      if (formData.description?.trim()) {
        cleanData.description = formData.description.trim();
      }
      if (formData.restaurant_id && formData.restaurant_id > 0) {
        cleanData.restaurant_id = formData.restaurant_id;
      }
      if (formData.assigned_to && formData.assigned_to > 0) {
        cleanData.assigned_to = formData.assigned_to;
      }
      if (formData.audit_execution_id) {
        cleanData.audit_execution_id = formData.audit_execution_id;
      }
      
      await onSubmit(cleanData);
      handleClose();
    } catch (error) {
      // L'erreur est déjà gérée dans le hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: ActionCategory.OTHER,
      priority: ActionPriority.MEDIUM,
      due_date: '',
      restaurant_id: 0,
      assigned_to: undefined,
      audit_execution_id: undefined
    });
    onClose();
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    return maxDate.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">
              Nouvelle Action Corrective
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                placeholder="Ex: Réparation du frigo de la cuisine"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
                placeholder="Décrivez l'action à effectuer en détail..."
                rows={4}
              />
            </div>

            {/* Catégorie et Priorité */}
            <div className="grid grid-cols-2 gap-4">
              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Catégorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ActionCategory })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Priorité */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priorité *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as ActionPriority })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Restaurant et Assignation */}
            <div className="grid grid-cols-2 gap-4">
              {/* Restaurant */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Restaurant *
                </label>
                <select
                  value={formData.restaurant_id}
                  onChange={(e) => setFormData({ ...formData, restaurant_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  required
                >
                  <option value="">Sélectionner un restaurant</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name} - {restaurant.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigné à */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Assigné à
                </label>
                <select
                  value={formData.assigned_to || ''}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                >
                  <option value="">Non assigné</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date d'échéance */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date d'échéance *
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                L'action doit être planifiée entre demain et dans 6 mois maximum.
              </p>
            </div>

            {/* Info audit lié */}
            {auditExecutionId && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  ℹ️ Cette action sera liée à l'audit en cours.
                </p>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/20">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Création...' : 'Créer l\'action'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateCorrectiveActionModal;