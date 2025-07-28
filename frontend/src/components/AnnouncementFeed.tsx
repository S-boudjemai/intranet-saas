import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToastHelpers } from './ToastContainer';
import AnnouncementCard from './AnnouncementCard';
import EmptyState from './EmptyState';
import { AnnouncementFeedSkeleton } from './Skeleton';
import { parseJwt, type JwtPayload } from '../utils/jwt';
import type { Announcement } from '../types';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  RefreshIcon,
  FilterIcon,
  SearchIcon
} from './icons';
import Button from './ui/Button';
import Badge from './ui/Badge';

interface AnnouncementFeedProps {
  onDeleteRequest: (announcement: Announcement) => void;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AnnouncementFilters {
  search: string;
  dateRange: 'all' | '7days' | '30days' | '90days';
}

export default function AnnouncementFeed({ onDeleteRequest }: AnnouncementFeedProps) {
  const { token } = useAuth();
  const toast = useToastHelpers();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<AnnouncementFilters>({
    search: '',
    dateRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const canManage = raw?.role === 'manager' || raw?.role === 'admin';

  const loadAnnouncements = useCallback(async (page = 1, resetData = false) => {
    if (!token) return;
    
    if (resetData) {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateRange !== 'all' && { dateRange: filters.dateRange })
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/announcements?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      
      // Support both paginated and simple array responses
      if (data.data && Array.isArray(data.data)) {
        setAnnouncements(data.data);
        setPagination({
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || pagination.limit,
          total: data.pagination?.total || data.data.length,
          totalPages: data.pagination?.totalPages || Math.ceil(data.data.length / pagination.limit)
        });
      } else if (Array.isArray(data)) {
        // Fallback for non-paginated response
        const startIndex = (page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;
        const paginatedData = data.slice(startIndex, endIndex);
        
        setAnnouncements(paginatedData);
        setPagination({
          page,
          limit: pagination.limit,
          total: data.length,
          totalPages: Math.ceil(data.length / pagination.limit)
        });
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des annonces');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [token, pagination.limit, filters]);

  // Charger les annonces au montage et quand les filtres changent
  useEffect(() => {
    loadAnnouncements(1, true);
  }, [filters]);

  // Gestionnaires de pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      loadAnnouncements(newPage);
    }
  };

  const handleRefresh = () => {
    loadAnnouncements(pagination.page, true);
  };

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleDateRangeChange = (range: AnnouncementFilters['dateRange']) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  };

  const clearFilters = () => {
    setFilters({ search: '', dateRange: 'all' });
  };

  const hasActiveFilters = filters.search !== '' || filters.dateRange !== 'all';

  if (loading) {
    return <AnnouncementFeedSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-foreground">
            Fil d'actualités
          </h2>
          {pagination.total > 0 && (
            <Badge variant="secondary">
              {pagination.total} annonce{pagination.total > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10 text-primary' : ''}
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filtres
            {hasActiveFilters && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {[filters.search && 'recherche', filters.dateRange !== 'all' && 'date']
                  .filter(Boolean).length}
              </Badge>
            )}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Panneau de filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Recherche */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Rechercher
                  </label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Titre ou contenu..."
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                {/* Période */}
                <div className="sm:w-64">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Période
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleDateRangeChange(e.target.value as AnnouncementFilters['dateRange'])}
                    className="w-full py-2 px-3 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="all">Toutes les périodes</option>
                    <option value="7days">7 derniers jours</option>
                    <option value="30days">30 derniers jours</option>
                    <option value="90days">3 derniers mois</option>
                  </select>
                </div>
              </div>

              {/* Actions des filtres */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Effacer les filtres
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des annonces */}
      {announcements.length === 0 ? (
        <EmptyState
          icon="📢"
          title="Aucune annonce"
          description={hasActiveFilters 
            ? "Aucune annonce ne correspond à vos critères de recherche."
            : "Aucune annonce n'a été publiée pour le moment."
          }
          action={hasActiveFilters ? {
            label: "Effacer les filtres",
            onClick: clearFilters
          } : undefined}
        />
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  delay: index * 0.05,
                  layout: { duration: 0.3 }
                }}
              >
                <AnnouncementCard
                  announcement={announcement}
                  canManage={canManage}
                  onDeleteRequest={onDeleteRequest}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between bg-card border border-border rounded-lg p-4"
        >
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} sur {pagination.totalPages} • {pagination.total} annonce{pagination.total > 1 ? 's' : ''} au total
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Précédent
            </Button>

            {/* Numéros de page */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Suivant
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}