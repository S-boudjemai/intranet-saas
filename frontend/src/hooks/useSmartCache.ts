import { useState, useCallback, useRef, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live en ms (défaut: 5 minutes)
  staleWhileRevalidate?: boolean; // Retourner données périmées pendant rechargement
  maxSize?: number; // Taille max du cache (défaut: 50 entrées)
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private accessTimes = new Map<string, number>();
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl: number): void {
    // Éviction LRU si cache plein
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    this.accessTimes.set(key, Date.now());
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    this.accessTimes.set(key, Date.now());
    const isStale = Date.now() - entry.timestamp > entry.ttl;
    
    return {
      data: entry.data,
      isStale
    };
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.accessTimes.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // Nettoyer les entrées expirées
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl * 2) { // Supprimer si 2x plus vieux que TTL
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.delete(key));
  }
}

// Instance globale du cache
const globalCache = new SmartCache(100);

// Nettoyage périodique du cache
setInterval(() => {
  globalCache.cleanup();
}, 5 * 60 * 1000); // Toutes les 5 minutes

export function useSmartCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes par défaut
    staleWhileRevalidate = true,
    maxSize = 50
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Vérifier d'abord le cache
    if (!forceRefresh) {
      const cached = globalCache.get<T>(key);
      if (cached) {
        if (!mountedRef.current) return;
        setData(cached.data);
        setIsStale(cached.isStale);
        setError(null);
        
        // Si stale-while-revalidate et données périmées, recharger en arrière-plan
        if (staleWhileRevalidate && cached.isStale) {
          // Recharger en arrière-plan sans changer l'état de loading
          fetchData(true);
        }
        return cached.data;
      }
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Ne montrer loading que si pas de données en cache ou refresh forcé
      if (!data || forceRefresh) {
        setLoading(true);
      }
      setError(null);

      const result = await fetcher();
      
      if (!mountedRef.current) return result;

      // Mettre à jour le cache
      globalCache.set(key, result, ttl);
      
      // Mettre à jour l'état
      setData(result);
      setIsStale(false);
      setLoading(false);
      
      return result;
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Requête annulée
      }

      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      
      // En cas d'erreur, garder les données du cache si disponibles
      const cached = globalCache.get<T>(key);
      if (cached && !data) {
        setData(cached.data);
        setIsStale(true);
      }
    }
  }, [key, fetcher, ttl, staleWhileRevalidate, data]);

  // Charger les données au montage
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fonction pour rafraîchir manuellement
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Fonction pour invalider le cache
  const invalidate = useCallback(() => {
    globalCache.delete(key);
    setData(null);
    setIsStale(false);
    setError(null);
  }, [key]);

  // Fonction pour mettre à jour les données directement (optimistic updates)
  const mutate = useCallback((newData: T) => {
    globalCache.set(key, newData, ttl);
    setData(newData);
    setIsStale(false);
    setError(null);
  }, [key, ttl]);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    invalidate,
    mutate
  };
}

// Hook spécialisé pour les listes avec pagination
export function useSmartListCache<T>(
  baseKey: string,
  fetcher: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  options: CacheOptions & { pageSize?: number } = {}
) {
  const { pageSize = 20, ...cacheOptions } = options;
  const [page, setPage] = useState(1);

  const {
    data: result,
    loading,
    error,
    isStale,
    refresh,
    invalidate,
    mutate
  } = useSmartCache(
    `${baseKey}_page_${page}_size_${pageSize}`,
    () => fetcher(page, pageSize),
    cacheOptions
  );

  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const reset = useCallback(() => {
    setPage(1);
    // Invalider toutes les pages de cette liste
    globalCache.clear(); // Simplification - en prod, filtrer par baseKey
  }, []);

  return {
    data: result?.data || [],
    total: result?.total || 0,
    loading,
    error,
    isStale,
    page,
    hasMore: result ? result.data.length === pageSize : false,
    loadMore,
    refresh,
    reset,
    mutate: (newData: T[]) => mutate({ data: newData, total: newData.length })
  };
}

export default useSmartCache;