import { FiX, FiUser, FiCalendar, FiClock, FiCheckCircle, FiAlertTriangle, FiArchive, FiPlay, FiEdit3 } from 'react-icons/fi';
import { HiOfficeBuilding, HiClipboardCheck } from 'react-icons/hi';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface CorrectiveAction {
  id: number;
  action_description: string;
  assigned_to: number;
  due_date: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'verified';
  completion_date?: string;
  completion_notes?: string;
  verification_notes?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  non_conformity?: null; // Supprimé mais gardé pour compatibilité
  assigned_user: {
    id: number;
    email: string;
    name?: string;
  };
  verifier?: {
    id: number;
    email: string;
    name?: string;
  };
}

interface CorrectiveActionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: CorrectiveAction | null;
  onStatusChange?: (actionId: number, newStatus: string, notes?: string) => void;
  onArchive?: (actionId: number) => void;
  onEdit?: (action: CorrectiveAction) => void;
  userRole?: string;
}

export default function CorrectiveActionDetailsModal({
  isOpen,
  onClose,
  action,
  onStatusChange,
  onArchive,
  onEdit,
  userRole = 'viewer'
}: CorrectiveActionDetailsModalProps) {
  if (!isOpen || !action) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { label: 'Assignée', variant: 'secondary' as const, color: 'text-blue-600', icon: '📋' },
      in_progress: { label: 'En cours', variant: 'info' as const, color: 'text-orange-600', icon: '⏳' },
      completed: { label: 'Réalisée', variant: 'success' as const, color: 'text-green-600', icon: '✅' },
      verified: { label: 'Vérifiée', variant: 'success' as const, color: 'text-green-800', icon: '🔍' },
      archived: { label: 'Archivée', variant: 'secondary' as const, color: 'text-gray-600', icon: '📦' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.icon}</span>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { label: 'Faible', variant: 'secondary' as const, color: 'text-yellow-600' },
      medium: { label: 'Moyenne', variant: 'warning' as const, color: 'text-orange-600' },
      high: { label: 'Élevée', variant: 'error' as const, color: 'text-red-600' },
      critical: { label: 'Critique', variant: 'error' as const, color: 'text-red-800' },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.low;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(action.due_date);
  const isOverdue = daysUntilDue < 0 && action.status !== 'completed';

  const canChangeStatus = userRole === 'admin' || userRole === 'manager';
  const canMarkCompleted = canChangeStatus && action.status === 'assigned';
  const canArchive = canChangeStatus && action.status === 'completed';
  const canEdit = canChangeStatus && action.status !== 'completed' && action.status !== 'archived';


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-foreground">
                Détails de l'action corrective
              </h2>
              {getStatusBadge(action.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              ID: #{action.id} • Créée le {new Date(action.created_at).toLocaleDateString('fr-FR')}
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
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Description de l'action */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-2 flex items-center">
              <FiCheckCircle className="w-4 h-4 mr-2" />
              Description de l'action
            </h3>
            <p className="text-foreground whitespace-pre-wrap">{action.action_description}</p>
            {action.notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-1">Notes :</p>
                <p className="text-sm text-foreground">{action.notes}</p>
              </div>
            )}
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assignation et échéances */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground flex items-center">
                <FiUser className="w-4 h-4 mr-2" />
                Assignation et délais
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">Assignée à</p>
                    <p className="text-sm text-muted-foreground">{action.assigned_user.email}</p>
                  </div>
                  <FiUser className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  isOverdue ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-muted/50'
                }`}>
                  <div>
                    <p className="text-sm font-medium text-foreground">Date d'échéance</p>
                    <p className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                      {new Date(action.due_date).toLocaleDateString('fr-FR')}
                    </p>
                    {daysUntilDue >= 0 ? (
                      <p className={`text-xs ${daysUntilDue <= 3 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                        {daysUntilDue === 0 ? 'Aujourd\'hui' : `Dans ${daysUntilDue} jour(s)`}
                      </p>
                    ) : (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        En retard de {Math.abs(daysUntilDue)} jour(s)
                      </p>
                    )}
                  </div>
                  {isOverdue ? (
                    <FiAlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <FiCalendar className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                {action.completion_date && (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">Date de réalisation</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {new Date(action.completion_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Contexte - Section simplifiée */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground flex items-center">
                <FiAlertTriangle className="w-4 h-4 mr-2" />
                Contexte
              </h3>
              
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Action corrective</h4>
                <p className="text-sm text-muted-foreground">
                  Action à réaliser par le franchisé pour corriger un problème identifié.
                </p>
              </div>
            </div>
          </div>

          {/* Notes de réalisation */}
          {action.completion_notes && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
              <h3 className="font-medium text-foreground mb-2 flex items-center">
                <FiCheckCircle className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                Notes de réalisation
              </h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{action.completion_notes}</p>
            </div>
          )}

          {/* Notes de vérification */}
          {action.verification_notes && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <h3 className="font-medium text-foreground mb-2 flex items-center">
                <FiCheckCircle className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                Notes de vérification
              </h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{action.verification_notes}</p>
              {action.verifier && (
                <p className="text-xs text-muted-foreground mt-2">
                  Vérifiée par {action.verifier.email}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FiClock className="w-4 h-4" />
            <span>Dernière mise à jour: {new Date(action.updated_at).toLocaleDateString('fr-FR')}</span>
          </div>

          <div className="flex items-center gap-3">
            {canEdit && (
              <Button 
                onClick={() => onEdit?.(action)}
                variant="outline"
              >
                <FiEdit3 className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}

            
            {canMarkCompleted && (
              <Button 
                onClick={() => onStatusChange?.(action.id, 'completed')}
                className="bg-green-600 hover:bg-green-700"
              >
                <FiCheckCircle className="w-4 h-4 mr-2" />
                Marquer réalisée
              </Button>
            )}
            

            {canArchive && (
              <Button 
                onClick={() => onArchive?.(action.id)}
                variant="outline"
                className="text-gray-600 hover:text-gray-800"
              >
                <FiArchive className="w-4 h-4 mr-2" />
                Archiver
              </Button>
            )}
            
            <Button onClick={onClose} variant="outline">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}