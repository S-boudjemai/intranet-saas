// src/components/planning/EventDetailsModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Building2, FileText, CheckCircle, XCircle, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import planningService from '../../services/planningService';
import { CalendarEvent, PlanningTask, UpdatePlanningTaskDto, PlanningTaskStatus } from '../../types/planning';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onUpdate: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onUpdate,
}) => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UpdatePlanningTaskDto>({});

  // Initialiser le formulaire avec les données de l'événement
  useEffect(() => {
    if (event && event.resource.type === 'task') {
      const task = event.resource.data as PlanningTask;
      setFormData({
        title: task.title,
        description: task.description || '',
        scheduled_date: new Date(task.scheduled_date).toISOString().slice(0, 16),
        duration: task.duration,
        restaurant_id: task.restaurant_id,
        assigned_to: task.assigned_to,
      });
    }
  }, [event]);

  // Réinitialiser l'état à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setEditing(false);
      setFormData({});
    }
  }, [isOpen]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    // Réinitialiser le formulaire
    if (event && event.resource.type === 'task') {
      const task = event.resource.data as PlanningTask;
      setFormData({
        title: task.title,
        description: task.description || '',
        scheduled_date: new Date(task.scheduled_date).toISOString().slice(0, 16),
        duration: task.duration,
        restaurant_id: task.restaurant_id,
        assigned_to: task.assigned_to,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event || event.resource.type !== 'task') return;
    
    if (!formData.title?.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    // Vérifier que la date n'est pas dans le passé (si elle est modifiée)
    if (formData.scheduled_date) {
      const scheduledDate = new Date(formData.scheduled_date);
      const now = new Date();
      if (scheduledDate < now) {
        toast.error('Impossible de programmer une tâche dans le passé');
        return;
      }
    }

    try {
      setLoading(true);
      const taskId = event.resource.data.id;
      await planningService.updateTask(taskId, formData);
      toast.success('Tâche mise à jour avec succès');
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error(
        error.response?.data?.message || 'Erreur lors de la mise à jour'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: PlanningTaskStatus) => {
    if (!event || event.resource.type !== 'task') return;

    try {
      setLoading(true);
      const taskId = event.resource.data.id;
      
      if (newStatus === PlanningTaskStatus.COMPLETED) {
        await planningService.completeTask(taskId);
        toast.success('Tâche marquée comme terminée');
      } else {
        await planningService.updateTask(taskId, { status: newStatus });
        toast.success('Statut mis à jour');
      }
      
      onUpdate();
    } catch (error: any) {
      console.error('Erreur lors du changement de statut:', error);
      toast.error(
        error.response?.data?.message || 'Erreur lors du changement de statut'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event || event.resource.type !== 'task') return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    try {
      setLoading(true);
      const taskId = event.resource.data.id;
      await planningService.deleteTask(taskId);
      toast.success('Tâche supprimée avec succès');
      onClose();
      onUpdate();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(
        error.response?.data?.message || 'Erreur lors de la suppression'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : 
              name === 'restaurant_id' || name === 'assigned_to' || name === 'duration' 
                ? parseInt(value) || undefined 
                : value,
    }));
  };

  if (!isOpen || !event) return null;

  const isTask = event.resource.type === 'task';
  const isAudit = event.resource.type === 'audit';
  const data = event.resource.data;
  
  // Vérifier les permissions d'édition (seulement pour les tâches)
  const canEdit = isTask && user && (
    data.created_by === user.userId || 
    user.role === 'admin'
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isAudit ? 'Détails de l\'audit' : 'Détails de la tâche'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-4">
          {editing && isTask ? (
            /* Mode édition */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date et heure *
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_date"
                  value={formData.scheduled_date || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              {/* Durée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Durée (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration || ''}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Boutons d'édition */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-400 rounded-lg transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Sauvegarder'
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Mode affichage */
            <div className="space-y-4">
              {/* Titre */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {data.title}
                </h3>
                {data.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {data.description}
                  </p>
                )}
              </div>

              {/* Informations */}
              <div className="space-y-3">
                {/* Date */}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(data.scheduled_date), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}
                  </span>
                </div>

                {/* Durée */}
                {data.duration && (
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {data.duration} minutes
                    </span>
                  </div>
                )}

                {/* Restaurant */}
                {data.restaurant && (
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {data.restaurant.name}
                    </span>
                  </div>
                )}

                {/* Assigné à */}
                {(data.assignedUser || data.auditor) && (
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {data.assignedUser?.name || data.auditor?.name || 
                       data.assignedUser?.email || data.auditor?.email}
                    </span>
                  </div>
                )}

                {/* Statut */}
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    data.status === 'completed' ? 'bg-green-500' :
                    data.status === 'cancelled' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {data.status === 'completed' ? 'Terminé' :
                     data.status === 'cancelled' ? 'Annulé' :
                     data.status === 'pending' ? 'En attente' :
                     data.status}
                  </span>
                </div>
              </div>

              {/* Actions pour les tâches */}
              {isTask && canEdit && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                  <div className="flex flex-wrap gap-2">
                    {/* Bouton Éditer */}
                    <button
                      onClick={handleEdit}
                      className="flex items-center px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Éditer
                    </button>

                    {/* Boutons de statut */}
                    {data.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(PlanningTaskStatus.COMPLETED)}
                        disabled={loading}
                        className="flex items-center px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Terminer
                      </button>
                    )}

                    {data.status !== 'cancelled' && data.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(PlanningTaskStatus.CANCELLED)}
                        disabled={loading}
                        className="flex items-center px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Annuler
                      </button>
                    )}

                    {/* Bouton Supprimer */}
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="flex items-center px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;