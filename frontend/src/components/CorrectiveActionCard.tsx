// src/components/CorrectiveActionCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  CorrectiveAction, 
  ActionCategory, 
  ActionStatus, 
  ActionPriority 
} from '../hooks/useCorrectiveActions';
import { 
  CalendarIcon, 
  UserIcon, 
  CheckIcon, 
  ClockIcon,
  XIcon
} from './icons';

interface CorrectiveActionCardProps {
  action: CorrectiveAction;
  onStatusChange?: (action: CorrectiveAction) => void;
  onEdit?: (action: CorrectiveAction) => void;
  onDelete?: (action: CorrectiveAction) => void;
}

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  [ActionCategory.EQUIPMENT_REPAIR]: '🔧 Réparation matériel',
  [ActionCategory.STAFF_TRAINING]: '👥 Formation',
  [ActionCategory.CLEANING_DISINFECTION]: '🧹 Nettoyage',
  [ActionCategory.PROCESS_IMPROVEMENT]: '📊 Process',
  [ActionCategory.COMPLIANCE_ISSUE]: '⚖️ Conformité',
  [ActionCategory.OTHER]: '📋 Autre'
};

const STATUS_LABELS: Record<ActionStatus, { label: string; color: string }> = {
  [ActionStatus.CREATED]: { label: 'Créée', color: 'bg-gray-100 text-gray-800' },
  [ActionStatus.VALIDATED]: { label: 'Validée', color: 'bg-blue-100 text-blue-800' },
  [ActionStatus.IN_PROGRESS]: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
  [ActionStatus.COMPLETED]: { label: 'Terminée', color: 'bg-green-100 text-green-800' },
  [ActionStatus.VERIFIED]: { label: 'Vérifiée', color: 'bg-purple-100 text-purple-800' },
  [ActionStatus.ARCHIVED]: { label: 'Archivée', color: 'bg-gray-100 text-gray-600' }
};

const PRIORITY_COLORS: Record<ActionPriority, string> = {
  [ActionPriority.LOW]: 'border-l-green-500',
  [ActionPriority.MEDIUM]: 'border-l-yellow-500',
  [ActionPriority.HIGH]: 'border-l-orange-500',
  [ActionPriority.CRITICAL]: 'border-l-red-500'
};

export const CorrectiveActionCard: React.FC<CorrectiveActionCardProps> = ({
  action,
  onStatusChange,
  onEdit,
  onDelete
}) => {
  const isOverdue = new Date(action.due_date) < new Date() && 
    ![ActionStatus.COMPLETED, ActionStatus.VERIFIED, ActionStatus.ARCHIVED].includes(action.status);

  const getDaysRemaining = () => {
    const today = new Date();
    const dueDate = new Date(action.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusButton = () => {
    switch (action.status) {
      case ActionStatus.CREATED:
        return (
          <button
            onClick={() => onStatusChange?.(action)}
            className="text-sm px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Valider
          </button>
        );
      case ActionStatus.VALIDATED:
        return (
          <button
            onClick={() => onStatusChange?.(action)}
            className="text-sm px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Démarrer
          </button>
        );
      case ActionStatus.IN_PROGRESS:
        return (
          <button
            onClick={() => onStatusChange?.(action)}
            className="text-sm px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Terminer
          </button>
        );
      case ActionStatus.COMPLETED:
        return (
          <button
            onClick={() => onStatusChange?.(action)}
            className="text-sm px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Vérifier
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div 
      whileHover={{ 
        y: -4,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      className={`bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow border-l-4 cursor-pointer ${PRIORITY_COLORS[action.priority]}`}
      style={{
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-foreground line-clamp-1">
            {action.title}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">
              {CATEGORY_LABELS[action.category]}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[action.status].color}`}>
              {STATUS_LABELS[action.status].label}
            </span>
          </div>
        </div>
        {getStatusButton()}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {action.description}
      </p>

      {/* Info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {/* Date d'échéance */}
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {format(new Date(action.due_date), 'dd MMM yyyy', { locale: fr })}
            </span>
          </div>

          {/* Jours restants/retard */}
          {!['completed', 'verified', 'archived'].includes(action.status) && (
            <div className="flex items-center gap-1">
              {isOverdue ? (
                <>
                  <XIcon className="w-3 h-3 text-red-600" />
                  <span className="text-red-600 font-medium">
                    {Math.abs(getDaysRemaining())}j de retard
                  </span>
                </>
              ) : (
                <>
                  <ClockIcon className="w-3 h-3" />
                  <span>{getDaysRemaining()}j restants</span>
                </>
              )}
            </div>
          )}

          {/* Assigné à */}
          {action.assigned_user && (
            <div className="flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              <span>{action.assigned_user.name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onEdit && action.status === ActionStatus.CREATED && (
            <button
              onClick={() => onEdit(action)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✏️
            </button>
          )}
          {onDelete && action.status === ActionStatus.CREATED && (
            <button
              onClick={() => onDelete(action)}
              className="text-muted-foreground hover:text-red-600 transition-colors"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Lien avec audit */}
      {action.audit_execution_id && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            📋 Lié à un audit
          </p>
        </div>
      )}
    </motion.div>
  );
};