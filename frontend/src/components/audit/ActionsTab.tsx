// src/components/audit/ActionsTab.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { CorrectiveAction } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import CreateCorrectiveActionModal from '../modals/CreateCorrectiveActionModal';
import CorrectiveActionDetailsModal from '../modals/CorrectiveActionDetailsModal';
import Toast from '../Toast';
import { 
  HiCheckCircle, 
  HiClock, 
  HiUser, 
  HiCalendar,
  HiClipboardCheck,
  HiPlusCircle,
  HiEye,
  HiFilter
} from 'react-icons/hi';
import { AuditListSkeleton } from '../Skeleton';

export default function ActionsTab() {
  const { token, user } = useAuth();
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingAction, setEditingAction] = useState<CorrectiveAction | null>(null);
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
    fetchData();
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    setToast({ isOpen: true, type, title, message });
  };

  const fetchData = async () => {
    try {
      const [actionsResponse, usersResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/corrective-actions`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/users`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data || usersData);
      }

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        setCorrectiveActions(actionsData.data || actionsData);
      }
    } catch (error) {
      // Error loading corrective actions data
    } finally {
      setLoading(false);
    }
  };

  const handleViewAction = (action: CorrectiveAction) => {
    setSelectedAction(action as any);
    setShowDetailsModal(true);
  };

  const handleStatusChange = async (actionId: number, newStatus: string, notes?: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/corrective-actions/${actionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          completion_notes: notes,
          completion_date: newStatus === 'completed' ? new Date().toISOString() : undefined
        }),
      });

      if (response.ok) {
        await fetchData();
        setShowDetailsModal(false);
        showToast('success', 'Statut mis à jour', 'L\'action corrective a été mise à jour avec succès.');
      } else {
        showToast('error', 'Erreur de mise à jour', 'Impossible de mettre à jour le statut.');
      }
    } catch (error) {
      showToast('error', 'Erreur réseau', 'Une erreur est survenue lors de la mise à jour.');
    }
  };

  const handleCreateAction = async (actionData: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/corrective-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(actionData),
      });

      if (response.ok) {
        await fetchData();
        showToast('success', 'Action créée', 'L\'action corrective a été créée avec succès.');
      } else {
        showToast('error', 'Erreur de création', 'Impossible de créer l\'action corrective. Vérifiez les données saisies.');
      }
    } catch (error) {
      showToast('error', 'Erreur réseau', 'Une erreur est survenue lors de la création.');
    }
  };

  const handleArchiveAction = async (actionId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/corrective-actions/${actionId}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchData(); // Recharger la liste
        setShowDetailsModal(false);
        showToast('success', 'Action archivée', 'L\'action corrective a été archivée avec succès.');
      } else {
        showToast('error', 'Erreur d\'archivage', 'Impossible d\'archiver l\'action corrective.');
      }
    } catch (error) {
      showToast('error', 'Erreur réseau', 'Une erreur est survenue lors de l\'archivage.');
    }
  };

  const handleEditAction = (action: CorrectiveAction) => {
    setEditingAction(action);
    setShowDetailsModal(false);
    setShowEditModal(true);
  };

  const handleUpdateAction = async (actionData: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/corrective-actions/${actionData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(actionData),
      });

      if (response.ok) {
        await fetchData();
        setShowEditModal(false);
        setEditingAction(null);
        showToast('success', 'Action modifiée', 'L\'action corrective a été modifiée avec succès.');
      } else {
        showToast('error', 'Erreur de modification', 'Impossible de modifier l\'action corrective.');
      }
    } catch (error) {
      showToast('error', 'Erreur réseau', 'Une erreur est survenue lors de la modification.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Ouverte', variant: 'error' as const },
      in_progress: { label: 'En cours', variant: 'info' as const },
      resolved: { label: 'Résolue', variant: 'success' as const },
      verified: { label: 'Vérifiée', variant: 'success' as const },
      pending: { label: 'En attente', variant: 'secondary' as const },
      completed: { label: 'Terminée', variant: 'success' as const },
      assigned: { label: 'Assignée', variant: 'info' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getActionStatusBadge = (action: CorrectiveAction) => {
    const isOverdue = new Date(action.due_date) < new Date() && action.status !== 'completed';
    
    if (isOverdue) {
      return <Badge variant="error">En retard</Badge>;
    }
    
    return getStatusBadge(action.status);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredActions = correctiveActions.filter(action => {
    if (statusFilter !== 'all' && action.status !== statusFilter) return false;
    return true;
  });

  // Stats calculations
  const actionStats = {
    total: correctiveActions.length,
    pending: correctiveActions.filter(a => a.status === 'assigned' || a.status === 'in_progress').length,
    overdue: correctiveActions.filter(a => 
      new Date(a.due_date) < new Date() && 
      (a.status === 'assigned' || a.status === 'in_progress')
    ).length,
    completed: correctiveActions.filter(a => a.status === 'completed').length,
  };

  if (loading) {
    return <AuditListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Actions Correctives</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez et suivez les actions correctives issues des audits
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <HiPlusCircle className="w-4 h-4 mr-2" />
          Nouvelle Action
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
              <HiClock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Actions en retard</p>
              <p className="text-2xl font-bold text-foreground">{actionStats.overdue}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
              <HiClipboardCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Actions en cours</p>
              <p className="text-2xl font-bold text-foreground">{actionStats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
              <HiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Actions terminées</p>
              <p className="text-2xl font-bold text-foreground">{actionStats.completed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions Correctives */}
      <Card>
        <div className="p-6">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex items-center gap-2">
              <HiFilter className="w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 text-sm border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">Tous les statuts</option>
                <option value="assigned">Assignée</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminé</option>
                <option value="pending">En attente</option>
              </select>
            </div>
          </div>

          {/* Actions List */}
          <div className="space-y-4">
            {filteredActions.length === 0 ? (
              <Card className="text-center py-12">
                <HiClipboardCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Aucune action corrective
                </h3>
                <p className="text-muted-foreground mb-4">
                  Commencez par créer votre première action corrective.
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <HiPlusCircle className="w-4 h-4 mr-2" />
                  Créer une action
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActions.map((action) => {
                  const daysUntilDue = getDaysUntilDue(action.due_date);
                  return (
                    <Card key={action.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground line-clamp-2">
                            {action.action_description || action.description}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Action corrective générale
                          </p>
                        </div>
                        {getActionStatusBadge(action)}
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <HiUser className="w-4 h-4 mr-1" />
                          {action.assigned_user?.email || action.assigned_to?.email || 'Non assigné'}
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <HiCalendar className="w-4 h-4 mr-1" />
                          Échéance: {new Date(action.due_date).toLocaleDateString()}
                          {daysUntilDue < 0 && (
                            <span className="ml-2 text-red-600 font-medium">
                              ({Math.abs(daysUntilDue)} jours de retard)
                            </span>
                          )}
                          {daysUntilDue >= 0 && daysUntilDue <= 3 && (
                            <span className="ml-2 text-orange-600 font-medium">
                              ({daysUntilDue} jours restants)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleViewAction(action)}
                      >
                        <HiEye className="w-4 h-4 mr-2" />
                        Voir détails
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Modals */}
      <CreateCorrectiveActionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAction}
        nonConformities={[]}
        users={users}
      />

      {editingAction && (
        <CreateCorrectiveActionModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingAction(null);
          }}
          onSubmit={handleUpdateAction}
          nonConformities={[]}
          users={users}
          editAction={editingAction}
          isEditMode={true}
        />
      )}

      {selectedAction && (
        <CorrectiveActionDetailsModal
          action={selectedAction}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAction(null);
          }}
          onStatusChange={handleStatusChange}
          onArchive={handleArchiveAction}
          onEdit={handleEditAction}
          userRole={user?.role}
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