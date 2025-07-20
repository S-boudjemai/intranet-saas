// src/components/audit/PlanningTab.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { AuditExecution, AuditTemplate, RestaurantInfo } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ScheduleAuditModal from '../modals/ScheduleAuditModal';
import ConfirmModal from '../ConfirmModal';
import { HiPlus, HiCalendar, HiClock, HiUser, HiOfficeBuilding } from 'react-icons/hi';
import { ArchiveIcon } from '../icons';

export default function PlanningTab() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<AuditExecution[]>([]);
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [auditToArchive, setAuditToArchive] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [executionsRes, templatesRes, restaurantsRes, inspectorsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/audits`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/audit-templates`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/restaurants`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/users`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (executionsRes.ok) {
        const data = await executionsRes.json();
        setExecutions(data.data || data);
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.data || data);
      }

      if (restaurantsRes.ok) {
        const data = await restaurantsRes.json();
        setRestaurants(data.data || data);
      }

      if (inspectorsRes.ok) {
        const data = await inspectorsRes.json();
        // Filtrer pour garder seulement les managers et admins
        const filteredInspectors = (data.data || data).filter((u: any) => 
          u.role === 'admin' || u.role === 'manager'
        ).map((u: any) => ({
          ...u,
          available: true // Simplification pour la démo
        }));
        setInspectors(filteredInspectors);
      }
    } catch (error) {
      // Error loading audit data
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAudit = async (auditData: any) => {
    try {
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(auditData),
      });

      if (response.ok) {
        await fetchData(); // Recharger la liste
      } else {
        const errorData = await response.text();
        // Error during audit scheduling
      }
    } catch (error) {
      // Audit planning error
    }
  };

  const handleArchiveClick = (execution: any) => {
    setAuditToArchive(execution);
    setShowArchiveModal(true);
  };

  const handleArchiveConfirm = async () => {
    if (!auditToArchive) return;

    setArchivingId(auditToArchive.id);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audit-archives/archive/${auditToArchive.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchData(); // Recharger la liste
      } else {
        const errorData = await response.text();
        // Error during archiving
      }
    } catch (error) {
      // Archiving error
    } finally {
      setArchivingId(null);
      setShowArchiveModal(false);
      setAuditToArchive(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      todo: { label: 'À faire', variant: 'warning' as const },
      scheduled: { label: 'Planifié', variant: 'info' as const },
      in_progress: { label: 'En cours', variant: 'secondary' as const },
      completed: { label: 'Terminé', variant: 'success' as const },
      reviewed: { label: 'Validé', variant: 'success' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.todo;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Fonction pour générer le bon bouton selon le statut
  const getActionButton = (execution: any) => {
    const isToday = new Date().toDateString() === new Date(execution.scheduled_date).toDateString();
    const isPast = new Date(execution.scheduled_date) < new Date();
    
    // Audit à faire ou en retard
    if (execution.status === 'todo' || isPast) {
      return (
        <Button 
          variant="default" 
          size="sm" 
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          onClick={() => navigate(`/audit/${execution.id}`)}
        >
          🚀 Commencer l'audit
        </Button>
      );
    }
    
    // Audit planifié dans le futur
    if (execution.status === 'scheduled') {
      return (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => navigate(`/audit/${execution.id}`)}
        >
          👁️ Voir l'audit
        </Button>
      );
    }
    
    // Audit en cours, terminé, validé
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full"
        onClick={() => navigate(`/audit/${execution.id}`)}
      >
        📋 Voir détails
      </Button>
    );
  };

  const StatusBadgeWithArchive = ({ status, execution, canArchive }: { 
    status: string; 
    execution: any; 
    canArchive: boolean; 
  }) => {
    const isCompleted = status === 'completed' || status === 'reviewed';

    return (
      <div className="flex items-center gap-2">
        {getStatusBadge(status)}
        
        {isCompleted && canArchive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleArchiveClick(execution);
            }}
            disabled={archivingId === execution.id}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 rounded border border-orange-200 transition-colors duration-150"
          >
            {archivingId === execution.id ? (
              <div className="w-3 h-3 border border-orange-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArchiveIcon className="w-3 h-3" />
            )}
            <span>Archiver</span>
          </button>
        )}
      </div>
    );
  };

  const isOverdue = (scheduledDate: string, status: string) => {
    if (status === 'completed' || status === 'reviewed') return false;
    return new Date(scheduledDate) < new Date();
  };

  // Filtrer les audits terminés/validés qui ne doivent plus apparaître dans le planning
  const activeExecutions = executions.filter(e => 
    e.status !== 'completed' && e.status !== 'reviewed'
  );

  const groupedExecutions = {
    today: activeExecutions.filter(e => {
      const today = new Date().toDateString();
      return new Date(e.scheduled_date).toDateString() === today;
    }),
    upcoming: activeExecutions.filter(e => {
      const today = new Date();
      const scheduledDate = new Date(e.scheduled_date);
      return scheduledDate > today && scheduledDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    }),
    future: activeExecutions.filter(e => {
      const today = new Date();
      const scheduledDate = new Date(e.scheduled_date);
      return scheduledDate > new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    }),
    overdue: activeExecutions.filter(e => isOverdue(e.scheduled_date, e.status)),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Chargement du planning...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Planning des Audits</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Planifiez et suivez vos audits de conformité
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <HiPlus className="w-4 h-4 mr-2" />
          Planifier un Audit
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
              <HiCalendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Aujourd'hui</p>
              <p className="text-2xl font-bold text-foreground">{groupedExecutions.today.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900">
              <HiClock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Cette semaine</p>
              <p className="text-2xl font-bold text-foreground">{groupedExecutions.upcoming.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
              <HiUser className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">En retard</p>
              <p className="text-2xl font-bold text-foreground">{groupedExecutions.overdue.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900">
              <HiOfficeBuilding className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Audits actifs</p>
              <p className="text-2xl font-bold text-foreground">{activeExecutions.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* En retard - Section prioritaire */}
      {groupedExecutions.overdue.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
            <HiClock className="w-5 h-5 mr-2" />
            Audits en retard ({groupedExecutions.overdue.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedExecutions.overdue.map((execution) => (
              <Card key={execution.id} className="p-4 border-l-4 border-red-500">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{execution.template.name}</h4>
                    <p className="text-sm text-muted-foreground">{execution.restaurant.name}</p>
                  </div>
                  <StatusBadgeWithArchive 
                    status={execution.status} 
                    execution={execution} 
                    canArchive={user?.role === 'admin' || user?.role === 'manager'} 
                  />
                </div>
                
                <div className="flex items-center text-sm text-red-600 mb-2">
                  <HiCalendar className="w-4 h-4 mr-1" />
                  Prévu le {new Date(execution.scheduled_date).toLocaleDateString()}
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/audit/${execution.id}`)}
                >
                  Commencer l'audit
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Aujourd'hui */}
      {groupedExecutions.today.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <HiCalendar className="w-5 h-5 mr-2" />
            Aujourd'hui ({groupedExecutions.today.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedExecutions.today.map((execution) => (
              <Card key={execution.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{execution.template.name}</h4>
                    <p className="text-sm text-muted-foreground">{execution.restaurant.name}</p>
                  </div>
                  <StatusBadgeWithArchive 
                    status={execution.status} 
                    execution={execution} 
                    canArchive={user?.role === 'admin' || user?.role === 'manager'} 
                  />
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <HiUser className="w-4 h-4 mr-1" />
                  {execution.inspector.email}
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/audit/${execution.id}`)}
                >
                  Voir l'audit
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cette semaine */}
      {groupedExecutions.upcoming.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <HiClock className="w-5 h-5 mr-2" />
            Cette semaine ({groupedExecutions.upcoming.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedExecutions.upcoming.map((execution) => (
              <Card key={execution.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{execution.template.name}</h4>
                    <p className="text-sm text-muted-foreground">{execution.restaurant.name}</p>
                  </div>
                  <StatusBadgeWithArchive 
                    status={execution.status} 
                    execution={execution} 
                    canArchive={user?.role === 'admin' || user?.role === 'manager'} 
                  />
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <HiCalendar className="w-4 h-4 mr-1" />
                  {new Date(execution.scheduled_date).toLocaleDateString()}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <HiUser className="w-4 h-4 mr-1" />
                  {execution.inspector.email}
                </div>
                
                {getActionButton(execution)}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Audits futurs */}
      {groupedExecutions.future.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <HiOfficeBuilding className="w-5 h-5 mr-2" />
            Audits futurs ({groupedExecutions.future.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedExecutions.future.map((execution) => (
              <Card key={execution.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{execution.template.name}</h4>
                    <p className="text-sm text-muted-foreground">{execution.restaurant.name}</p>
                  </div>
                  <StatusBadgeWithArchive 
                    status={execution.status} 
                    execution={execution} 
                    canArchive={user?.role === 'admin' || user?.role === 'manager'} 
                  />
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <HiCalendar className="w-4 h-4 mr-1" />
                  {new Date(execution.scheduled_date).toLocaleDateString()}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <HiUser className="w-4 h-4 mr-1" />
                  {execution.inspector.email}
                </div>
                
                {getActionButton(execution)}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* État vide */}
      {activeExecutions.length === 0 && (
        <Card className="text-center py-12">
          <HiCalendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucun audit planifié
          </h3>
          <p className="text-muted-foreground mb-4">
            Commencez par planifier votre premier audit de conformité.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <HiPlus className="w-4 h-4 mr-2" />
            Planifier un Audit
          </Button>
        </Card>
      )}

      {/* Modal de planification */}
      <ScheduleAuditModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleScheduleAudit}
        templates={templates.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          estimated_duration: t.estimated_duration || 30,
          question_count: t.items?.length || 0,
          last_used: t.last_used
        }))}
        restaurants={restaurants.map(r => ({
          ...r,
          city: (r as any).city || 'Non spécifié'
        }))}
        inspectors={inspectors}
      />

      {/* Modal de confirmation d'archivage */}
      <ConfirmModal
        isOpen={showArchiveModal}
        onClose={() => {
          setShowArchiveModal(false);
          setAuditToArchive(null);
        }}
        onConfirm={handleArchiveConfirm}
        title="Archiver cet audit"
      >
        {auditToArchive && (
          <>
            <p>
              Êtes-vous sûr de vouloir archiver l'audit <strong>"{auditToArchive.template.name}"</strong> 
              du restaurant <strong>"{auditToArchive.restaurant.name}"</strong> ?
            </p>
            <p className="mt-2 text-destructive font-medium">
              Cette action est irréversible. L'audit sera déplacé vers les archives.
            </p>
          </>
        )}
      </ConfirmModal>
    </div>
  );
}