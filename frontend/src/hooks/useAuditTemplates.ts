// src/hooks/useAuditTemplates.ts
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import auditTemplatesService, { AuditTemplateWithItems } from '../services/auditTemplatesService';
import { CreateAuditTemplateDto } from '../types';

export const useAuditTemplates = () => {
  const [templates, setTemplates] = useState<AuditTemplateWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les templates
  const fetchTemplates = async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await auditTemplatesService.getAll(category);
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des templates');
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau template
  const createTemplate = async (templateData: CreateAuditTemplateDto): Promise<boolean> => {
    try {
      setLoading(true);
      const newTemplate = await auditTemplatesService.create(templateData);
      setTemplates(prev => [...prev, newTemplate]);
      toast.success('Template créé avec succès');
      return true;
    } catch (err: any) {
      const errorMsg = typeof err.response?.data?.message === 'string' 
        ? err.response.data.message 
        : err.response?.data?.message?.message || err.message || 'Erreur lors de la création du template';
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un template
  const updateTemplate = async (id: string, updateData: Partial<CreateAuditTemplateDto>): Promise<boolean> => {
    try {
      setLoading(true);
      const updatedTemplate = await auditTemplatesService.update(id, updateData);
      setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
      toast.success('Template mis à jour avec succès');
      return true;
    } catch (err: any) {
      const errorMsg = typeof err.response?.data?.message === 'string' 
        ? err.response.data.message 
        : err.response?.data?.message?.message || err.message || 'Erreur lors de la mise à jour du template';
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un template
  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      await auditTemplatesService.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template supprimé avec succès');
      return true;
    } catch (err: any) {
      const errorMsg = typeof err.response?.data?.message === 'string' 
        ? err.response.data.message 
        : err.response?.data?.message?.message || err.message || 'Erreur lors de la suppression du template';
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Charger les templates au montage du component
  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};