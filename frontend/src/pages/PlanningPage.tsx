// src/pages/PlanningPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Plus, Filter, Users, Building2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import planningService from '../services/planningService';
import restaurantService from '../services/restaurantService';
import usersService from '../services/usersService';
import { PlanningCalendarData, CalendarEvent, PlanningTask } from '../types/planning';
import TaskModal from '../components/planning/TaskModal';
import EventDetailsModal from '../components/planning/EventDetailsModal';
import { motion } from 'framer-motion';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuration du localisateur français
const locales = {
  fr: fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Messages en français pour le calendrier
const messages = {
  allDay: 'Toute la journée',
  previous: 'Précédent',
  next: 'Suivant',
  today: 'Aujourd\'hui',
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  noEventsInRange: 'Aucun événement dans cette période',
  showMore: total => `+ ${total} de plus`,
};

const PlanningPage: React.FC = () => {
  const { user } = useAuth();

  // State
  const [calendarData, setCalendarData] = useState<PlanningCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>('month');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  
  // Filtres
  const [filters, setFilters] = useState<{
    restaurant_id?: number;
    assigned_to?: number;
  }>({});
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [restaurantsData, managersData] = await Promise.all([
          restaurantService.getAll(),
          usersService.getManagers(),
        ]);
        
        setRestaurants(restaurantsData);
        setManagers(managersData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast.error('Erreur lors du chargement des données');
      }
    };

    loadInitialData();
  }, []);

  // Charger le calendrier quand la date ou les filtres changent
  useEffect(() => {
    loadCalendarData();
  }, [currentDate, filters]);

  const loadCalendarData = async () => {
    if (!user?.tenant_id) return;

    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const data = await planningService.getCalendar(year, month, filters);
      setCalendarData(data);
    } catch (error) {
      console.error('Erreur lors du chargement du planning:', error);
      toast.error('Erreur lors du chargement du planning');
    } finally {
      setLoading(false);
    }
  };

  // Convertir les données en événements de calendrier
  const calendarEvents = useMemo((): CalendarEvent[] => {
    if (!calendarData) return [];

    const events: CalendarEvent[] = [];

    // Ajouter les tâches personnalisées
    calendarData.tasks.forEach(task => {
      const startDate = new Date(task.scheduled_date);
      let endDate;
      
      if (task.duration) {
        // Durée en minutes : ajouter les minutes à la date de début
        endDate = new Date(startDate.getTime() + (task.duration * 60 * 1000));
      } else {
        // Pas de durée : tâche de 1 heure par défaut
        endDate = new Date(startDate.getTime() + (60 * 60 * 1000));
      }

      events.push({
        id: `task-${task.id}`,
        title: task.title,
        start: startDate,
        end: endDate,
        resource: {
          type: 'task',
          data: task,
          status: task.status,
        },
      });
    });

    // Ajouter les audits
    calendarData.audits.forEach(audit => {
      const startDate = new Date(audit.scheduled_date);
      // Audit par défaut : 2 heures de durée
      const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000));

      events.push({
        id: `audit-${audit.id}`,
        title: audit.title,
        start: startDate,
        end: endDate,
        resource: {
          type: 'audit',
          data: audit,
          status: audit.status,
        },
      });
    });

    return events;
  }, [calendarData]);

  // Styles des événements selon leur type et statut
  const eventStyleGetter = (event: CalendarEvent) => {
    const { type, status } = event.resource;
    const now = new Date();
    const eventEnd = new Date(event.end);
    
    // Vérifier si l'événement est en retard (date de fin passée et pas terminé)
    const isOverdue = eventEnd < now && status !== 'completed' && status !== 'cancelled';
    
    let backgroundColor = '#3174ad';
    let borderColor = '#265985';
    
    if (type === 'audit') {
      backgroundColor = '#2563eb'; // Bleu pour les audits
      borderColor = '#1d4ed8';
    } else if (event.resource.data?.type === 'corrective_action') {
      backgroundColor = '#f59e0b'; // Orange pour les actions correctives
      borderColor = '#d97706';
    } else {
      backgroundColor = '#16a34a'; // Vert pour les tâches personnalisées
      borderColor = '#15803d';
    }
    
    // Statuts prioritaires
    if (status === 'completed') {
      backgroundColor = '#6b7280'; // Gris pour terminé
      borderColor = '#4b5563';
    } else if (status === 'cancelled') {
      backgroundColor = '#dc2626'; // Rouge pour annulé
      borderColor = '#b91c1c';
    } else if (isOverdue) {
      backgroundColor = '#dc2626'; // Rouge pour en retard
      borderColor = '#b91c1c';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: `1px solid ${borderColor}`,
        borderRadius: '4px',
      },
    };
  };

  // Gérer la sélection d'un créneau vide
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (user?.role === 'viewer') return; // Les viewers ne peuvent pas créer de tâches

    setSelectedSlot({ start, end });
    setShowTaskModal(true);
  };

  // Gérer la sélection d'un événement
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Gérer la création d'une tâche
  const handleCreateTask = async () => {
    await loadCalendarData();
    setShowTaskModal(false);
    setSelectedSlot(null);
  };

  // Gérer la mise à jour d'un événement
  const handleEventUpdate = async () => {
    await loadCalendarData();
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  if (loading && !calendarData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">
                  Planning
                </h1>
              </div>
              <p className="text-muted-foreground">
                Gérez vos audits et tâches dans un calendrier unifié
              </p>
            </div>
            
            {user?.role !== 'viewer' && (
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nouvelle tâche
              </button>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Filtres */}
          <div className="bg-card border border-border rounded-xl p-6">
          {/* Boutons raccourcis */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Vue rapide :</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters({})}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                  !filters.assigned_to && !filters.restaurant_id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Tout voir
              </button>
              
              {user && (
                <button
                  onClick={() => setFilters({ assigned_to: user.userId })}
                  className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                    filters.assigned_to === user.userId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Mon planning
                </button>
              )}
            </div>
          </div>

          {/* Filtres détaillés */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3 sm:mb-0">
              <Filter className="h-4 w-4" />
              <span>Filtres avancés :</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <select
                value={filters.restaurant_id || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  restaurant_id: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className="w-full p-3 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              >
                <option value="">Tous les restaurants</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.assigned_to || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  assigned_to: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className="w-full p-3 bg-background border border-border rounded-xl text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
              >
                <option value="">Tous les assignés</option>
                {managers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name || manager.email}
                  </option>
                ))}
              </select>

              {/* Indicateur de filtres actifs */}
              {(filters.assigned_to || filters.restaurant_id) && (
                <button
                  onClick={() => setFilters({})}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors min-h-[44px]"
                >
                  <span>Effacer</span>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          </div>

          {/* Calendrier */}
          <div className="bg-card border border-border rounded-xl p-4 h-[500px] sm:h-[600px]">
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            messages={messages}
            culture="fr"
            view={currentView}
            onView={setCurrentView}
            date={currentDate}
            onNavigate={setCurrentDate}
            selectable={user?.role !== 'viewer'}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            className="h-full"
            formats={{
              monthHeaderFormat: 'MMMM yyyy',
              dayHeaderFormat: 'EEEE dd/MM',
              dayRangeHeaderFormat: ({ start, end }) => 
                `${format(start, 'dd/MM')} - ${format(end, 'dd/MM yyyy')}`,
            }}
          />
          </div>

          {/* Légende */}
          <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-medium text-foreground mb-3">
            Légende
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Audits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Tâches personnalisées</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Actions correctives</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Terminé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-muted-foreground">En retard / Annulé</span>
            </div>
          </div>
          </div>
        </motion.div>
      </div>

      {/* Modales */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedSlot(null);
        }}
        onSuccess={handleCreateTask}
        selectedSlot={selectedSlot}
        restaurants={restaurants}
        managers={managers}
      />

      <EventDetailsModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onUpdate={handleEventUpdate}
      />
    </div>
  );
};

export default PlanningPage;