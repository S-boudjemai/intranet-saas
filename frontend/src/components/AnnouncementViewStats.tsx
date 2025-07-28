// src/components/AnnouncementViewStats.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon } from './icons';
import { ViewStatsSkeleton } from './Skeleton';

interface ViewStats {
  total_views: number;
  total_users: number;
  percentage: number;
}

interface AnnouncementViewStatsProps {
  announcementId: number;
  canManage: boolean;
}

export default function AnnouncementViewStats({ 
  announcementId, 
  canManage 
}: AnnouncementViewStatsProps) {
  const { token } = useAuth();
  const [stats, setStats] = useState<ViewStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canManage || !token) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/announcements/${announcementId}/view-stats`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStats(data.data || data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [announcementId, canManage, token]);

  if (!canManage) return null;
  
  if (loading || !stats) {
    return <ViewStatsSkeleton />;
  }

  // Couleurs selon le pourcentage
  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getDarkColorClass = (percentage: number) => {
    if (percentage >= 80) return 'dark:text-green-400 dark:bg-green-950 dark:border-green-800';
    if (percentage >= 50) return 'dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800';
    return 'dark:text-red-400 dark:bg-red-950 dark:border-red-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${getColorClass(stats.percentage)} ${getDarkColorClass(stats.percentage)}`}
    >
      <EyeIcon className="w-3 h-3" />
      <span>
        {stats.total_views}/{stats.total_users} ({stats.percentage}%)
      </span>
      {loading && (
        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
      )}
    </motion.div>
  );
}