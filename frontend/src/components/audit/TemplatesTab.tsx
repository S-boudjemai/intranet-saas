// src/components/audit/TemplatesTab.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { AuditTemplate } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import CreateTemplateModal from '../modals/CreateTemplateModal';
import EditTemplateModal from '../modals/EditTemplateModal';
import AuditTemplateDetailsModal from '../modals/AuditTemplateDetailsModal';
import ConfirmModal from '../ConfirmModal';
import Toast from '../Toast';
import { HiPlus, HiPencil, HiTrash, HiEye, HiClipboardList } from 'react-icons/hi';

export default function TemplatesTab() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AuditTemplate | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<AuditTemplate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<AuditTemplate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    setToast({ isOpen: true, type, title, message });
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audit-templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || data);
      }
    } catch (error) {
      // Templates loading error
    } finally {
      setLoading(false);
    }
  };

  const handleViewTemplate = (template: AuditTemplate) => {
    setSelectedTemplate(template);
    setShowDetailsModal(true);
  };

  const handleEditTemplate = (template: AuditTemplate) => {
    setTemplateToEdit(template);
    setShowEditModal(true);
    setShowDetailsModal(false);
  };

  const handleDeleteTemplate = (template: AuditTemplate) => {
    setTemplateToDelete(template);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audit-templates/${templateToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchTemplates();
        setShowDetailsModal(false);
        showToast('success', 'Template supprimé', `Le template "${templateToDelete.name}" a été supprimé avec succès.`);
      } else {
        showToast('error', 'Erreur de suppression', 'Impossible de supprimer le template. Veuillez réessayer.');
      }
    } catch (error) {
      showToast('error', 'Erreur réseau', 'Une erreur est survenue lors de la suppression.');
    } finally {
      setTemplateToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleTemplateCreated = () => {
    setShowCreateModal(false);
    fetchTemplates();
    showToast('success', 'Template créé', 'Le nouveau template d\'audit a été créé avec succès.');
  };

  const handleTemplateUpdated = () => {
    setShowEditModal(false);
    setTemplateToEdit(null);
    fetchTemplates();
    showToast('success', 'Template mis à jour', 'Le template a été modifié avec succès.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Chargement des templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Templates d'Audit</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Créez et gérez vos modèles d'audit personnalisés
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <HiPlus className="h-4 w-4" />
          Nouveau Template
        </Button>
      </div>

      {/* Templates grid */}
      {templates.length === 0 ? (
        <Card className="text-center py-12">
          <HiClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucun template d'audit</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par créer votre premier template d'audit pour standardiser vos évaluations.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <HiPlus className="h-4 w-4 mr-2" />
            Créer un template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="relative group hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.category}
                    </p>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleViewTemplate(template)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                      title="Voir les détails"
                    >
                      <HiEye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                      title="Modifier"
                    >
                      <HiPencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Supprimer"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{template.items?.length || 0} questions</span>
                  <span className={`px-2 py-1 rounded-full ${
                    template.is_active 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {template.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateTemplateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTemplateCreated}
        />
      )}

      {showEditModal && templateToEdit && (
        <EditTemplateModal
          isOpen={showEditModal}
          template={templateToEdit}
          onClose={() => {
            setShowEditModal(false);
            setTemplateToEdit(null);
          }}
          onEdit={handleTemplateUpdated}
        />
      )}

      {showDetailsModal && selectedTemplate && (
        <AuditTemplateDetailsModal
          template={selectedTemplate}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTemplate(null);
          }}
          onEdit={handleEditTemplate}
          onDelete={(templateId: number) => handleDeleteTemplate(templateId)}
        />
      )}

      {showDeleteConfirm && templateToDelete && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setTemplateToDelete(null);
          }}
          onConfirm={confirmDeleteTemplate}
          title="Supprimer le template"
          description={`Êtes-vous sûr de vouloir supprimer le template "${templateToDelete.name}" ? Cette action est irréversible.`}
          confirmText="Supprimer"
          variant="destructive"
        />
      )}

      {toast.isOpen && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          isOpen={toast.isOpen}
          onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}