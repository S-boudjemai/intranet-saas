import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { NonConformity, CorrectiveAction } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import CreateCorrectiveActionModal from '../components/modals/CreateCorrectiveActionModal';
import CorrectiveActionDetailsModal from '../components/modals/CorrectiveActionDetailsModal';
import Toast from '../components/Toast';
import { 
  HiExclamationCircle, 
  HiCheckCircle, 
  HiClock, 
  HiUser, 
  HiCalendar,
  HiOfficeBuilding,
  HiClipboardCheck,
  HiPlusCircle,
  HiEye,
  HiFilter
} from 'react-icons/hi';

export default function CorrectiveActionsPage() {
  const { token, user } = useAuth();
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'non-conformities' | 'actions'>('non-conformities');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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
      const [ncResponse, actionsResponse, usersResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/non-conformities`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/corrective-actions`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/users`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (ncResponse.ok) {
        const ncData = await ncResponse.json();
        setNonConformities(ncData.data || ncData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data || usersData);
      }

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        setCorrectiveActions(actionsData.data || actionsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAction = (action: CorrectiveAction) => {
    setSelectedAction(action);
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
        await fetchData(); // Recharger la liste
        setShowDetailsModal(false); // Fermer le modal
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
      console.log('🚀 FRONTEND - Sending corrective action data:', JSON.stringify(actionData, null, 2));
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/corrective-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(actionData),
      });

      if (response.ok) {
        await fetchData(); // Recharger la liste
        showToast('success', 'Action créée', 'L\'action corrective a été créée avec succès.');
      } else {
        const errorData = await response.text();
        showToast('error', 'Erreur de création', 'Impossible de créer l\'action corrective. Vérifiez les données saisies.');
        console.error('❌ Erreur lors de la création de l\'action corrective. Status:', response.status);
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      showToast('error', 'Erreur réseau', 'Une erreur est survenue lors de la création.');
    }
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Ouverte', variant: 'error' as const },
      in_progress: { label: 'En cours', variant: 'info' as const },
      resolved: { label: 'Résolue', variant: 'success' as const },
      verified: { label: 'Vérifiée', variant: 'success' as const },
      pending: { label: 'En attente', variant: 'secondary' as const },
      completed: { label: 'Terminée', variant: 'success' as const },
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

  const filteredNonConformities = nonConformities.filter(nc => {
    if (statusFilter !== 'all' && nc.status !== statusFilter) return false;
    if (severityFilter !== 'all' && nc.severity !== severityFilter) return false;
    return true;
  });

  const filteredActions = correctiveActions.filter(action => {
    if (statusFilter !== 'all' && action.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    totalNC: nonConformities.length,
    openNC: nonConformities.filter(nc => nc.status === 'open').length,
    criticalNC: nonConformities.filter(nc => nc.severity === 'critical').length,
    overdue: correctiveActions.filter(action => 
      new Date(action.due_date) < new Date() && action.status !== 'completed'
    ).length,
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
          <h1 className="text-3xl font-bold text-foreground">Actions Correctives</h1>
          <p className="text-muted-foreground mt-1">
            Suivi des non-conformités et des actions correctives
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <HiPlusCircle className="w-4 h-4 mr-2" />
          Nouvelle Action
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
              <HiExclamationCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Non-conformités</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalNC}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900">
              <HiClock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Ouvertes</p>
              <p className="text-2xl font-bold text-foreground">{stats.openNC}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
              <HiExclamationCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Critiques</p>
              <p className="text-2xl font-bold text-foreground">{stats.criticalNC}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900">
              <HiCalendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">En retard</p>
              <p className="text-2xl font-bold text-foreground">{stats.overdue}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('non-conformities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'non-conformities'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Non-conformités ({filteredNonConformities.length})
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'actions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Actions correctives ({filteredActions.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <HiFilter className="w-4 h-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1 border border-border rounded-md text-sm bg-background text-foreground"
          >
            <option value="all">Tous les statuts</option>
            <option value="open">Ouvertes</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Résolues</option>
            <option value="verified">Vérifiées</option>
          </select>
        </div>

        {activeTab === 'non-conformities' && (
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1 border border-border rounded-md text-sm bg-background text-foreground"
          >
            <option value="all">Toutes les gravités</option>
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Élevée</option>
            <option value="critical">Critique</option>
          </select>
        )}
      </div>

      {/* Content */}
      {activeTab === 'non-conformities' ? (
        <div className="space-y-4">
          {filteredNonConformities.length === 0 ? (
            <Card className="p-12 text-center">
              <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucune non-conformité
              </h3>
              <p className="text-muted-foreground">
                Excellent ! Toutes les audits sont conformes.
              </p>
            </Card>
          ) : (
            filteredNonConformities.map((nc) => (
              <Card key={nc.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {nc.description}
                      </h3>
                      {getSeverityBadge(nc.severity)}
                      {getStatusBadge(nc.status)}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground gap-4 mb-3">
                      <div className="flex items-center">
                        <HiOfficeBuilding className="w-4 h-4 mr-1" />
                        {nc.audit_execution.restaurant.name}
                      </div>
                      <div className="flex items-center">
                        <HiClipboardCheck className="w-4 h-4 mr-1" />
                        {nc.audit_execution.template.name}
                      </div>
                      <div className="flex items-center">
                        <HiCalendar className="w-4 h-4 mr-1" />
                        {new Date(nc.identified_date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {nc.evidence && (
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>Preuves:</strong> {nc.evidence}
                      </p>
                    )}
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <HiEye className="w-4 h-4 mr-1" />
                    Détails
                  </Button>
                </div>

                {/* Actions correctives associées */}
                {nc.corrective_actions && nc.corrective_actions.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-3">
                      Actions correctives ({nc.corrective_actions.length})
                    </h4>
                    <div className="space-y-2">
                      {nc.corrective_actions.map((action) => (
                        <div key={action.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{action.description}</p>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <HiUser className="w-3 h-3 mr-1" />
                              {action.assigned_to.email}
                              <HiCalendar className="w-3 h-3 ml-3 mr-1" />
                              Échéance: {new Date(action.due_date).toLocaleDateString()}
                            </div>
                          </div>
                          {getActionStatusBadge(action)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActions.length === 0 ? (
            <Card className="p-12 text-center">
              <HiClipboardCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Aucune action corrective
              </h3>
              <p className="text-muted-foreground">
                Les actions correctives apparaîtront ici une fois créées.
              </p>
            </Card>
          ) : (
            filteredActions.map((action) => {
              const daysUntilDue = getDaysUntilDue(action.due_date);
              const isOverdue = daysUntilDue < 0;
              
              return (
                <Card key={action.id} className={`p-6 ${isOverdue ? 'border-l-4 border-red-500' : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {action.description}
                        </h3>
                        {getActionStatusBadge(action)}
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground gap-4 mb-3">
                        <div className="flex items-center">
                          <HiUser className="w-4 h-4 mr-1" />
                          Assignée à: {action.assigned_to.email}
                        </div>
                        <div className="flex items-center">
                          <HiCalendar className="w-4 h-4 mr-1" />
                          Échéance: {new Date(action.due_date).toLocaleDateString()}
                        </div>
                        {daysUntilDue >= 0 && (
                          <div className={`flex items-center ${daysUntilDue <= 3 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                            <HiClock className="w-4 h-4 mr-1" />
                            {daysUntilDue === 0 ? 'Aujourd\'hui' : `${daysUntilDue} jour(s)`}
                          </div>
                        )}
                      </div>
                      
                      {action.verification_notes && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes de vérification:</strong> {action.verification_notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewAction(action)}
                      >
                        <HiEye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      {action.status !== 'completed' && action.status !== 'verified' && (
                        <Button 
                          size="sm"
                          onClick={() => handleStatusChange(action.id, 'completed')}
                        >
                          <HiCheckCircle className="w-4 h-4 mr-1" />
                          Marquer terminée
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Informations sur la non-conformité associée */}
                  {action.non_conformity ? (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-foreground mb-2">Non-conformité associée</h4>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {action.non_conformity.description}
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <HiOfficeBuilding className="w-3 h-3 mr-1" />
                              {action.non_conformity.audit_execution.restaurant.name}
                            </div>
                          </div>
                          {getSeverityBadge(action.non_conformity.severity)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-foreground mb-2">Action corrective générale</h4>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Cette action corrective n'est pas liée à une non-conformité spécifique.
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Modal de création d'action corrective */}
      <CreateCorrectiveActionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAction}
        nonConformities={nonConformities.map(nc => ({
          ...nc,
          title: nc.title || 'Non-conformité',
          audit_name: 'Audit système',
          restaurant_name: 'Restaurant',
          created_date: new Date().toISOString()
        }))}
        users={users}
      />

      {/* Modal de détails d'action corrective */}
      <CorrectiveActionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        action={selectedAction}
        onStatusChange={handleStatusChange}
        userRole={user?.role}
      />

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