// src/components/modals/AuditDetailsModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, User, Clock, FileText, Play, CheckCircle, MessageSquare, Star, CheckSquare, Type, Camera, Thermometer } from 'lucide-react';
import { AuditExecutionWithTemplate } from '../../services/auditExecutionsService';

interface AuditDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit?: AuditExecutionWithTemplate;
  onStartAudit?: (auditId: string) => void;
  onCompleteAudit?: (auditId: string) => void;
}

const AuditDetailsModal: React.FC<AuditDetailsModalProps> = ({
  isOpen,
  onClose,
  audit,
  onStartAudit,
  onCompleteAudit,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !audit) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planifié';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'overdue': return 'En retard';
      default: return status;
    }
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

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Non spécifiée';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'score_1_5': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'yes_no': return <CheckSquare className="w-4 h-4 text-blue-500" />;
      case 'text': return <Type className="w-4 h-4 text-gray-500" />;
      case 'select': return <CheckSquare className="w-4 h-4 text-purple-500" />;
      case 'photo': return <Camera className="w-4 h-4 text-green-500" />;
      case 'temperature': return <Thermometer className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'score_1_5': return 'Score 1-5';
      case 'yes_no': return 'Oui/Non';
      case 'text': return 'Texte libre';
      case 'select': return 'Sélection';
      case 'photo': return 'Photo';
      case 'temperature': return 'Température';
      default: return type;
    }
  };

  const formatResponseValue = (response: any, questionType: string) => {
    if (response.numeric_value !== null && response.numeric_value !== undefined) {
      if (questionType === 'score_1_5') {
        return `${response.numeric_value}/5 ⭐`;
      } else if (questionType === 'temperature') {
        return `${response.numeric_value}°C`;
      } else {
        return response.numeric_value.toString();
      }
    }
    
    if (response.value) {
      if (questionType === 'yes_no') {
        return response.value === 'yes' ? '✅ Oui' : '❌ Non';
      }
      return response.value;
    }
    
    return '⚪ Non répondu';
  };

  const handleAction = async (action: () => void) => {
    setLoading(true);
    try {
      await action();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Détails de l'Audit
                </h2>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
                  {getStatusLabel(audit.status)}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Informations générales */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Informations Générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Titre</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{audit.title}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Template</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {audit.template?.name || 'Template non disponible'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Restaurant</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {audit.restaurant?.name || 'Restaurant non disponible'}
                    {audit.restaurant?.city && ` - ${audit.restaurant.city}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Auditeur</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {audit.auditor ? 
                      audit.auditor.name || audit.auditor.email :
                      'Non assigné'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Dates et timing */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Planification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Date prévue</label>
                  <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(audit.scheduled_date)}
                  </p>
                </div>
                {audit.started_at && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Démarré le</label>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(audit.started_at)}
                    </p>
                  </div>
                )}
                {audit.completed_at && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Terminé le</label>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(audit.completed_at)}
                    </p>
                  </div>
                )}
                {audit.template?.estimated_duration && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">Durée estimée</label>
                    <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(audit.template.estimated_duration)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {audit.description && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300">{audit.description}</p>
              </div>
            )}

            {/* Template Details */}
            {audit.template && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Détails du Template
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Catégorie</label>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {audit.template.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-500 dark:text-gray-400">Durée estimée</label>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDuration(audit.template.estimated_duration)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Réponses d'Audit */}
            {audit.status === 'completed' && audit.responses && audit.responses.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                    Réponses d'Audit ({audit.responses.length})
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {audit.responses.filter(r => r.value || r.numeric_value).length}/{audit.responses.length} répondues
                  </div>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {audit.responses
                    .sort((a, b) => (a.template_item?.order_index || 0) - (b.template_item?.order_index || 0))
                    .map((response, index) => {
                      const question = response.template_item?.question || 
                                     audit.template?.items?.find(item => item.id === response.template_item_id)?.question || 
                                     'Question non trouvée';
                      const questionType = response.template_item?.type || 
                                         audit.template?.items?.find(item => item.id === response.template_item_id)?.type || 
                                         'text';
                      
                      return (
                        <div key={response.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start space-x-2 flex-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Q{index + 1}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                  {question}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  {getQuestionTypeIcon(questionType)}
                                  <span>{getQuestionTypeLabel(questionType)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-8">
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Réponse: 
                              </span>
                              <span className="text-sm text-gray-900 dark:text-gray-100 ml-2">
                                {formatResponseValue(response, questionType)}
                              </span>
                            </div>
                            
                            {response.comment && (
                              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Commentaire:</span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {response.comment}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Audit non terminé ou sans réponses */}
            {audit.status !== 'completed' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-500 mr-2" />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                      Réponses d'Audit
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {audit.status === 'scheduled' 
                        ? 'Les réponses seront disponibles une fois l\'audit démarré et terminé.'
                        : audit.status === 'in_progress'
                        ? 'Audit en cours... Les réponses seront visibles une fois l\'audit terminé.'
                        : 'Aucune réponse disponible.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
              >
                Fermer
              </button>
              
              <div className="flex space-x-3">
                {audit.status === 'scheduled' && onStartAudit && (
                  <button
                    onClick={() => handleAction(() => onStartAudit(audit.id))}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Démarrer l'Audit
                  </button>
                )}
                
                {audit.status === 'in_progress' && onCompleteAudit && (
                  <button
                    onClick={() => handleAction(() => onCompleteAudit(audit.id))}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Terminer
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuditDetailsModal;