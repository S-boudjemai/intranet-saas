import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { ExclamationCircleIcon, ArchiveIcon, FilterIcon, EyeIcon, TicketIcon, ClipboardIcon } from '../components/icons';
import { ArchivesSkeleton } from '../components/Skeleton';
import TabNavigation from '../components/ui/TabNavigation';

interface AuditArchive {
  id: number;
  original_execution_id: number;
  template_name: string;
  template_category: string;
  restaurant_name: string;
  inspector_name: string;
  scheduled_date: string;
  completed_date: string;
  total_score: number | null;
  max_possible_score: number | null;
  notes?: string;
  archived_at: string;
  responses_data: any[];
  non_conformities_data: any[];
  corrective_actions_data: any[];
}

interface ArchivedTicket {
  id: string;
  title: string;
  description?: string;
  status: 'archived';
  tenant_id: string;
  created_by: number;
  restaurant_id: number | null;
  restaurant?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
  comments?: any[];
  attachments?: any[];
}

interface ArchivedCorrectiveAction {
  id: number;
  action_description: string;
  due_date: string | null;
  completion_date: string | null;
  completion_notes: string | null;
  verification_notes: string | null;
  status: 'archived';
  assigned_user_id: number | null;
  assigned_user?: {
    id: number;
    email: string;
  };
  audit_execution_id: number | null;
  created_at: string;
  updated_at: string;
}

interface ArchiveFilters {
  category?: string;
  restaurant_name?: string;
  inspector_name?: string;
  date_from?: string;
  date_to?: string;
  date_period?: string;
  min_score?: number;
  max_score?: number;
}

interface ArchiveStats {
  total_archives: number;
  average_score: number | null;
  categories: { category: string; count: number }[];
}

type TabType = 'audits' | 'tickets' | 'actions';

const ArchivesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('audits');
  const [archives, setArchives] = useState<AuditArchive[]>([]);
  const [archivedTickets, setArchivedTickets] = useState<ArchivedTicket[]>([]);
  const [archivedActions, setArchivedActions] = useState<ArchivedCorrectiveAction[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<AuditArchive | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ArchivedTicket | null>(null);
  const [selectedAction, setSelectedAction] = useState<ArchivedCorrectiveAction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ArchiveFilters>({});
  const { token } = useAuth();

  // Pagination et tri
  interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }

  interface SortState {
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
  }

  const [auditsPagination, setAuditsPagination] = useState<PaginationState>({ page: 1, limit: 20, total: 45, totalPages: 3 });
  const [ticketsPagination, setTicketsPagination] = useState<PaginationState>({ page: 1, limit: 20, total: 32, totalPages: 2 });
  const [actionsPagination, setActionsPagination] = useState<PaginationState>({ page: 1, limit: 20, total: 28, totalPages: 2 });
  
  const [auditsSort, setAuditsSort] = useState<SortState>({ sortBy: 'archived_at', sortOrder: 'DESC' });
  const [ticketsSort, setTicketsSort] = useState<SortState>({ sortBy: 'updated_at', sortOrder: 'DESC' });
  const [actionsSort, setActionsSort] = useState<SortState>({ sortBy: 'updated_at', sortOrder: 'DESC' });

  // Charger les archives et statistiques
  const loadData = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    // 🧪 DONNÉES DE TEST - À SUPPRIMER PLUS TARD
    const createTestData = () => {
      if (activeTab === 'audits') {
        let testAudits = Array.from({length: 45}, (_, i) => {
          // Créer des dates basées sur la date ACTUELLE
          const now = new Date();
          let archivedDate;
          
          if (i < 15) {
            // 15 premiers : ce mois (dynamique selon la date actuelle)
            archivedDate = new Date(now.getFullYear(), now.getMonth(), (i % 28) + 1);
          } else if (i < 25) {
            // 10 suivants : mois dernier (dynamique)
            archivedDate = new Date(now.getFullYear(), now.getMonth() - 1, ((i - 15) % 28) + 1);
          } else if (i < 35) {
            // 10 suivants : il y a 2 mois (dynamique)
            archivedDate = new Date(now.getFullYear(), now.getMonth() - 2, ((i - 25) % 28) + 1);
          } else {
            // Reste : il y a 3 mois (dynamique)
            archivedDate = new Date(now.getFullYear(), now.getMonth() - 3, ((i - 35) % 28) + 1);
          }
          
          return {
            id: i + 1,
            original_execution_id: i + 1,
            template_name: `Audit ${i + 1}`,
            template_category: ['Sécurité', 'Hygiène', 'Qualité'][i % 3],
            restaurant_name: `Restaurant ${Math.floor(i / 5) + 1}`,
            inspector_name: `Inspecteur ${(i % 3) + 1}`,
            scheduled_date: new Date(archivedDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            completed_date: new Date(archivedDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            total_score: 60 + (i * 3) % 40, // Scores entre 60-99
            max_possible_score: 100,
            archived_at: archivedDate.toISOString(),
            responses_data: [],
            non_conformities_data: [],
            corrective_actions_data: []
          };
        });


        // Appliquer le filtre de date
        if (filters.date_from && filters.date_to) {
          testAudits = testAudits.filter(audit => {
            const archivedDate = new Date(audit.archived_at).toISOString().split('T')[0];
            return archivedDate >= filters.date_from! && archivedDate <= filters.date_to!;
          });
        }

        // 🧪 APPLIQUER LE TRI SUR LES DONNÉES DE TEST
        testAudits.sort((a, b) => {
          let aVal: any, bVal: any;
          
          switch (auditsSort.sortBy) {
            case 'archived_at':
              aVal = new Date(a.archived_at);
              bVal = new Date(b.archived_at);
              break;
            case 'completed_date':
              aVal = new Date(a.completed_date);
              bVal = new Date(b.completed_date);
              break;
            case 'total_score':
              aVal = a.total_score;
              bVal = b.total_score;
              break;
            case 'restaurant_name':
              aVal = a.restaurant_name;
              bVal = b.restaurant_name;
              break;
            case 'template_name':
              aVal = a.template_name;
              bVal = b.template_name;
              break;
            default:
              aVal = a.archived_at;
              bVal = b.archived_at;
          }
          
          if (auditsSort.sortOrder === 'ASC') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
        
        const page = auditsPagination.page;
        const limit = auditsPagination.limit;
        const start = (page - 1) * limit;
        const paginatedData = testAudits.slice(start, start + limit);
        
        setArchives(paginatedData);
        setAuditsPagination(prev => ({
          ...prev,
          total: testAudits.length,
          totalPages: Math.ceil(testAudits.length / limit)
        }));
        setStats({ total_archives: testAudits.length, average_score: 85, categories: [] });
        setLoading(false);
        return;
      }
      
      if (activeTab === 'tickets') {
        const testTickets = Array.from({length: 32}, (_, i) => ({
          id: `ticket-${i + 1}`,
          title: `Ticket de test ${i + 1}`,
          description: `Description du ticket ${i + 1}`,
          status: 'archived' as const,
          tenant_id: '1',
          created_by: 1,
          restaurant_id: (i % 5) + 1,
          restaurant: { id: (i % 5) + 1, name: `Restaurant ${(i % 5) + 1}` },
          created_at: new Date(2024, 11 - (i % 6), Math.floor(Math.random() * 28) + 1).toISOString(),
          updated_at: new Date(2025, 0, Math.floor(Math.random() * 24) + 1).toISOString(),
        }));
        
        const page = ticketsPagination.page;
        const limit = ticketsPagination.limit;
        const start = (page - 1) * limit;
        
        setArchivedTickets(testTickets.slice(start, start + limit));
        setTicketsPagination(prev => ({
          ...prev,
          total: testTickets.length,
          totalPages: Math.ceil(testTickets.length / limit)
        }));
        setLoading(false);
        return;
      }
      
      if (activeTab === 'actions') {
        const testActions = Array.from({length: 28}, (_, i) => ({
          id: i + 1,
          action_description: `Action corrective ${i + 1}`,
          due_date: new Date(2024, 11, Math.floor(Math.random() * 30) + 1).toISOString(),
          completion_date: new Date(2024, 11, Math.floor(Math.random() * 30) + 15).toISOString(),
          completion_notes: `Notes de completion ${i + 1}`,
          verification_notes: `Notes de vérification ${i + 1}`,
          status: 'archived' as const,
          assigned_to: (i % 3) + 1,
          verified_by: (i % 2) + 1,
          verification_date: new Date(2025, 0, Math.floor(Math.random() * 24) + 1).toISOString(),
          created_at: new Date(2024, 10, Math.floor(Math.random() * 30) + 1).toISOString(),
          updated_at: new Date(2025, 0, Math.floor(Math.random() * 24) + 1).toISOString(),
          assigned_user: { id: (i % 3) + 1, email: `user${(i % 3) + 1}@test.com` },
          verifier: { id: (i % 2) + 1, email: `verifier${(i % 2) + 1}@test.com` }
        }));
        
        const page = actionsPagination.page;
        const limit = actionsPagination.limit;
        const start = (page - 1) * limit;
        
        setArchivedActions(testActions.slice(start, start + limit));
        setActionsPagination(prev => ({
          ...prev,
          total: testActions.length,
          totalPages: Math.ceil(testActions.length / limit)
        }));
        setLoading(false);
        return;
      }
    };
    
    // 🧪 UTILISER LES DONNÉES DE TEST
    createTestData();
    return;
    
    try {
      if (activeTab === 'audits') {
        // Construire les paramètres avec pagination et tri
        const params = new URLSearchParams({
          ...Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== '') {
              acc[key] = value.toString();
            }
            return acc;
          }, {} as Record<string, string>),
          page: auditsPagination.page.toString(),
          limit: auditsPagination.limit.toString(),
          sortBy: auditsSort.sortBy,
          sortOrder: auditsSort.sortOrder,
        });

        const [archivesRes, statsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/audit-archives?${params}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/audit-archives/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!archivesRes.ok || !statsRes.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const archivesData = await archivesRes.json();
        const statsData = await statsRes.json();

        if (archivesData.data && Array.isArray(archivesData.data)) {
          setArchives(archivesData.data);
          setAuditsPagination(prev => ({
            ...prev,
            total: archivesData.total || 0,
            totalPages: archivesData.totalPages || 0
          }));
        } else if (Array.isArray(archivesData)) {
          setArchives(archivesData);
        } else {
          setArchives([]);
        }
        setStats(statsData.data || statsData);
      } else if (activeTab === 'tickets') {
        const params = new URLSearchParams({
          page: ticketsPagination.page.toString(),
          limit: ticketsPagination.limit.toString(),
          sortBy: ticketsSort.sortBy,
          sortOrder: ticketsSort.sortOrder,
        });

        const ticketsRes = await fetch(`${import.meta.env.VITE_API_URL}/tickets/archived?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!ticketsRes.ok) {
          throw new Error('Erreur lors du chargement des tickets archivés');
        }

        const ticketsData = await ticketsRes.json();
        if (ticketsData.data && Array.isArray(ticketsData.data)) {
          setArchivedTickets(ticketsData.data);
          setTicketsPagination(prev => ({
            ...prev,
            total: ticketsData.total || 0,
            totalPages: ticketsData.totalPages || 0
          }));
        } else if (Array.isArray(ticketsData)) {
          setArchivedTickets(ticketsData);
        } else {
          setArchivedTickets([]);
        }
      } else if (activeTab === 'actions') {
        const params = new URLSearchParams({
          page: actionsPagination.page.toString(),
          limit: actionsPagination.limit.toString(),
          sortBy: actionsSort.sortBy,
          sortOrder: actionsSort.sortOrder,
        });

        const actionsRes = await fetch(`${import.meta.env.VITE_API_URL}/corrective-actions/archived?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!actionsRes.ok) {
          throw new Error('Erreur lors du chargement des actions correctives archivées');
        }

        const actionsData = await actionsRes.json();
        if (actionsData.data && Array.isArray(actionsData.data)) {
          setArchivedActions(actionsData.data);
          setActionsPagination(prev => ({
            ...prev,
            total: actionsData.total || 0,
            totalPages: actionsData.totalPages || 0
          }));
        } else if (Array.isArray(actionsData)) {
          setArchivedActions(actionsData);
        } else {
          setArchivedActions([]);
        }
      }
    } catch (err) {
      setError('Impossible de charger les archives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, filters, activeTab, auditsPagination.page, ticketsPagination.page, actionsPagination.page, auditsSort, ticketsSort, actionsSort]);

  // Gestionnaire de changement de filtres
  const handleFilterChange = (key: keyof ArchiveFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  // Restaurer un ticket archivé
  const restoreTicket = async (ticketId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tickets/${ticketId}/restore`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        // Recharger les données
        loadData();
      } else {
      }
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
    }
  };

  // Restaurer une action corrective archivée
  const restoreAction = async (actionId: number) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/corrective-actions/${actionId}/restore`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        // Recharger les données
        loadData();
      } else {
      }
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
    }
  };

  // Fonctions de pagination
  const handlePageChange = (tab: TabType, newPage: number) => {
    if (tab === 'audits') {
      setAuditsPagination(prev => ({ ...prev, page: newPage }));
    } else if (tab === 'tickets') {
      setTicketsPagination(prev => ({ ...prev, page: newPage }));
    } else if (tab === 'actions') {
      setActionsPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Fonctions de tri
  const handleSortChange = (tab: TabType, sortBy: string) => {
    if (tab === 'audits') {
      setAuditsSort(prev => ({
        sortBy,
        sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'DESC' ? 'ASC' : 'DESC'
      }));
      setAuditsPagination(prev => ({ ...prev, page: 1 })); // Reset page when sorting
    } else if (tab === 'tickets') {
      setTicketsSort(prev => ({
        sortBy,
        sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'DESC' ? 'ASC' : 'DESC'
      }));
      setTicketsPagination(prev => ({ ...prev, page: 1 }));
    } else if (tab === 'actions') {
      setActionsSort(prev => ({
        sortBy,
        sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'DESC' ? 'ASC' : 'DESC'
      }));
      setActionsPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  // Calculer le pourcentage de score avec protection contre null/undefined
  const getScorePercentage = (score: number | null | undefined, maxScore: number | null | undefined) => {
    if (score === null || score === undefined || maxScore === null || maxScore === undefined || 
        isNaN(score) || isNaN(maxScore) || maxScore <= 0) {
      return 0;
    }
    return Math.round((Number(score) / Number(maxScore)) * 100);
  };

  // Formater un score avec protection contre null/undefined
  const formatScore = (score: number | null | undefined) => {
    if (score === null || score === undefined || isNaN(score)) {
      return '0.0';
    }
    return Number(score).toFixed(1);
  };

  // Obtenir la couleur du score
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return <ArchivesSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center space-x-3 m-6">
        <ExclamationCircleIcon className="h-6 w-6" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 lg:p-8 space-y-6"
    >
      {/* En-tête */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="p-3 bg-primary/10 border border-primary/20 rounded-2xl"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <ArchiveIcon className="h-7 w-7 text-primary" />
          </motion.div>
          <span>Archives</span>
        </h1>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center gap-3"
        >
          {/* Filtre de date rapide */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Période:</label>
            <div className="relative">
              <select
                value={filters.date_period || 'all'}
                onChange={(e) => {
                const period = e.target.value;
                const now = new Date();
                let date_from = '';
                let date_to = '';
                
                if (period === 'this_month') {
                  // Juillet 2025 (mois actuel)
                  date_from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                  date_to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                } else if (period === 'last_month') {
                  // Juin 2025 (mois dernier)
                  date_from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                  date_to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                } else if (period === 'last_3_months') {
                  // Avril à Juillet 2025 (3 derniers mois)
                  date_from = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
                  date_to = now.toISOString().split('T')[0];
                } else if (period === 'this_year') {
                  date_from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                  date_to = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
                } else if (period === 'last_year') {
                  date_from = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
                  date_to = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
                }
                
                setFilters(prev => ({
                  ...prev,
                  date_period: period === 'all' ? undefined : period,
                  date_from: period === 'all' ? undefined : date_from,
                  date_to: period === 'all' ? undefined : date_to,
                }));
                
                // Reset pagination
                setAuditsPagination(prev => ({ ...prev, page: 1 }));
                setTicketsPagination(prev => ({ ...prev, page: 1 }));
                setActionsPagination(prev => ({ ...prev, page: 1 }));
              }}
                className="w-44 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="all">Toutes les dates</option>
                <option value="this_month">Ce mois</option>
                <option value="last_month">Mois dernier</option>
                <option value="last_3_months">3 derniers mois</option>
                <option value="this_year">Cette année</option>
                <option value="last_year">Année dernière</option>
              </select>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Onglets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <TabNavigation
          tabs={[
            { 
              id: 'audits', 
              label: 'Audits archivés', 
              icon: <ArchiveIcon className="h-4 w-4" />,
              badge: auditsPagination.total || archives.length 
            },
            { 
              id: 'tickets', 
              label: 'Tickets archivés', 
              icon: <TicketIcon className="h-4 w-4" />,
              badge: ticketsPagination.total || archivedTickets.length 
            },
            { 
              id: 'actions', 
              label: 'Actions archivées', 
              icon: <ClipboardIcon className="h-4 w-4" />,
              badge: actionsPagination.total || archivedActions.length 
            },
          ]}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        />
      </motion.div>

      {/* Statistiques - Audits uniquement */}
      {activeTab === 'audits' && stats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="text-2xl font-bold text-card-foreground">{stats.total_archives}</div>
            <div className="text-sm text-muted-foreground">Audits archivés</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="text-2xl font-bold text-card-foreground">{formatScore(stats.average_score)}</div>
            <div className="text-sm text-muted-foreground">Score moyen</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            <div className="text-2xl font-bold text-card-foreground">{stats.categories.length}</div>
            <div className="text-sm text-muted-foreground">Catégories</div>
          </motion.div>
        </motion.div>
      )}

      {/* Filtres - Audits uniquement */}
      {activeTab === 'audits' && showFilters && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="bg-card border border-border rounded-lg p-6 space-y-4"
        >
          <h3 className="font-semibold text-card-foreground">Filtres de recherche</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Catégorie
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              >
                <option value="">Toutes les catégories</option>
                {stats?.categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Restaurant
              </label>
              <input
                type="text"
                value={filters.restaurant_name || ''}
                onChange={(e) => handleFilterChange('restaurant_name', e.target.value)}
                placeholder="Nom du restaurant"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Inspecteur
              </label>
              <input
                type="text"
                value={filters.inspector_name || ''}
                onChange={(e) => handleFilterChange('inspector_name', e.target.value)}
                placeholder="Nom de l'inspecteur"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Score minimum
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.min_score || ''}
                onChange={(e) => handleFilterChange('min_score', parseFloat(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Contenu conditionnel selon l'onglet */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="bg-card border border-border rounded-lg"
      >
        {/* Audits archivés */}
        {activeTab === 'audits' && (
          <>
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Archives des audits ({auditsPagination.total || archives.length})
                </h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Trier par:</label>
                  <select
                    value={`${auditsSort.sortBy}-${auditsSort.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      setAuditsSort({ sortBy, sortOrder: sortOrder as 'ASC' | 'DESC' });
                      setAuditsPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="archived_at-DESC">Date d'archivage (↓)</option>
                    <option value="archived_at-ASC">Date d'archivage (↑)</option>
                    <option value="completed_date-DESC">Date de completion (↓)</option>
                    <option value="completed_date-ASC">Date de completion (↑)</option>
                    <option value="total_score-DESC">Score (↓)</option>
                    <option value="total_score-ASC">Score (↑)</option>
                    <option value="restaurant_name-ASC">Restaurant (A-Z)</option>
                    <option value="restaurant_name-DESC">Restaurant (Z-A)</option>
                    <option value="template_name-ASC">Template (A-Z)</option>
                    <option value="template_name-DESC">Template (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>

            {archives.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ArchiveIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune archive d'audit trouvée</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {archives.map((archive) => {
                  const scorePercentage = getScorePercentage(archive.total_score, archive.max_possible_score);
                  
                  return (
                    <div key={archive.id} className="p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-card-foreground">
                              {archive.template_name}
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                              {archive.template_category}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Restaurant:</span>
                              <br />
                              {archive.restaurant_name}
                            </div>
                            <div>
                              <span className="font-medium">Inspecteur:</span>
                              <br />
                              {archive.inspector_name}
                            </div>
                            <div>
                              <span className="font-medium">Terminé le:</span>
                              <br />
                              {new Date(archive.completed_date).toLocaleDateString('fr-FR')}
                            </div>
                            <div>
                              <span className="font-medium">Score:</span>
                              <br />
                              <span className={`font-bold ${getScoreColor(scorePercentage)}`}>
                                {formatScore(archive.total_score)}/{formatScore(archive.max_possible_score)} ({scorePercentage}%)
                              </span>
                            </div>
                          </div>

                          {archive.notes && (
                            <div className="mt-3 text-sm text-muted-foreground">
                              <span className="font-medium">Notes:</span> {archive.notes}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedArchive(archive)}
                          className="ml-4 flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                          Détails
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination pour audits */}
            {(auditsPagination.totalPages > 1 || auditsPagination.total > 0) && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {auditsPagination.page} sur {auditsPagination.totalPages} 
                  ({auditsPagination.total} éléments)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange('audits', auditsPagination.page - 1)}
                    disabled={auditsPagination.page <= 1}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange('audits', auditsPagination.page + 1)}
                    disabled={auditsPagination.page >= auditsPagination.totalPages}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tickets archivés */}
        {activeTab === 'tickets' && (
          <>
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Tickets archivés ({ticketsPagination.total || archivedTickets.length})
                </h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Trier par:</label>
                  <select
                    value={`${ticketsSort.sortBy}-${ticketsSort.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      setTicketsSort({ sortBy, sortOrder: sortOrder as 'ASC' | 'DESC' });
                      setTicketsPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="updated_at-DESC">Date de mise à jour (↓)</option>
                    <option value="updated_at-ASC">Date de mise à jour (↑)</option>
                    <option value="created_at-DESC">Date de création (↓)</option>
                    <option value="created_at-ASC">Date de création (↑)</option>
                    <option value="title-ASC">Titre (A-Z)</option>
                    <option value="title-DESC">Titre (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>

            {archivedTickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <TicketIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun ticket archivé trouvé</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {archivedTickets.map((ticket) => (
                  <div key={ticket.id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-card-foreground">
                            {ticket.title}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            Archivé
                          </span>
                        </div>
                        
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {ticket.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Restaurant:</span>
                            <br />
                            {ticket.restaurant?.name || 'Non spécifié'}
                          </div>
                          <div>
                            <span className="font-medium">Créé le:</span>
                            <br />
                            {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          <div>
                            <span className="font-medium">Archivé le:</span>
                            <br />
                            {new Date(ticket.updated_at).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                          Détails
                        </button>
                        <button
                          onClick={() => restoreTicket(ticket.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Restaurer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination pour tickets */}
            {(ticketsPagination.totalPages > 1 || ticketsPagination.total > 0) && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {ticketsPagination.page} sur {ticketsPagination.totalPages} 
                  ({ticketsPagination.total} éléments)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange('tickets', ticketsPagination.page - 1)}
                    disabled={ticketsPagination.page <= 1}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange('tickets', ticketsPagination.page + 1)}
                    disabled={ticketsPagination.page >= ticketsPagination.totalPages}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions correctives archivées */}
        {activeTab === 'actions' && (
          <>
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Actions correctives archivées ({actionsPagination.total || archivedActions.length})
                </h2>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Trier par:</label>
                  <select
                    value={`${actionsSort.sortBy}-${actionsSort.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      setActionsSort({ sortBy, sortOrder: sortOrder as 'ASC' | 'DESC' });
                      setActionsPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="updated_at-DESC">Date de mise à jour (↓)</option>
                    <option value="updated_at-ASC">Date de mise à jour (↑)</option>
                    <option value="created_at-DESC">Date de création (↓)</option>
                    <option value="created_at-ASC">Date de création (↑)</option>
                    <option value="due_date-DESC">Date d'échéance (↓)</option>
                    <option value="due_date-ASC">Date d'échéance (↑)</option>
                    <option value="completion_date-DESC">Date de completion (↓)</option>
                    <option value="completion_date-ASC">Date de completion (↑)</option>
                    <option value="action_description-ASC">Description (A-Z)</option>
                    <option value="action_description-DESC">Description (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>

            {archivedActions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ClipboardIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune action corrective archivée trouvée</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {archivedActions.map((action) => (
                  <div key={action.id} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-card-foreground">
                            {action.action_description}
                          </h3>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            Archivée
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Assignée à:</span>
                            <br />
                            {action.assigned_user?.email || 'Non assigné'}
                          </div>
                          <div>
                            <span className="font-medium">Échéance:</span>
                            <br />
                            {action.due_date ? new Date(action.due_date).toLocaleDateString('fr-FR') : 'Non définie'}
                          </div>
                          <div>
                            <span className="font-medium">Terminée le:</span>
                            <br />
                            {action.completion_date ? new Date(action.completion_date).toLocaleDateString('fr-FR') : 'Non terminée'}
                          </div>
                        </div>

                        {action.completion_notes && (
                          <div className="mt-3 text-sm text-muted-foreground">
                            <span className="font-medium">Notes de completion:</span> {action.completion_notes}
                          </div>
                        )}

                        {action.verification_notes && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <span className="font-medium">Notes de vérification:</span> {action.verification_notes}
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() => setSelectedAction(action)}
                          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                          Détails
                        </button>
                        <button
                          onClick={() => restoreAction(action.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Restaurer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination pour actions */}
            {(actionsPagination.totalPages > 1 || actionsPagination.total > 0) && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {actionsPagination.page} sur {actionsPagination.totalPages} 
                  ({actionsPagination.total} éléments)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange('actions', actionsPagination.page - 1)}
                    disabled={actionsPagination.page <= 1}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange('actions', actionsPagination.page + 1)}
                    disabled={actionsPagination.page >= actionsPagination.totalPages}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Modal des détails */}
      {selectedArchive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Détails de l'audit archivé
                </h2>
                <button
                  onClick={() => setSelectedArchive(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations générales */}
              <div>
                <h3 className="font-semibold text-card-foreground mb-3">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Template:</span>
                    <p>{selectedArchive.template_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Catégorie:</span>
                    <p>{selectedArchive.template_category}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Restaurant:</span>
                    <p>{selectedArchive.restaurant_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Inspecteur:</span>
                    <p>{selectedArchive.inspector_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Planifié le:</span>
                    <p>{new Date(selectedArchive.scheduled_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Terminé le:</span>
                    <p>{new Date(selectedArchive.completed_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              {/* Réponses */}
              {selectedArchive.responses_data.length > 0 && (
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">
                    Réponses ({selectedArchive.responses_data.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedArchive.responses_data.map((response, index) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <div className="font-medium text-card-foreground mb-1">
                          {response.question}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Réponse:</span> {response.value}
                          {response.score !== undefined && (
                            <span className="ml-3">
                              <span className="font-medium">Score:</span> {response.score}
                            </span>
                          )}
                        </div>
                        {response.notes && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Notes:</span> {response.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Non-conformités */}
              {selectedArchive.non_conformities_data.length > 0 && (
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">
                    Non-conformités ({selectedArchive.non_conformities_data.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedArchive.non_conformities_data.map((nc, index) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            nc.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            nc.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            nc.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {nc.severity}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            nc.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            nc.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {nc.status}
                          </span>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-card-foreground mb-1">
                            {nc.description}
                          </div>
                          {nc.resolution_notes && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">Résolution:</span> {nc.resolution_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions correctives */}
              {selectedArchive.corrective_actions_data.length > 0 && (
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">
                    Actions correctives ({selectedArchive.corrective_actions_data.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedArchive.corrective_actions_data.map((action, index) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            action.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                            action.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                            action.status === 'verified' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {action.status === 'completed' ? 'Réalisée' :
                             action.status === 'in_progress' ? 'En cours' :
                             action.status === 'verified' ? 'Vérifiée' :
                             'Assignée'}
                          </span>
                          {action.due_date && (
                            <span className="text-xs text-muted-foreground">
                              Échéance: {new Date(action.due_date).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-card-foreground mb-1">
                            {action.action_description}
                          </div>
                          {action.assigned_user && (
                            <div className="text-muted-foreground mb-1">
                              <span className="font-medium">Assignée à:</span> {action.assigned_user.email}
                            </div>
                          )}
                          {action.completion_date && (
                            <div className="text-muted-foreground mb-1">
                              <span className="font-medium">Réalisée le:</span> {new Date(action.completion_date).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                          {action.completion_notes && (
                            <div className="text-muted-foreground mb-1">
                              <span className="font-medium">Notes de réalisation:</span> {action.completion_notes}
                            </div>
                          )}
                          {action.verification_notes && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">Notes de vérification:</span> {action.verification_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal des détails de ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Détails du ticket archivé
                </h2>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations générales */}
              <div>
                <h3 className="font-semibold text-card-foreground mb-3">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Titre:</span>
                    <p>{selectedTicket.title}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Statut:</span>
                    <p>Archivé</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Restaurant:</span>
                    <p>{selectedTicket.restaurant?.name || 'Non spécifié'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Créé le:</span>
                    <p>{new Date(selectedTicket.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Archivé le:</span>
                    <p>{new Date(selectedTicket.updated_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                {selectedTicket.description && (
                  <div className="mt-4">
                    <span className="font-medium text-muted-foreground">Description:</span>
                    <p className="mt-1">{selectedTicket.description}</p>
                  </div>
                )}
              </div>

              {/* Commentaires */}
              {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">
                    Commentaires ({selectedTicket.comments.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedTicket.comments.map((comment: any, index: number) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <div className="text-sm text-muted-foreground mb-1">
                          {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-sm">{comment.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pièces jointes */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">
                    Pièces jointes ({selectedTicket.attachments.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedTicket.attachments.map((attachment: any, index: number) => (
                      <div key={index} className="border border-border rounded-lg p-3">
                        <div className="text-sm font-medium">{attachment.filename}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(attachment.file_size / 1024)} KB
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    restoreTicket(selectedTicket.id);
                    setSelectedTicket(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Restaurer le ticket
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des détails d'action corrective */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Détails de l'action corrective archivée
                </h2>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Informations générales */}
              <div>
                <h3 className="font-semibold text-card-foreground mb-3">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Description:</span>
                    <p>{selectedAction.action_description}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Statut:</span>
                    <p>Archivée</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Assignée à:</span>
                    <p>{selectedAction.assigned_user?.email || 'Non assigné'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Échéance:</span>
                    <p>{selectedAction.due_date ? new Date(selectedAction.due_date).toLocaleDateString('fr-FR') : 'Non définie'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Date de création:</span>
                    <p>{new Date(selectedAction.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Archivée le:</span>
                    <p>{new Date(selectedAction.updated_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              {/* Notes de completion */}
              {selectedAction.completion_notes && (
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">Notes de réalisation</h3>
                  <div className="border border-border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground mb-1">
                      Terminée le: {selectedAction.completion_date ? new Date(selectedAction.completion_date).toLocaleDateString('fr-FR') : 'Date non enregistrée'}
                    </div>
                    <div className="text-sm">{selectedAction.completion_notes}</div>
                  </div>
                </div>
              )}

              {/* Notes de vérification */}
              {selectedAction.verification_notes && (
                <div>
                  <h3 className="font-semibold text-card-foreground mb-3">Notes de vérification</h3>
                  <div className="border border-border rounded-lg p-3">
                    <div className="text-sm">{selectedAction.verification_notes}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    restoreAction(selectedAction.id);
                    setSelectedAction(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Restaurer l'action
                </button>
                <button
                  onClick={() => setSelectedAction(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ArchivesPage;