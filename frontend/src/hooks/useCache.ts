// src/hooks/useCache.ts
// SOFIANE : Hook de cache intelligent pour optimiser les performances des audits

import { useState, useCallback, useRef, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface CacheOptions {
  maxAge?: number; // en millisecondes
  maxEntries?: number;
  autoCleanup?: boolean;
}

export const useCache = <T>(options: CacheOptions = {}) => {
  const {
    maxAge = 5 * 60 * 1000, // 5 minutes par défaut
    maxEntries = 100,
    autoCleanup = true
  } = options;

  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [hitRate, setHitRate] = useState({ hits: 0, misses: 0 });

  // Nettoyage automatique des entrées expirées
  const cleanup = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(cache.current.entries());
    
    entries.forEach(([key, entry]) => {
      if (now > entry.expiry) {
        cache.current.delete(key);
      }
    });

    // Limiter le nombre d'entrées (LRU simple)
    if (cache.current.size > maxEntries) {
      const sortedEntries = entries
        .filter(([, entry]) => now <= entry.expiry)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = sortedEntries.slice(0, cache.current.size - maxEntries);
      toDelete.forEach(([key]) => cache.current.delete(key));
    }
  }, [maxEntries]);

  // Auto-nettoyage périodique
  useEffect(() => {
    if (!autoCleanup) return;

    const interval = setInterval(cleanup, 60000); // Nettoyage toutes les minutes
    return () => clearInterval(interval);
  }, [cleanup, autoCleanup]);

  const set = useCallback((key: string, data: T, customMaxAge?: number) => {
    const now = Date.now();
    const expiry = now + (customMaxAge || maxAge);
    
    cache.current.set(key, {
      data,
      timestamp: now,
      expiry
    });

    cleanup();
  }, [maxAge, cleanup]);

  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    
    if (!entry) {
      setHitRate(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    const now = Date.now();
    if (now > entry.expiry) {
      cache.current.delete(key);
      setHitRate(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    // Mettre à jour le timestamp pour LRU
    entry.timestamp = now;
    setHitRate(prev => ({ ...prev, hits: prev.hits + 1 }));
    return entry.data;
  }, []);

  const has = useCallback((key: string): boolean => {
    const entry = cache.current.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now > entry.expiry) {
      cache.current.delete(key);
      return false;
    }
    
    return true;
  }, []);

  const remove = useCallback((key: string) => {
    cache.current.delete(key);
  }, []);

  const clear = useCallback(() => {
    cache.current.clear();
    setHitRate({ hits: 0, misses: 0 });
  }, []);

  const getStats = useCallback(() => {
    const total = hitRate.hits + hitRate.misses;
    return {
      size: cache.current.size,
      hits: hitRate.hits,
      misses: hitRate.misses,
      hitRate: total > 0 ? (hitRate.hits / total) * 100 : 0,
      total
    };
  }, [hitRate]);

  // Méthode pour fetch avec cache automatique
  const cachedFetch = useCallback(async <R>(
    key: string,
    fetcher: () => Promise<R>,
    customMaxAge?: number
  ): Promise<R> => {
    // Vérifier le cache en premier
    const cached = get(key);
    if (cached !== null) {
      return cached as R;
    }

    // Fetch et cache
    try {
      const data = await fetcher();
      set(key, data as T, customMaxAge);
      return data;
    } catch (error) {
      // Ne pas cacher les erreurs
      throw error;
    }
  }, [get, set]);

  return {
    set,
    get,
    has,
    remove,
    clear,
    cleanup,
    getStats,
    cachedFetch
  };
};

export default useCache;