// src/pages/AuditsPage.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentReportIcon,
  PlusIcon,
  CalendarIcon,
  ClipboardIcon,
  ArchiveIcon
} from '../components/icons';
import { useAuditTemplates } from '../hooks/useAuditTemplates';
import { useAuditExecutions } from '../hooks/useAuditExecutions';
import { AuditTemplateWithItems } from '../services/auditTemplatesService';
import { AuditExecutionWithTemplate } from '../services/auditExecutionsService';
import { CreateAuditTemplateDto, AuditTemplate } from '../types';
import CreateTemplateModal from '../components/modals/CreateTemplateModal';
import ScheduleAuditModal from '../components/modals/ScheduleAuditModal';
import AuditDetailsModal from '../components/modals/AuditDetailsModal';
import ExecuteAuditModal from '../components/modals/ExecuteAuditModal';
import CreateCorrectiveActionModal from '../components/modals/CreateCorrectiveActionModal';
import { CorrectiveActionCard } from '../components/CorrectiveActionCard';
import { 
  useCorrectiveActions, 
  CorrectiveAction, 
  CreateCorrectiveActionDto, 
  ActionStatus, 
  ActionPriority 
} from '../hooks/useCorrectiveActions';
import toast from 'react-hot-toast';

// Tabs pour organiser les 4 modules
const TABS = [
  { id: 'templates', label: 'Templates', icon: DocumentReportIcon },
  { id: 'executions', label: 'Planification & Exécution', icon: CalendarIcon },
  { id: 'history', label: 'Historique', icon: ArchiveIcon },
  { id: 'actions', label: 'Actions Correctives', icon: ClipboardIcon },
];

const AuditsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplateForSchedule, setSelectedTemplateForSchedule] = useState<AuditTemplate | undefined>();
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedAuditForDetails, setSelectedAuditForDetails] = useState<AuditExecutionWithTemplate | undefined>();
  const [isAuditDetailsModalOpen, setIsAuditDetailsModalOpen] = useState(false);
  const [selectedAuditForExecution, setSelectedAuditForExecution] = useState<AuditExecutionWithTemplate | undefined>();
  const [isExecuteAuditModalOpen, setIsExecuteAuditModalOpen] = useState(false);
  
  // Hooks au niveau page pour partager les données
  const auditTemplatesHook = useAuditTemplates();
  const auditExecutionsHook = useAuditExecutions();

  const handleScheduleAudit = (template: AuditTemplate) => {
    setSelectedTemplateForSchedule(template);
    setIsScheduleModalOpen(true);
    setActiveTab('executions'); // Passer automatiquement à l'onglet exécution
  };

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setSelectedTemplateForSchedule(undefined);
  };

  const handleViewAudit = (audit: AuditExecutionWithTemplate) => {
    setSelectedAuditForDetails(audit);
    setIsAuditDetailsModalOpen(true);
  };

  const handleCloseAuditDetailsModal = () => {
    setIsAuditDetailsModalOpen(false);
    setSelectedAuditForDetails(undefined);
  };

  const handleStartAudit = async (auditId: string) => {
    const success = await auditExecutionsHook.startExecution(auditId);
    if (success) {
      // Fermer la modal de détails
      setIsAuditDetailsModalOpen(false);
      
      // Récupérer l'audit complet avec toutes les relations
      const fullAudit = await auditExecutionsHook.getExecutionById(auditId);
      if (fullAudit) {
        setSelectedAuditForExecution(fullAudit);
        setIsExecuteAuditModalOpen(true);
      } else {
        toast.error('Impossible de récupérer les détails de l\'audit');
      }
    }
  };

  const handleCompleteAudit = async (auditId: string, summary?: any) => {
    const success = await auditExecutionsHook.completeExecution(auditId, summary);
    if (success) {
      setIsAuditDetailsModalOpen(false);
      setIsExecuteAuditModalOpen(false);
    }
  };

  const handleSaveResponse = async (executionId: string, itemId: string, response: any) => {
    // Ajouter le template_item_id à la réponse
    const responseWithItemId = {
      ...response,
      template_item_id: itemId
    };
    return await auditExecutionsHook.saveResponses(executionId, [responseWithItemId]);
  };

  const handleCloseExecuteModal = () => {
    setIsExecuteAuditModalOpen(false);
    setSelectedAuditForExecution(undefined);
  };


  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl">
              <ClipboardIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Système d'Audits
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gestion complète des audits : templates, planification et actions correctives
          </p>
        </motion.div>

        {/* Navigation tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {TABS.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                      }
                    `}
                  >
                    <IconComponent className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Content based on active tab */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'templates' && <TemplatesModule onScheduleAudit={handleScheduleAudit} auditTemplatesHook={auditTemplatesHook} />}
          {activeTab === 'executions' && (
            <ExecutionsModule 
              onScheduleAudit={() => setIsScheduleModalOpen(true)}
              selectedTemplate={selectedTemplateForSchedule}
              auditExecutionsHook={auditExecutionsHook}
              onViewAudit={handleViewAudit}
              onExecuteAudit={(audit) => {
                setSelectedAuditForExecution(audit);
                setIsExecuteAuditModalOpen(true);
              }}
            />
          )}
          {activeTab === 'history' && (
            <HistoryModule 
              auditExecutionsHook={auditExecutionsHook}
              onViewAudit={handleViewAudit}
            />
          )}
          {activeTab === 'actions' && <ActionsModule />}
        </motion.div>

        {/* Modal de planification d'audit */}
        <ScheduleAuditModal
          isOpen={isScheduleModalOpen}
          onClose={handleCloseScheduleModal}
          onSubmit={auditExecutionsHook.createExecution}
          selectedTemplate={selectedTemplateForSchedule}
          availableTemplates={auditTemplatesHook.templates}
        />

        {/* Modal de détails d'audit */}
        <AuditDetailsModal
          isOpen={isAuditDetailsModalOpen}
          onClose={handleCloseAuditDetailsModal}
          audit={selectedAuditForDetails}
          onStartAudit={handleStartAudit}
          onCompleteAudit={handleCompleteAudit}
        />

        {/* Modal d'exécution d'audit */}
        <ExecuteAuditModal
          isOpen={isExecuteAuditModalOpen}
          onClose={handleCloseExecuteModal}
          audit={selectedAuditForExecution}
          onSaveResponse={handleSaveResponse}
          onCompleteAudit={handleCompleteAudit}
        />
      </div>
    </div>
  );
};

