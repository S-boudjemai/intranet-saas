import { FiX, FiUser, FiCalendar, FiClock, FiInfo, FiCheckCircle, FiHelpCircle } from 'react-icons/fi';
import { HiClipboardList, HiStar } from 'react-icons/hi';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface AuditItem {
  id: number;
  question: string;
  type: 'yes_no' | 'score' | 'text' | 'photo';
  is_required: boolean;
  order: number;
  max_score?: number;
  help_text?: string;
}

interface AuditTemplate {
  id: number;
  name: string;
  description?: string;
  category: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  estimated_duration?: number;
  last_used?: string;
  items: AuditItem[];
  creator?: {
    id: number;
    email: string;
  };
}

interface AuditTemplateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: AuditTemplate | null;
  onEdit?: (template: AuditTemplate) => void;
  onDelete?: (templateId: number) => void;
  userRole?: string;
}

export default function AuditTemplateDetailsModal({
  isOpen,
  onClose,
  template,
  onEdit,
  onDelete,
  userRole = 'viewer'
}: AuditTemplateDetailsModalProps) {
  if (!isOpen || !template) return null;

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hygiene':
        return '🧼';
      case 'security':
        return '🔒';
      case 'quality':
        return '✨';
      default:
        return '📋';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'hygiene':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'security':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'quality':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'yes_no':
        return '✅';
      case 'score':
        return '⭐';
      case 'text':
        return '📝';
      case 'photo':
        return '📸';
      default:
        return '❓';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'yes_no':
        return 'Oui/Non';
      case 'score':
        return 'Score';
      case 'text':
        return 'Texte libre';
      case 'photo':
        return 'Photo';
      default:
        return 'Inconnu';
    }
  };

  const getTypeBadge = (type: string) => {
    const config = {
      yes_no: { variant: 'success' as const, label: 'Oui/Non' },
      score: { variant: 'info' as const, label: 'Score' },
      text: { variant: 'secondary' as const, label: 'Texte' },
      photo: { variant: 'warning' as const, label: 'Photo' },
    };

    const typeConfig = config[type as keyof typeof config] || config.text;
    return <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>;
  };

  const sortedItems = [...template.items].sort((a, b) => a.order - b.order);
  const requiredItems = template.items.filter(item => item.is_required);
  const optionalItems = template.items.filter(item => !item.is_required);
  const scoreItems = template.items.filter(item => item.type === 'score');
  const maxPossibleScore = scoreItems.reduce((sum, item) => sum + (item.max_score || 0), 0);

  const canEdit = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getCategoryIcon(template.category)}</span>
              <h2 className="text-xl font-semibold text-foreground">
                {template.name}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                {template.category}
              </span>
              {!template.is_active && (
                <Badge variant="error">Inactif</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              ID: #{template.id} • Créé le {new Date(template.created_at).toLocaleDateString('fr-FR')}
              {template.creator && ` par ${template.creator.email}`}
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
          {/* Description */}
          {template.description && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-medium text-foreground mb-2 flex items-center">
                <FiInfo className="w-4 h-4 mr-2" />
                Description
              </h3>
              <p className="text-foreground whitespace-pre-wrap">{template.description}</p>
            </div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center">
                <HiClipboardList className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold text-foreground">{template.items.length}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <FiCheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Obligatoires</p>
                  <p className="text-2xl font-bold text-foreground">{requiredItems.length}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center">
                <HiStar className="w-6 h-6 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Score max</p>
                  <p className="text-2xl font-bold text-foreground">{maxPossibleScore}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center">
                <FiClock className="w-6 h-6 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Durée estimée</p>
                  <p className="text-2xl font-bold text-foreground">
                    {template.estimated_duration || 30}min
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dernière utilisation */}
          {template.last_used && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <FiCalendar className="w-4 h-4 inline mr-1" />
                Dernière utilisation: {new Date(template.last_used).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}

          {/* Liste des questions */}
          <div>
            <h3 className="font-medium text-foreground mb-4 flex items-center">
              <HiClipboardList className="w-4 h-4 mr-2" />
              Questions de l'audit ({template.items.length})
            </h3>
            
            <div className="space-y-3">
              {sortedItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg border-l-4 ${
                    item.is_required 
                      ? 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10' 
                      : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-muted-foreground bg-background px-2 py-1 rounded">
                          #{item.order}
                        </span>
                        <span className="text-lg">{getTypeIcon(item.type)}</span>
                        {getTypeBadge(item.type)}
                        {item.is_required && (
                          <Badge variant="error" size="sm">Obligatoire</Badge>
                        )}
                        {item.type === 'score' && item.max_score && (
                          <Badge variant="info" size="sm">{item.max_score} pts max</Badge>
                        )}
                      </div>
                      
                      <p className="text-foreground font-medium mb-2">{item.question}</p>
                      
                      {item.help_text && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <FiHelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <p>{item.help_text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Résumé par type */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['yes_no', 'score', 'text', 'photo'].map(type => {
              const count = template.items.filter(item => item.type === type).length;
              if (count === 0) return null;
              
              return (
                <div key={type} className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl mb-1">{getTypeIcon(type)}</div>
                  <p className="text-sm font-medium text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{getTypeLabel(type)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-muted">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FiInfo className="w-4 h-4" />
            <span>
              {template.is_active ? 'Template actif' : 'Template inactif'} • 
              {requiredItems.length} questions obligatoires sur {template.items.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {canEdit && (
              <>
                <Button 
                  onClick={() => onEdit?.(template)}
                  variant="outline"
                >
                  <FiInfo className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                
                <Button 
                  onClick={() => onDelete?.(template.id)}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                >
                  Supprimer
                </Button>
              </>
            )}
            
            <Button onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}