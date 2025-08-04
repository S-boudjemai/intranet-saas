// src/hooks/useCorrectiveActions.ts
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  correctiveActionsService,
  ActionStatus,
  type CorrectiveAction, 
  type CreateCorrectiveActionDto, 
  type UpdateCorrectiveActionDto 
} from '../services/correctiveActionsService';

// Réexporter les types pour les composants
export { 
  ActionCategory, 
  ActionStatus, 
  ActionPriority,
  type CorrectiveAction,
  type CreateCorrectiveActionDto,
  type UpdateCorrectiveActionDto
} from '../services/correctiveActionsService';

export const useCorrectiveActions = () => {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await correctiveActionsService.getAll();
      setActions(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des actions correctives:', err);
      setError('Impossible de charger les actions correctives');
      toast.error('Erreur lors du chargement des actions');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAction = useCallback(async (dto: CreateCorrectiveActionDto) => {
    try {
      const newAction = await correctiveActionsService.create(dto);
      setActions(prev => [newAction, ...prev]);
      toast.success('Action corrective créée avec succès');
      return newAction;
    } catch (err) {
      console.error('Erreur lors de la création de l\'action:', err);
      toast.error('Impossible de créer l\'action corrective');
      throw err;
    }
  }, []);

  const updateAction = useCallback(async (id: string, updates: UpdateCorrectiveActionDto) => {
    try {
      const updatedAction = await correctiveActionsService.update(id, updates);
      setActions(prev => prev.map(action => action.id === id ? updatedAction : action));
      toast.success('Action mise à jour avec succès');
      return updatedAction;
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'action:', err);
      toast.error('Impossible de mettre à jour l\'action');
      throw err;
    }
  }, []);

  const deleteAction = useCallback(async (id: string) => {
    try {
      await correctiveActionsService.delete(id);
      setActions(prev => prev.filter(action => action.id !== id));
      toast.success('Action supprimée avec succès');
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'action:', err);
      toast.error('Impossible de supprimer l\'action');
      throw err;
    }
  }, []);

  const validateAction = useCallback(async (id: string) => {
    try {
      const updatedAction = await correctiveActionsService.validate(id);
      setActions(prev => prev.map(action => action.id === id ? updatedAction : action));
      toast.success('Action validée avec succès');
      return updatedAction;
    } catch (err) {
      console.error('Erreur lors de la validation de l\'action:', err);
      toast.error('Impossible de valider l\'action');
      throw err;
    }
  }, []);

  const completeAction = useCallback(async (id: string, notes?: string) => {
    try {
      const updatedAction = await correctiveActionsService.complete(id, notes);
      setActions(prev => prev.map(action => action.id === id ? updatedAction : action));
      toast.success('Action terminée avec succès');
      return updatedAction;
    } catch (err) {
      console.error('Erreur lors de la complétion de l\'action:', err);
      toast.error('Impossible de terminer l\'action');
      throw err;
    }
  }, []);

  const verifyAction = useCallback(async (id: string) => {
    try {
      const updatedAction = await correctiveActionsService.verify(id);
      setActions(prev => prev.map(action => action.id === id ? updatedAction : action));
      toast.success('Action vérifiée avec succès');
      return updatedAction;
    } catch (err) {
      console.error('Erreur lors de la vérification de l\'action:', err);
      toast.error('Impossible de vérifier l\'action');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  return {
    actions,
    loading,
    error,
    fetchActions,
    createAction,
    updateAction,
    deleteAction,
    validateAction,
    completeAction,
    verifyAction,
  };
};