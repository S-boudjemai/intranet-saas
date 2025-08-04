// src/hooks/useScheduleAuditData.ts
import { useState, useEffect } from 'react';
import auditTemplatesService, { AuditTemplateWithItems } from '../services/auditTemplatesService';
import restaurantService, { Restaurant } from '../services/restaurantService';
import usersService, { User } from '../services/usersService';
import toast from 'react-hot-toast';

export const useScheduleAuditData = () => {
  const [templates, setTemplates] = useState<AuditTemplateWithItems[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer toutes les données en parallèle
      const [templatesData, restaurantsData, managersData] = await Promise.all([
        auditTemplatesService.getAll(),
        restaurantService.getAll(),
        usersService.getManagers(),
      ]);

      setTemplates(templatesData);
      setRestaurants(restaurantsData);
      setManagers(managersData);

    } catch (err: any) {
      // Erreur lors du chargement des données d'audit
      const errorMessage = typeof err.response?.data?.message === 'string' 
        ? err.response.data.message 
        : err.response?.data?.message?.message || err.message || 'Erreur lors du chargement des données';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return {
    templates,
    restaurants,
    managers,
    loading,
    error,
    refetch: fetchAllData,
  };
};