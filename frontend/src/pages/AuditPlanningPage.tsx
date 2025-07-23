import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AuditExecution, AuditTemplate, RestaurantInfo } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ScheduleAuditModal from '../components/modals/ScheduleAuditModal';
import { HiPlus, HiCalendar, HiClock, HiUser, HiOfficeBuilding } from 'react-icons/hi';

export default function AuditPlanningPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<AuditExecution[]>([]);
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([]);
  const [inspectors, setInspectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
        // Filtrer pour garder seulement les managers du tenant
        const filteredInspectors = (data.data || data).filter((u: any) => 
          u.role === 'manager'
        ).map((u: any) => ({
          ...u,
          available: true // Simplification pour la démo
        }));
        setInspectors(filteredInspectors);
      }
    } catch (error) {
      // Erreur lors du chargement des données
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
        // Erreur lors de la planification de l'audit
      }
    } catch (error) {
      // Erreur lors de la planification de l'audit
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Brouillon', variant: 'secondary' as const },
      in_progress: { label: 'En cours', variant: 'info' as const },
      completed: { label: 'Terminé', variant: 'success' as const },
      reviewed: { label: 'Validé', variant: 'success' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isOverdue = (scheduledDate: string, status: string) => {
    if (status === 'completed' || status === 'reviewed') return false;
    return new Date(scheduledDate) < new Date();
  };

  const groupedExecutions = {
    today: executions.filter(e => {
      const today = new Date().toDateString();
      return new Date(e.scheduled_date).toDateString() === today;
    }),
    upcoming: executions.filter(e => {
      const today = new Date();
      const scheduledDate = new Date(e.scheduled_date);
      return scheduledDate > today && scheduledDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    }),
    future: executions.filter(e => {
      const today = new Date();
      const scheduledDate = new Date(e.scheduled_date);
      return scheduledDate > new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    }),
    overdue: executions.filter(e => isOverdue(e.scheduled_date, e.status)),
  };


  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-64"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="p-3 bg-primary/10 border border-primary/20 rounded-2xl"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
            >
              <HiCalendar className="h-6 w-6 text-primary" />
            </motion.div>
            <span>Planning des Audits</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Planifiez et suivez vos audits de conformité
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Button onClick={() => setShowCreateModal(true)}>
            <HiPlus className="w-4 h-4 mr-2" />
            Planifier un Audit
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats rapides */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="p-4" hover>
            <div className="flex items-center">
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-2 bg-primary/10 rounded-xl"
              >
                <HiCalendar className="w-6 h-6 text-primary" />
              </motion.div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold text-foreground">{groupedExecutions.today.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="p-4" hover>
            <div className="flex items-center">
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-2 bg-yellow-500/10 rounded-xl"
              >
                <HiClock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </motion.div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Cette semaine</p>
                <p className="text-2xl font-bold text-foreground">{groupedExecutions.upcoming.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Card className="p-4" hover>
            <div className="flex items-center">
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-2 bg-destructive/10 rounded-xl"
              >
                <HiUser className="w-6 h-6 text-destructive" />
              </motion.div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">En retard</p>
                <p className="text-2xl font-bold text-foreground">{groupedExecutions.overdue.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Card className="p-4" hover>
            <div className="flex items-center">
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="p-2 bg-green-500/10 rounded-xl"
              >
                <HiOfficeBuilding className="w-6 h-6 text-green-600 dark:text-green-400" />
              </motion.div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total audits</p>
                <p className="text-2xl font-bold text-foreground">{executions.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* En retard - Section prioritaire */}
      {groupedExecutions.overdue.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-red-600 mb-4 flex items-center">
            <HiClock className="w-5 h-5 mr-2" />
            Audits en retard ({groupedExecutions.overdue.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupedExecutions.overdue.map((execution) => (
              <Card key={execution.id} className="p-4 border-l-4 border-red-500">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{execution.template.name}</h3>
                    <p className="text-sm text-muted-foreground">{execution.restaurant.name}</p>
                  </div>
                  {getStatusBadge(execution.status)}
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
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <HiCalendar className="w-5 h-5 mr-2" />
            Aujourd'hui ({groupedExecutions.today.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedExecutions.today.map((execution) => (
              <Card key={execution.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{execution.template.name}</h3>
                    <p className="text-sm text-muted-foreground">{execution.restaurant.name}</p>
                  </div>
                  {getStatusBadge(execution.status)}
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
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <HiClock className="w-5 h-5 mr-2" />
            Cette semaine ({groupedExecutions.upcoming.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedExecutions.upcoming.map((execution) => (
              <Card key={execution.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{execution.template.name}</h3>
                    <p className="text-sm text-muted-foreground">{execution.restaurant.name}</p>
                  </div>
                  {getStatusBadge(execution.status)}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <HiCalendar className="w-4 h-4 mr-1" />
                  {new Date(execution.scheduled_date).toLocaleDateString()}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <HiUser className="w-4 h-4 mr-1" />
                  {execution.inspector.email}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/audit/${execution.id}`)}
                >
                  Voir détails
                </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Audits futurs */}
      {groupedExecutions.future.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 2.0, type: "spring", stiffness: 300 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <HiOfficeBuilding className="w-5 h-5 mr-2" />
            </motion.div>
            Audits futurs ({groupedExecutions.future.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedExecutions.future.map((execution, index) => (
              <motion.div
                key={execution.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.1 + index * 0.1, duration: 0.5 }}
              >
                <Card className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{execution.template.name}</h3>
                    <p className="text-sm text-muted-foreground">{execution.restaurant.name}</p>
                  </div>
                  {getStatusBadge(execution.status)}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <HiCalendar className="w-4 h-4 mr-1" />
                  {new Date(execution.scheduled_date).toLocaleDateString()}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground mb-3">
                  <HiUser className="w-4 h-4 mr-1" />
                  {execution.inspector.email}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/audit/${execution.id}`)}
                >
                  Voir détails
                </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* État vide */}
      {executions.length === 0 && (
        <Card className="p-12 text-center">
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
          city: r.city || 'Non spécifié'
        }))}
        inspectors={inspectors}
      />
    </motion.div>
  );
}