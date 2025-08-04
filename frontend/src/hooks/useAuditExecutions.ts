// src/hooks/useAuditExecutions.ts
import { useState, useEffect } from 'react';
import auditExecutionsService, { 
  AuditExecutionWithTemplate, 
  CreateAuditExecutionDto,
  UpdateAuditExecutionDto 
} from '../services/auditExecutionsService';
import { AuditStatus } from '../types';
import toast from 'react-hot-toast';

// Fonction utilitaire pour extraire les messages d'erreur
const extractErrorMessage = (err: any, defaultMessage: string): string => {
  if (err.response?.data?.message) {
    if (Array.isArray(err.response.data.message)) {
      return err.response.data.message.join(', ');
    } else if (typeof err.response.data.message === 'string') {
      return err.response.data.message;
    } else if (typeof err.response.data.message === 'object' && err.response.data.message.message) {
      // Cas où message est un objet avec une propriété message
      return err.response.data.message.message;
    }
  } else if (err.message) {
    return err.message;
  }
  return defaultMessage;
};

export const useAuditExecutions = () => {
  const [executions, setExecutions] = useState<AuditExecutionWithTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les audits
  const fetchExecutions = async (status?: AuditStatus) => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditExecutionsService.getAll(status);
      setExecutions(data);
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err, 'Erreur lors du chargement des audits');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouvel audit (planification)
  const createExecution = async (executionData: CreateAuditExecutionDto): Promise<boolean> => {
    try {
      setLoading(true);
      const newExecution = await auditExecutionsService.create(executionData);
      // Recharger toutes les données pour s'assurer de la cohérence
      await fetchExecutions();
      toast.success('Audit planifié avec succès');
      return true;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err, 'Erreur lors de la planification de l\'audit');
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un audit
  const updateExecution = async (id: string, updateData: UpdateAuditExecutionDto): Promise<boolean> => {
    try {
      setLoading(true);
      const updatedExecution = await auditExecutionsService.update(id, updateData);
      setExecutions(prev => prev.map(exec => exec.id === id ? updatedExecution : exec));
      toast.success('Audit mis à jour avec succès');
      return true;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err, 'Erreur lors de la mise à jour de l\'audit');
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Démarrer un audit
  const startExecution = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const startedExecution = await auditExecutionsService.start(id);
      setExecutions(prev => prev.map(exec => exec.id === id ? startedExecution : exec));
      toast.success('Audit démarré avec succès');
      return true;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err, 'Erreur lors du démarrage de l\'audit');
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Terminer un audit
  const completeExecution = async (id: string, summary?: any): Promise<boolean> => {
    try {
      setLoading(true);
      const completedExecution = await auditExecutionsService.complete(id, summary);
      setExecutions(prev => prev.map(exec => exec.id === id ? completedExecution : exec));
      toast.success('Audit terminé avec succès');
      return true;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err, 'Erreur lors de la finalisation de l\'audit');
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder les réponses d'un audit
  const saveResponses = async (id: string, responses: any[]): Promise<boolean> => {
    try {
      await auditExecutionsService.saveResponses(id, responses);
      toast.success('Réponses sauvegardées');
      return true;
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err, 'Erreur lors de la sauvegarde');
      toast.error(errorMessage);
      return false;
    }
  };

  // Obtenir un audit par ID
  const getExecutionById = async (id: string): Promise<AuditExecutionWithTemplate | null> => {
    try {
      return await auditExecutionsService.getById(id);
    } catch (err: any) {
      const errorMessage = extractErrorMessage(err, 'Erreur lors du chargement de l\'audit');
      toast.error(errorMessage);
      return null;
    }
  };

  // Charger au montage du composant
  useEffect(() => {
    fetchExecutions();
  }, []);

  return {
    executions,
    loading,
    error,
    fetchExecutions,
    createExecution,
    updateExecution,
    startExecution,
    completeExecution,
    saveResponses,
    getExecutionById,
    // Helpers pour filtrer par statut
    scheduledExecutions: executions.filter(exec => exec.status === AuditStatus.SCHEDULED),
    inProgressExecutions: executions.filter(exec => exec.status === AuditStatus.IN_PROGRESS),
    completedExecutions: executions.filter(exec => exec.status === AuditStatus.COMPLETED),
    overdueExecutions: executions.filter(exec => exec.status === AuditStatus.OVERDUE),
  };
};