// Module 1: Templates
interface TemplatesModuleProps {
  onScheduleAudit: (template: AuditTemplate) => void;
  auditTemplatesHook: ReturnType<typeof useAuditTemplates>;
}

const TemplatesModule: React.FC<TemplatesModuleProps> = ({ onScheduleAudit, auditTemplatesHook }) => {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = auditTemplatesHook;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AuditTemplateWithItems | undefined>();
  const [filterCategory, setFilterCategory] = useState<string>('');

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'hygiene_security': 'Hygiène & Sécurité',
      'customer_service': 'Service Client',
      'process_compliance': 'Conformité Process',
      'equipment_standards': 'Standards Équipement',
      'financial_management': 'Gestion Financière',
      'staff_management': 'Gestion Personnel',
    };
    return categoryMap[category] || category;
  };

  const getFrequencyLabel = (frequency: string) => {
    const frequencyMap: Record<string, string> = {
      'daily': 'Quotidien',
      'weekly': 'Hebdomadaire',
      'monthly': 'Mensuel',
      'quarterly': 'Trimestriel',
      'yearly': 'Annuel',
      'on_demand': 'À la demande',
    };
    return frequencyMap[frequency] || frequency;
  };

  const handleCreateTemplate = async (templateData: CreateAuditTemplateDto) => {
    const success = await createTemplate(templateData);
    if (success) {
      // Forcer le rafraîchissement des templates pour éviter le cache stale en PWA
      await auditTemplatesHook.refetch();
    }
    return success;
  };

  const handleUpdateTemplate = async (templateData: CreateAuditTemplateDto) => {
    if (editingTemplate) {
      const success = await updateTemplate(editingTemplate.id, templateData);
      if (success) {
        // Forcer le rafraîchissement des templates après modification
        await auditTemplatesHook.refetch();
      }
      return success;
    }
    return false;
  };

  const handleDeleteTemplate = async (template: AuditTemplateWithItems) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le template "${template.name}" ?`)) {
      const success = await deleteTemplate(template.id);
      if (success) {
        // Forcer le rafraîchissement des templates après suppression
        await auditTemplatesHook.refetch();
      }
    }
  };

  const filteredTemplates = filterCategory
    ? templates.filter(t => t.category === filterCategory)
    : templates;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Templates d'Audit</h2>
          <p className="text-sm text-muted-foreground">
            {templates.length} template{templates.length !== 1 ? 's' : ''} disponible{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Toutes les catégories</option>
            <option value="hygiene_security">Hygiène & Sécurité</option>
            <option value="customer_service">Service Client</option>
            <option value="process_compliance">Conformité Process</option>
            <option value="equipment_standards">Standards Équipement</option>
            <option value="financial_management">Gestion Financière</option>
            <option value="staff_management">Gestion Personnel</option>
          </select>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Nouveau Template
          </button>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border border-border p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DocumentReportIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">
              {filterCategory ? 'Aucun template dans cette catégorie' : 'Aucun template créé'}
            </p>
            <p className="text-sm">
              {filterCategory ? 'Essayez une autre catégorie ou créez un nouveau template' : 'Cliquez sur "Nouveau Template" pour commencer'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1 line-clamp-2">{template.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="bg-muted px-2 py-1 rounded">
                        {getCategoryLabel(template.category)}
                      </span>
                      <span>•</span>
                      <span>{getFrequencyLabel(template.frequency)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mb-4">
                  <p className="mb-2">
                    <span className="font-medium">{template.items?.length || 0}</span> questions
                    <span className="mx-2">•</span>
                    <span className="font-medium">~{template.estimated_duration}min</span>
                  </p>
                  {template.description && (
                    <p className="line-clamp-2">{template.description}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsCreateModalOpen(true);
                    }}
                    className="flex-1 bg-muted text-muted-foreground text-xs px-3 py-2 rounded hover:bg-muted/80 transition-colors"
                  >
                    Modifier
                  </button>
                  <button 
                    onClick={() => handleDeleteTemplate(template)}
                    className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded hover:bg-red-100 transition-colors"
                  >
                    Supprimer
                  </button>
                  <button 
                    onClick={() => onScheduleAudit(template)}
                    className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded hover:bg-primary/90 transition-colors"
                  >
                    Planifier
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création/modification */}
      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTemplate(undefined);
        }}
        onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        template={editingTemplate}
      />
    </div>
  );
};

// Module 2: Executions
interface ExecutionsModuleProps {
  onScheduleAudit: () => void;
  selectedTemplate?: AuditTemplate;
  auditExecutionsHook: ReturnType<typeof useAuditExecutions>;
  onViewAudit: (audit: AuditExecutionWithTemplate) => void;
  onExecuteAudit: (audit: AuditExecutionWithTemplate) => void;
}

const ExecutionsModule: React.FC<ExecutionsModuleProps> = ({ onScheduleAudit, auditExecutionsHook, onViewAudit, onExecuteAudit }) => {
  const { executions, loading, scheduledExecutions, inProgressExecutions, completedExecutions, overdueExecutions } = auditExecutionsHook;
  
  // Filtrer pour exclure les audits terminés et archivés
  const activeExecutions = executions.filter(ex => 
    ex.status !== 'completed' && ex.status !== 'archived'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">Planification & Exécution</h2>
          <button 
            onClick={onScheduleAudit}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <CalendarIcon className="w-4 h-4" />
            Planifier Audit
          </button>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Chargement des audits...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Planification & Exécution</h2>
          <p className="text-sm text-muted-foreground">
            {activeExecutions.length} audit{activeExecutions.length !== 1 ? 's' : ''} actif{activeExecutions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button 
          onClick={onScheduleAudit}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <CalendarIcon className="w-4 h-4" />
          Planifier Audit
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Planifiés</p>
              <p className="text-2xl font-bold text-foreground">{scheduledExecutions.length}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En cours</p>
              <p className="text-2xl font-bold text-foreground">{inProgressExecutions.length}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En retard</p>
              <p className="text-2xl font-bold text-foreground">{overdueExecutions.length}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
          </div>
        </div>
      </div>
      
      {/* Liste des audits */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground">Audits Actifs</h3>
        </div>
        
        {activeExecutions.length === 0 ? (
          <div className="p-6">
            <p className="text-muted-foreground text-center py-8">
              📅 Aucun audit actif. Planifiez un nouveau template pour commencer !
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {activeExecutions.map((execution) => (
              <motion.div
                key={execution.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${getStatusColor(execution.status)}`}></div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{execution.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>📅 {formatDate(execution.scheduled_date)}</span>
                    {execution.restaurant && (
                      <span>📍 {execution.restaurant.name}</span>
                    )}
                    {execution.template && (
                      <span>📋 {execution.template.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                    execution.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    execution.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {getStatusLabel(execution.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {execution.status === 'in_progress' && (
                      <button 
                        onClick={() => onExecuteAudit(execution)}
                        className="text-blue-600 hover:text-blue-700 text-sm px-3 py-1 rounded hover:bg-blue-50 transition-colors font-medium"
                      >
                        Continuer
                      </button>
                    )}
                    <button 
                      onClick={() => onViewAudit(execution)}
                      className="text-muted-foreground hover:text-foreground text-sm px-3 py-1 rounded hover:bg-muted transition-colors"
                    >
                      Voir
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Module 3: Historique
interface HistoryModuleProps {
  auditExecutionsHook: ReturnType<typeof useAuditExecutions>;
  onViewAudit: (audit: AuditExecutionWithTemplate) => void;
}

const HistoryModule: React.FC<HistoryModuleProps> = ({ auditExecutionsHook, onViewAudit }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date_desc');
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  
  const { executions, loading, completedExecutions } = auditExecutionsHook;

  const getFilteredExecutions = () => {
    let filtered = executions;
    
    // Filtrer par statut
    if (filterStatus === 'completed') {
      filtered = completedExecutions;
    } else if (filterStatus === 'archived') {
      filtered = executions.filter(ex => ex.status === 'archived');
    } else if (filterStatus !== 'all') {
      filtered = executions.filter(ex => ex.status === filterStatus);
    }
    
    // Trier
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime();
        case 'date_asc':
          return new Date(a.completed_at || a.created_at).getTime() - new Date(b.completed_at || b.created_at).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
    
    return sorted;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planifié';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminé';
      case 'overdue': return 'En retard';
      case 'archived': return 'Archivé';
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

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'hygiene_security': 'Hygiène & Sécurité',
      'customer_service': 'Service Client',
      'process_compliance': 'Conformité Process',
      'equipment_standards': 'Standards Équipement',
      'financial_management': 'Gestion Financière',
      'staff_management': 'Gestion Personnel',
    };
    return categoryMap[category] || category;
  };

  // Analytiques simples
  const getAnalytics = () => {
    const completed = completedExecutions;
    const total = executions.length;
    
    // Répartition par catégorie
    const categoryCounts = completed.reduce((acc: Record<string, number>, exec) => {
      const category = exec.template?.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    
    // Performance par restaurant
    const restaurantStats = completed.reduce((acc: Record<string, { total: number; restaurant: string }>, exec) => {
      const restaurantName = exec.restaurant?.name || 'Non spécifié';
      if (!acc[restaurantName]) {
        acc[restaurantName] = { total: 0, restaurant: restaurantName };
      }
      acc[restaurantName].total += 1;
      return acc;
    }, {});
    
    // Taux de complétion global
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    
    return {
      categoryCounts,
      restaurantStats: Object.values(restaurantStats).sort((a, b) => b.total - a.total),
      completionRate,
      averagePerMonth: Math.round(completed.length / Math.max(1, new Date().getMonth() + 1))
    };
  };

  const filteredExecutions = getFilteredExecutions();
  const analytics = getAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-foreground">Historique des Audits</h2>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Chargement de l'historique...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Historique des Audits</h2>
          <p className="text-sm text-muted-foreground">
            {filteredExecutions.length} audit{filteredExecutions.length !== 1 ? 's' : ''} 
            {filterStatus !== 'all' ? ` ${getStatusLabel(filterStatus).toLowerCase()}${filteredExecutions.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
          >
            <option value="all">Tous les statuts</option>
            <option value="completed">Terminés</option>
            <option value="archived">Archivés</option>
            <option value="overdue">En retard</option>
            <option value="in_progress">En cours</option>
            <option value="scheduled">Planifiés</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
          >
            <option value="date_desc">Plus récent</option>
            <option value="date_asc">Plus ancien</option>
            <option value="title_asc">Titre A-Z</option>
            <option value="title_desc">Titre Z-A</option>
          </select>
          
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              showAnalytics 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            📊 Analytics
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Terminés</p>
              <p className="text-2xl font-bold text-green-600">{completedExecutions.length}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Archivés</p>
              <p className="text-2xl font-bold text-gray-600">
                {executions.filter(ex => ex.status === 'archived').length}
              </p>
            </div>
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cette semaine</p>
              <p className="text-2xl font-bold text-blue-600">
                {executions.filter(ex => {
                  const completed = ex.completed_at ? new Date(ex.completed_at) : null;
                  if (!completed) return false;
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return completed >= weekAgo;
                }).length}
              </p>
            </div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ce mois</p>
              <p className="text-2xl font-bold text-purple-600">
                {executions.filter(ex => {
                  const completed = ex.completed_at ? new Date(ex.completed_at) : null;
                  if (!completed) return false;
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return completed >= monthAgo;
                }).length}
              </p>
            </div>
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          </div>
        </div>
      </div>

      {/* Section Analytique */}
      {showAnalytics && completedExecutions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card rounded-lg border border-border p-6"
        >
          <h3 className="font-medium text-foreground mb-4 flex items-center">
            📊 Analyse des Audits Terminés
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Métriques globales */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Métriques Globales</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">{analytics.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Taux de complétion</p>
                </div>
                <div className="bg-muted/20 rounded-lg p-3">
                  <p className="text-2xl font-bold text-blue-600">{analytics.averagePerMonth}</p>
                  <p className="text-xs text-muted-foreground">Audits/mois (moyenne)</p>
                </div>
              </div>
            </div>

            {/* Répartition par catégorie */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Répartition par Catégorie</h4>
              <div className="space-y-2">
                {Object.entries(analytics.categoryCounts)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{getCategoryLabel(category)}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary rounded-full h-2" 
                            style={{ width: `${(count / completedExecutions.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-muted-foreground min-w-[2rem]">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Performance par restaurant */}
            {analytics.restaurantStats.length > 1 && (
              <div className="space-y-4 lg:col-span-2">
                <h4 className="text-sm font-medium text-muted-foreground">Performance par Restaurant</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analytics.restaurantStats.slice(0, 6).map((restaurant) => (
                    <div key={restaurant.restaurant} className="bg-muted/20 rounded-lg p-3">
                      <p className="font-medium text-foreground text-sm truncate" title={restaurant.restaurant}>
                        {restaurant.restaurant}
                      </p>
                      <p className="text-lg font-bold text-primary">{restaurant.total}</p>
                      <p className="text-xs text-muted-foreground">audits terminés</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Liste des audits */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground">Historique Détaillé</h3>
        </div>
        
        {filteredExecutions.length === 0 ? (
          <div className="p-6">
            <p className="text-muted-foreground text-center py-8">
              {filterStatus === 'all' 
                ? '📋 Aucun audit dans l\'historique' 
                : `📋 Aucun audit ${getStatusLabel(filterStatus).toLowerCase()}`}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredExecutions.map((execution) => (
              <motion.div
                key={execution.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <div className={`w-3 h-3 rounded-full ${getStatusColor(execution.status)}`}></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{execution.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        {execution.completed_at ? (
                          <span>✅ Terminé le {formatDate(execution.completed_at)}</span>
                        ) : (
                          <span>📅 Planifié le {formatDate(execution.scheduled_date)}</span>
                        )}
                        {execution.restaurant && (
                          <span>📍 {execution.restaurant.name}</span>
                        )}
                        {execution.template && (
                          <span className="bg-muted px-2 py-0.5 rounded text-xs">
                            {getCategoryLabel(execution.template.category)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        execution.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                        execution.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                        execution.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                        execution.status === 'archived' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      }`}>
                        {getStatusLabel(execution.status)}
                      </div>
                      <button 
                        onClick={() => onViewAudit(execution)}
                        className="text-muted-foreground hover:text-foreground text-sm px-3 py-1 rounded hover:bg-muted transition-colors"
                      >
                        Voir les réponses
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Module 4: Actions
const ActionsModule: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | undefined>();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  
  const {
    actions,
    loading,
    createAction,
    updateAction,
    deleteAction,
    validateAction,
    completeAction,
    verifyAction
  } = useCorrectiveActions();

  const handleCreateAction = async (data: CreateCorrectiveActionDto) => {
    await createAction(data);
    setIsCreateModalOpen(false);
  };

  const handleStatusChange = async (action: CorrectiveAction) => {
    try {
      switch (action.status) {
        case ActionStatus.CREATED:
          await validateAction(action.id);
          break;
        case ActionStatus.VALIDATED:
          await updateAction(action.id, { status: ActionStatus.IN_PROGRESS });
          break;
        case ActionStatus.IN_PROGRESS:
          // On pourrait ouvrir un modal pour les notes de complétion
          await completeAction(action.id, 'Action terminée');
          break;
        case ActionStatus.COMPLETED:
          await verifyAction(action.id);
          break;
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const handleDeleteAction = async (action: CorrectiveAction) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
      try {
        await deleteAction(action.id);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  // Filtrer les actions
  const filteredActions = actions.filter(action => {
    if (filterStatus !== 'all' && action.status !== filterStatus) return false;
    if (filterPriority !== 'all' && action.priority !== filterPriority) return false;
    return true;
  });

  // Grouper par statut
  const actionsByStatus = filteredActions.reduce((acc, action) => {
    if (!acc[action.status]) acc[action.status] = [];
    acc[action.status].push(action);
    return acc;
  }, {} as Record<string, CorrectiveAction[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Actions Correctives</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Nouvelle Action
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-4 items-center">
        <div>
          <label className="text-sm text-muted-foreground mr-2">Statut:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="all">Tous</option>
            <option value={ActionStatus.CREATED}>Créées</option>
            <option value={ActionStatus.VALIDATED}>Validées</option>
            <option value={ActionStatus.IN_PROGRESS}>En cours</option>
            <option value={ActionStatus.COMPLETED}>Terminées</option>
            <option value={ActionStatus.VERIFIED}>Vérifiées</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mr-2">Priorité:</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="all">Toutes</option>
            <option value={ActionPriority.LOW}>Faible</option>
            <option value={ActionPriority.MEDIUM}>Moyenne</option>
            <option value={ActionPriority.HIGH}>Haute</option>
            <option value={ActionPriority.CRITICAL}>Critique</option>
          </select>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total</h3>
          <p className="text-2xl font-bold text-foreground">{actions.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">En cours</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {actions.filter(a => a.status === ActionStatus.IN_PROGRESS).length}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">En retard</h3>
          <p className="text-2xl font-bold text-red-600">
            {actions.filter(a => 
              new Date(a.due_date) < new Date() && 
              ![ActionStatus.COMPLETED, ActionStatus.VERIFIED].includes(a.status)
            ).length}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Complétées</h3>
          <p className="text-2xl font-bold text-green-600">
            {actions.filter(a => [ActionStatus.COMPLETED, ActionStatus.VERIFIED].includes(a.status)).length}
          </p>
        </div>
      </div>

      {/* Liste des actions */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Chargement des actions...</p>
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">
              {filterStatus !== 'all' || filterPriority !== 'all' 
                ? 'Aucune action ne correspond aux filtres sélectionnés.'
                : 'Aucune action corrective créée pour le moment.'
              }
            </p>
            {filterStatus === 'all' && filterPriority === 'all' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 text-primary hover:underline"
              >
                Créer votre première action
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActions.map((action) => (
              <CorrectiveActionCard
                key={action.id}
                action={action}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de création */}
      <CreateCorrectiveActionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAction}
      />
    </div>
  );
};

export default AuditsPage;