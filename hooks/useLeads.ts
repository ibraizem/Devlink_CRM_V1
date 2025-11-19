import { useState, useCallback, useEffect } from 'react';
import { Lead, LeadFilters } from '@/lib/types/leads';
import { leadService } from '@/lib/services/leadService';
import { toast } from './use-toast';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Charger les leads au montage
  useEffect(() => {
    loadLeads();
  }, []);
  
  const loadLeads = useCallback(async (filters: LeadFilters = {}) => {
    setLoading(true);
    try {
      const { data, error } = await leadService.getLeads({
        statut: filters.statut === 'all' ? undefined : filters.statut,
        search: filters.search || undefined,
      });
      
      if (error) throw error;
      setLeads(data || []);
      return data || [];
    } catch (error) {
      console.error('Erreur lors du chargement des leads:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les leads. Veuillez réessayer plus tard.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Alias pour compatibilité avec le realtime sync
  const refreshLeads = useCallback(async () => {
    return loadLeads();
  }, [loadLeads]);
  
  return { leads, loading, loadLeads, refreshLeads };
};
