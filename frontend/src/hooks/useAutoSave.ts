import { useEffect, useRef, useCallback } from 'react';
import { useDeviceDetection } from './useDeviceDetection';

interface UseAutoSaveOptions<T> {
  debounce?: number;
  storageKey?: string;
  onSave?: (data: T) => Promise<void> | void;
  onError?: (error: Error) => void;
  enabled?: boolean;
  maxRetries?: number;
}

interface AutoSaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  error: Error | null;
}

export function useAutoSave<T>(
  data: T,
  options: UseAutoSaveOptions<T> = {}
) {
  const {
    debounce = 2000,
    storageKey,
    onSave,
    onError,
    enabled = true,
    maxRetries = 3
  } = options;

  const { isMobile } = useDeviceDetection();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const lastDataRef = useRef<T>(data);
  const stateRef = useRef<AutoSaveState>({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
    error: null
  });

  // Sauvegarder dans localStorage si storageKey fourni
  const saveToStorage = useCallback((data: T) => {
    if (!storageKey) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        savedAt: new Date().toISOString(),
        version: '1.0'
      }));
    } catch (error) {
      console.warn('AutoSave: localStorage failed', error);
    }
  }, [storageKey]);

  // Charger depuis localStorage
  const loadFromStorage = useCallback((): T | null => {
    if (!storageKey) return null;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      return parsed.data;
    } catch (error) {
      console.warn('AutoSave: localStorage load failed', error);
      return null;
    }
  }, [storageKey]);

  // Fonction de sauvegarde principale
  const performSave = useCallback(async (currentData: T) => {
    if (!enabled) return;

    stateRef.current.isSaving = true;
    stateRef.current.error = null;

    try {
      // Sauvegarder en localStorage d'abord (rapide)
      saveToStorage(currentData);
      
      // Puis appeler onSave si fourni
      if (onSave) {
        await onSave(currentData);
      }

      stateRef.current.lastSaved = new Date();
      stateRef.current.hasUnsavedChanges = false;
      retryCountRef.current = 0;
      
    } catch (error) {
      stateRef.current.error = error as Error;
      
      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(() => performSave(currentData), 1000 * retryCountRef.current);
      } else {
        onError?.(error as Error);
      }
    } finally {
      stateRef.current.isSaving = false;
    }
  }, [enabled, onSave, onError, maxRetries, saveToStorage]);

  // Debounced save
  const debouncedSave = useCallback((data: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    stateRef.current.hasUnsavedChanges = true;

    timeoutRef.current = setTimeout(() => {
      performSave(data);
    }, isMobile ? debounce * 1.5 : debounce); // Plus de délai sur mobile
  }, [debounce, isMobile, performSave]);

  // Auto-save quand les données changent
  useEffect(() => {
    if (!enabled) return;

    // Éviter la sauvegarde initiale
    if (lastDataRef.current === data) return;

    const hasChanged = JSON.stringify(lastDataRef.current) !== JSON.stringify(data);
    if (hasChanged) {
      lastDataRef.current = data;
      debouncedSave(data);
    }
  }, [data, enabled, debouncedSave]);

  // Sauvegarde immédiate
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return performSave(data);
  }, [data, performSave]);

  // Nettoyage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Sauvegarder avant fermeture de page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (stateRef.current.hasUnsavedChanges) {
        e.preventDefault();
        saveNow();
        return 'Vous avez des modifications non sauvegardées.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveNow]);

  return {
    saveNow,
    loadFromStorage,
    lastSaved: stateRef.current.lastSaved,
    isSaving: stateRef.current.isSaving,
    hasUnsavedChanges: stateRef.current.hasUnsavedChanges,
    error: stateRef.current.error,
    clearStorage: () => storageKey && localStorage.removeItem(storageKey)
  };
}