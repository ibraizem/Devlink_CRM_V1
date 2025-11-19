'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/lib/services/userService';
import { useCurrentUser } from './useCurrentUser';

interface Activity {
  id: string;
  user_id: string;
  activity_type: string;
  details: Record<string, any>;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface UseUserActivitiesReturn {
  activities: Activity[];
  loading: boolean;
  error: Error | null;
  logActivity: (activityType: string, details?: Record<string, any>) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUserActivities(userId?: string, limit: number = 10): UseUserActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useCurrentUser();
  
  // Utiliser l'ID utilisateur fourni ou celui de l'utilisateur connecté
  const targetUserId = userId || user?.id;

  const fetchActivities = async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      const { data } = await userService.getUserActivities(targetUserId, limit);
      setActivities(data || []);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des activités:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetUserId) {
      fetchActivities();
    }
  }, [targetUserId, limit]);

  const logActivity = async (activityType: string, details: Record<string, any> = {}) => {
    if (!targetUserId) return;
    
    try {
      await userService.logActivity(targetUserId, activityType, details);
      // Rafraîchir la liste des activités après en avoir ajouté une nouvelle
      await fetchActivities();
    } catch (err) {
      console.error('Erreur lors de la journalisation de l\'activité:', err);
      throw err;
    }
  };

  return {
    activities,
    loading,
    error,
    logActivity,
    refresh: fetchActivities,
  };
}

// Hook pour les activités récentes (pour le tableau de bord, par exemple)
export function useRecentActivities(limit: number = 10) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecentActivities = async () => {
    try {
      setLoading(true);
      const data = await userService.getRecentActivities(limit);
      setActivities(data || []);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des activités récentes:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivities();
  }, [limit]);

  return {
    activities,
    loading,
    error,
    refresh: fetchRecentActivities,
  };
}
