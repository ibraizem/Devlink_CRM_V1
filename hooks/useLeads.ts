import { useState, useCallback } from 'react';
import { Lead } from '@/lib/types/leads';
import { getLeads } from '@/lib/types/leads';
import { toast } from './use-toast';

export interface LeadFilters {
  statut?: string;
  search?: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);;
  
  const loadLeads = useCallback(async (filters: LeadFilters = {}) => {
    setLoading(true);
    try {
      const { data, error } = await getLeads({
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
  
  return { leads, loading, loadLeads };
};
