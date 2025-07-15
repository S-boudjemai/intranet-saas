import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SpinnerIcon, ExclamationCircleIcon, ArchiveIcon, FilterIcon, EyeIcon } from '../components/icons';

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

interface ArchiveFilters {
  category?: string;
  restaurant_name?: string;
  inspector_name?: string;
  date_from?: string;
  date_to?: string;
  min_score?: number;
  max_score?: number;
}

interface ArchiveStats {
  total_archives: number;
  average_score: number | null;
  categories: { category: string; count: number }[];
}

const ArchivesPage: React.FC = () => {
  const [archives, setArchives] = useState<AuditArchive[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<AuditArchive | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ArchiveFilters>({});
  const { token } = useAuth();

  // Charger les archives et statistiques
  const loadData = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [archivesRes, statsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/audit-archives?${new URLSearchParams(
          Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== '') {
              acc[key] = value.toString();
            }
            return acc;
          }, {} as Record<string, string>)
        )}`, {
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

      setArchives(archivesData.data || archivesData);
      setStats(statsData.data || statsData);
    } catch (err) {
      setError('Impossible de charger les archives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, filters]);

  // Gestionnaire de changement de filtres
  const handleFilterChange = (key: keyof ArchiveFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
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
    return (
      <div className="flex h-64 items-center justify-center space-x-2 text-muted-foreground">
        <SpinnerIcon className="h-6 w-6 animate-spin" />
        <span>Chargement des archives...</span>
      </div>
    );
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 bg-card border border-border rounded-lg">
            <ArchiveIcon className="h-6 w-6 text-primary" />
          </div>
          <span>Archives des audits</span>
        </h1>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        >
          <FilterIcon className="h-4 w-4" />
          Filtres
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-card-foreground">{stats.total_archives}</div>
            <div className="text-sm text-muted-foreground">Audits archivés</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-card-foreground">{formatScore(stats.average_score)}</div>
            <div className="text-sm text-muted-foreground">Score moyen</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-bold text-card-foreground">{stats.categories.length}</div>
            <div className="text-sm text-muted-foreground">Catégories</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      {showFilters && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-card-foreground">Filtres de recherche</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Catégorie
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
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
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
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
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
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
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
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
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
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
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>
          </div>
        </div>
      )}

      {/* Liste des archives */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-card-foreground">
            Archives ({archives.length})
          </h2>
        </div>

        {archives.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ArchiveIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune archive trouvée</p>
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
      </div>

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
                            'bg-gray-100 text-gray-800'
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivesPage;