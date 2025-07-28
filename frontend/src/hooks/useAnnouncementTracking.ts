// src/hooks/useAnnouncementTracking.ts
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAnnouncementTracking = (announcementId: number) => {
  const { token } = useAuth();
  const hasTracked = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ne pas tracker si pas de token ou si déjà tracké
    if (!token || !announcementId || hasTracked.current) {
      return;
    }

    // Vérifier si déjà marqué comme lu dans localStorage
    const localKey = `announcement_read_${announcementId}`;
    if (localStorage.getItem(localKey)) {
      hasTracked.current = true;
      return;
    }

    // Tracker après 3 secondes de lecture
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/announcements/${announcementId}/mark-as-read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          hasTracked.current = true;
          localStorage.setItem(localKey, 'true');
        }
      } catch (error) {
        console.error('Erreur lors du tracking de l\'annonce:', error);
      }
    }, 3000); // 3 secondes

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [announcementId, token]);

  // Cleanup à la destruction du composant
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isTracked: hasTracked.current,
  };
};