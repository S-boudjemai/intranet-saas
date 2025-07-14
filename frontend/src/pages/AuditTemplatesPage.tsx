import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { AuditTemplate } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import CreateTemplateModal from '../components/modals/CreateTemplateModal';
import EditTemplateModal from '../components/modals/EditTemplateModal';
import AuditTemplateDetailsModal from '../components/modals/AuditTemplateDetailsModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { HiPlus, HiPencil, HiTrash, HiEye, HiClipboardList } from 'react-icons/hi';

export default function AuditTemplatesPage() {
  const { token, user } = useAuth();
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
      console.error('Erreur lors du chargement des templates:', error);
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
        await fetchTemplates(); // Recharger la liste
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

  const handleCreateTemplate = async (templateData: any) => {
    try {
      console.log('🚀 Frontend - Sending template data:', JSON.stringify(templateData, null, 2));
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audit-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        await fetchTemplates(); // Recharger la liste
        showToast('success', 'Template créé', 'Le nouveau template d\'audit a été créé avec succès.');
      } else {
        const errorData = await response.text();
        showToast('error', 'Erreur de création', 'Impossible de créer le template. Vérifiez les données saisies.');
        console.error('❌ Erreur lors de la création du template. Status:', response.status);
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      showToast('error', 'Erreur réseau', 'Une erreur est survenue lors de la création.');
    }
  };

  const handleEditTemplateSubmit = async (templateData: any) => {
    try {
      console.log('🚀 Frontend - Sending edited template data:', JSON.stringify(templateData, null, 2));
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audit-templates/${templateData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        await fetchTemplates(); // Recharger la liste
        showToast('success', 'Template modifié', 'Le template d\'audit a été modifié avec succès.');
        setTemplateToEdit(null);
        setShowEditModal(false);
      } else {
        const errorData = await response.text();
        showToast('error', 'Erreur de modification', 'Impossible de modifier le template. Vérifiez les données saisies.');
        console.error('❌ Erreur lors de la modification du template. Status:', response.status);
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      showToast('error', 'Erreur réseau', 'Une erreur est survenue lors de la modification.');
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates d'Audit</h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez vos modèles d'audit personnalisés
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <HiPlus className="w-4 h-4 mr-2" />
          Nouveau Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
              <HiClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
              <p className="text-2xl font-bold text-foreground">{templates.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
              <span className="text-2xl">🧼</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Hygiène</p>
              <p className="text-2xl font-bold text-foreground">
                {templates.filter(t => t.category.toLowerCase() === 'hygiene').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
              <span className="text-2xl">🔒</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Sécurité</p>
              <p className="text-2xl font-bold text-foreground">
                {templates.filter(t => t.category.toLowerCase() === 'security').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <HiClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucun template d'audit
          </h3>
          <p className="text-muted-foreground mb-4">
            Commencez par créer votre premier template d'audit pour planifier des inspections.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <HiPlus className="w-4 h-4 mr-2" />
            Créer un Template
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getCategoryIcon(template.category)}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </span>
                  </div>
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>{template.items.length} questions</span>
                <span>Créé le {new Date(template.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewTemplate(template)}
                >
                  <HiEye className="w-4 h-4 mr-1" />
                  Voir
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                >
                  <HiPencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteTemplate(template)}
                >
                  <HiTrash className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTemplate}
        restaurantType={(user as any)?.tenant?.restaurant_type || 'traditionnel'}
      />

      {/* Modal de détails */}
      <AuditTemplateDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        template={selectedTemplate}
        onEdit={handleEditTemplate}
        onDelete={(templateId) => {
          const template = templates.find(t => t.id === templateId);
          if (template) handleDeleteTemplate(template);
        }}
        userRole={user?.role}
      />

      {/* Modal d'édition */}
      <EditTemplateModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setTemplateToEdit(null);
        }}
        onSubmit={handleEditTemplateSubmit}
        template={templateToEdit}
      />

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTemplateToDelete(null);
        }}
        onConfirm={confirmDeleteTemplate}
        title="Supprimer le template"
      >
        {templateToDelete && (
          <>
            Êtes-vous sûr de vouloir supprimer le template <strong>"{templateToDelete.name}"</strong> ?
            <br /><br />
            Cette action supprimera définitivement le template et toutes ses {templateToDelete.items.length} questions.
            Cette action est irréversible.
          </>
        )}
      </ConfirmModal>

      {/* Toast de notification */}
      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
        type={toast.type}
        title={toast.title}
        message={toast.message}
      />
    </div>
  );
}