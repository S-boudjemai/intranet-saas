// src/components/AlertsSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  RestaurantIcon,
  TicketIcon,
  CogIcon,
  ArrowRightIcon
} from './icons';

interface Restaurant {
  id: string;
  name: string;
  city: string;
  address?: string;
}

interface CriticalTicket {
  id: string;
  title: string;
  created_at: string;
  priority?: string;
}

interface OverdueAction {
  id: string;
  title: string;
  due_date: string;
  status: string;
  priority?: string;
}

interface AlertsData {
  restaurantsWithoutRecentAudit: Restaurant[];
  criticalTickets: CriticalTicket[];
  overdueActions: OverdueAction[];
  auditThresholdDays: number;
}

interface AlertsSectionProps {
  alerts: AlertsData;
}

const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts }) => {
  const {
    restaurantsWithoutRecentAudit,
    criticalTickets, 
    overdueActions,
    auditThresholdDays
  } = alerts;

  // Si aucune alerte, ne pas afficher la section
  const totalAlerts = restaurantsWithoutRecentAudit.length + criticalTickets.length + overdueActions.length;
  if (totalAlerts === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-green-800 dark:text-green-200">
            🎯 Aucune alerte critique
          </h2>
        </div>
        <p className="text-green-700 dark:text-green-300 mt-2">
          Votre réseau fonctionne parfaitement ! Tous les audits sont à jour et aucun ticket critique en attente.
        </p>
      </motion.div>
    );
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return "Hier";
    return `Il y a ${diffInDays} jours`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200">
              🚨 Alertes critiques
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400">
              {totalAlerts} élément{totalAlerts > 1 ? 's' : ''} nécessite{totalAlerts > 1 ? 'nt' : ''} votre attention
            </p>
          </div>
        </div>
      </div>

      {/* Alertes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Restaurants sans audit récent */}
        {restaurantsWithoutRecentAudit.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-background rounded-xl p-4 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <RestaurantIcon className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Audits en retard
              </h3>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              {restaurantsWithoutRecentAudit.length} restaurant{restaurantsWithoutRecentAudit.length > 1 ? 's' : ''} sans audit depuis {auditThresholdDays} jours
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {restaurantsWithoutRecentAudit.slice(0, 3).map((restaurant) => (
                <div key={restaurant.id} className="text-xs bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                  <div className="font-medium text-red-800 dark:text-red-200">
                    {restaurant.name}
                  </div>
                  <div className="text-red-600 dark:text-red-400">
                    {restaurant.city}
                  </div>
                </div>
              ))}
              {restaurantsWithoutRecentAudit.length > 3 && (
                <div className="text-xs text-red-600 dark:text-red-400 italic">
                  +{restaurantsWithoutRecentAudit.length - 3} autre{restaurantsWithoutRecentAudit.length - 3 > 1 ? 's' : ''}
                </div>
              )}
            </div>
            <Link
              to="/audits"
              className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 mt-3"
            >
              Planifier audits <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </motion.div>
        )}

        {/* 2. Tickets critiques */}
        {criticalTickets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-background rounded-xl p-4 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <TicketIcon className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Tickets urgents
              </h3>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              {criticalTickets.length} ticket{criticalTickets.length > 1 ? 's' : ''} non traité{criticalTickets.length > 1 ? 's' : ''} depuis +3 jours
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {criticalTickets.map((ticket) => (
                <div key={ticket.id} className="text-xs bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                  <div className="font-medium text-red-800 dark:text-red-200 truncate">
                    {ticket.title}
                  </div>
                  <div className="text-red-600 dark:text-red-400 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {formatTimeAgo(ticket.created_at)}
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/tickets"
              className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 mt-3"
            >
              Traiter tickets <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </motion.div>
        )}

        {/* 3. Actions en retard */}
        {overdueActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-background rounded-xl p-4 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <CogIcon className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Actions en retard
              </h3>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">
              {overdueActions.length} action{overdueActions.length > 1 ? 's' : ''} corrective{overdueActions.length > 1 ? 's' : ''} en retard
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {overdueActions.map((action) => (
                <div key={action.id} className="text-xs bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                  <div className="font-medium text-red-800 dark:text-red-200 truncate">
                    {action.title}
                  </div>
                  <div className="text-red-600 dark:text-red-400 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Échéance : {formatTimeAgo(action.due_date)}
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/audits?tab=actions"
              className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 mt-3"
            >
              Voir actions <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AlertsSection;