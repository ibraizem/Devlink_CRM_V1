// hooks/crm/useLeadActions.ts
'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface LeadAction {
  id: string;
  lead_id: string;
  type: 'call' | 'email' | 'note' | 'meeting' | 'status_change';
  data: any;
  created_at: string;
}

export interface CallLog {
  id: string;
  lead_id: string;
  phone_number: string;
  duration?: number;
  status: 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'failed';
  notes?: string;
  call_time: string;
}

export function useLeadActions() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const supabase = createClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 🔥 Actions d'appel téléphonique
  const handleCall = useCallback(async (leadId: string, phone: string) => {
    setIsLoading(`call-${leadId}`);
    
    try {
      // Logique d'appel - intégration avec votre système téléphonique
      console.log(`Appel en cours vers: ${phone} pour le lead: ${leadId}`);
      
      // Enregistrer la tentative d'appel
      const { error } = await supabase
        .from('lead_actions')
        .insert({
          lead_id: leadId,
          type: 'call',
          data: {
            phone_number: phone,
            timestamp: new Date().toISOString(),
            status: 'attempted'
          }
        });

      if (error) throw error;

      // Mettre à jour le statut du lead
      await updateLeadStatus(leadId, 'en_cours');

      toast({
        title: 'Appel initié',
        description: `Appel vers ${phone} en cours...`,
      });

      // Simuler un retour d'appel (à remplacer par votre intégration réelle)
      setTimeout(async () => {
        await logCallResult(leadId, phone, 'connected', 120);
      }, 3000);

    } catch (error) {
      console.error('Erreur lors de l\'appel:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'initier l\'appel',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }, [supabase, toast]);

  // 📧 Actions d'email
  const handleEmail = useCallback(async (leadId: string, email: string) => {
    setIsLoading(`email-${leadId}`);
    
    try {
      // Ouvrir le client email par défaut
      const subject = encodeURIComponent('Votre demande d\'information');
      const body = encodeURIComponent('Bonjour,\n\nJe vous contacte suite à votre demande...');
      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');

      // Enregistrer l'action email
      const { error } = await supabase
        .from('lead_actions')
        .insert({
          lead_id: leadId,
          type: 'email',
          data: {
            email_address: email,
            timestamp: new Date().toISOString(),
            status: 'sent'
          }
        });

      if (error) throw error;

      toast({
        title: 'Email préparé',
        description: `Email à ${email} ouvert dans votre client`,
      });

    } catch (error) {
      console.error('Erreur lors de la préparation de l\'email:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de préparer l\'email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }, [supabase, toast]);

  // 🎯 Mise à jour du statut d'un lead
  const updateLeadStatus = useCallback(async (leadId: string, status: string) => {
    setIsLoading(`status-${leadId}`);
    
    try {
      const { error } = await supabase
        .from('lead_actions')
        .insert({
          lead_id: leadId,
          type: 'status_change',
          data: {
            old_status: 'nouveau', // À récupérer depuis le lead actuel
            new_status: status,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      // Mettre à jour le lead principal si nécessaire
      const { error: updateError } = await supabase
        .from('fichier_donnees')
        .update({ statut: status })
        .eq('id', leadId);

      if (updateError) throw updateError;

      toast({
        title: 'Statut mis à jour',
        description: `Lead marqué comme "${status}"`,
      });

      // Invalider le cache pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['leads'] });

    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }, [supabase, toast, queryClient]);

  // 📝 Ajouter une note à un lead
  const addNoteToLead = useCallback(async (leadId: string, note: string) => {
    try {
      const { error } = await supabase
        .from('lead_actions')
        .insert({
          lead_id: leadId,
          type: 'note',
          data: {
            content: note,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      toast({
        title: 'Note ajoutée',
        description: 'La note a été enregistrée avec succès',
      });

      queryClient.invalidateQueries({ queryKey: ['lead-actions', leadId] });

    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la note',
        variant: 'destructive',
      });
    }
  }, [supabase, toast, queryClient]);

  // 🔄 Mise à jour groupée des leads
  const bulkUpdateLeads = useCallback(async (leadIds: string[], updates: any) => {
    setIsLoading('bulk-update');
    
    try {
      // Créer des actions pour chaque lead
      const actions = leadIds.map(leadId => ({
        lead_id: leadId,
        type: 'status_change',
        data: {
          ...updates,
          timestamp: new Date().toISOString(),
          bulk_operation: true
        }
      }));

      const { error } = await supabase
        .from('lead_actions')
        .insert(actions);

      if (error) throw error;

      // Mettre à jour les leads en masse si nécessaire
      if (updates.statut) {
        const { error: updateError } = await supabase
          .from('fichier_donnees')
          .update({ statut: updates.statut })
          .in('id', leadIds);

        if (updateError) throw updateError;
      }

      toast({
        title: 'Mise à jour groupée',
        description: `${leadIds.length} leads mis à jour`,
      });

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLeads([]);

    } catch (error) {
      console.error('Erreur lors de la mise à jour groupée:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les leads',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }, [supabase, toast, queryClient]);

  // 📞 Journaliser le résultat d'un appel
  const logCallResult = useCallback(async (
    leadId: string, 
    phone: string, 
    status: CallLog['status'], 
    duration?: number
  ) => {
    try {
      const { error } = await supabase
        .from('call_logs')
        .insert({
          lead_id: leadId,
          phone_number: phone,
          status,
          duration,
          call_time: new Date().toISOString()
        });

      if (error) throw error;

      // Mettre à jour le statut du lead basé sur le résultat de l'appel
      let newStatus = 'en_cours';
      if (status === 'connected') newStatus = 'en_cours';
      if (status === 'voicemail') newStatus = 'relance';
      if (status === 'no_answer' || status === 'busy') newStatus = 'a_relancer';

      await updateLeadStatus(leadId, newStatus);

      toast({
        title: `Appel ${status === 'connected' ? 'réussi' : 'terminé'}`,
        description: `Statut: ${status}${duration ? ` (${duration}s)` : ''}`,
      });

    } catch (error) {
      console.error('Erreur lors du journal d\'appel:', error);
    }
  }, [supabase, toast, updateLeadStatus]);

  // 🗑️ Supprimer des leads
  const deleteLeads = useCallback(async (leadIds: string[]) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${leadIds.length} lead(s) ?`)) {
      return;
    }

    setIsLoading('delete-leads');
    
    try {
      const { error } = await supabase
        .from('fichier_donnees')
        .delete()
        .in('id', leadIds);

      if (error) throw error;

      toast({
        title: 'Leads supprimés',
        description: `${leadIds.length} lead(s) ont été supprimés`,
      });

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLeads([]);

    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer les leads',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }, [supabase, toast, queryClient]);

  // 📊 Récupérer l'historique d'un lead
  const getLeadHistory = useCallback(async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('lead_actions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }, [supabase]);

  // 🎯 Sélection/désélection de leads
  const toggleLeadSelection = useCallback((leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  }, []);

  const selectAllLeads = useCallback((leadIds: string[]) => {
    setSelectedLeads(leadIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLeads([]);
  }, []);

  // 🔄 Mutation React Query pour les actions asynchrones
  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: any }) => {
      const { error } = await supabase
        .from('fichier_donnees')
        .update(updates)
        .eq('id', leadId);

      if (error) throw error;
      return { leadId, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Lead mis à jour',
        description: 'Les modifications ont été enregistrées',
      });
    },
    onError: (error) => {
      console.error('Erreur mutation lead:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le lead',
        variant: 'destructive',
      });
    }
  });

  return {
    // États
    isLoading,
    selectedLeads,
    
    // Actions principales
    handleCall,
    handleEmail,
    updateLeadStatus,
    addNoteToLead,
    bulkUpdateLeads,
    deleteLeads,
    
    // Gestion de sélection
    toggleLeadSelection,
    selectAllLeads,
    clearSelection,
    
    // Données historiques
    getLeadHistory,
    
    // Mutation React Query
    updateLeadMutation,
    
    // Utilitaires
    isLeadLoading: (action: string, leadId?: string) => 
      isLoading === action || (leadId && isLoading === `${action}-${leadId}`)
  };
}

// 🎯 Hook complémentaire pour les statistiques d'appels
export function useCallAnalytics() {
  const supabase = createClient();

  const getCallStats = useCallback(async (period: 'today' | 'week' | 'month' = 'today') => {
    try {
      let dateFilter = new Date();
      
      switch (period) {
        case 'today':
          dateFilter.setHours(0, 0, 0, 0);
          break;
        case 'week':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case 'month':
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
      }

      const { data, error } = await supabase
        .from('call_logs')
        .select('status, duration')
        .gte('call_time', dateFilter.toISOString());

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        connected: data?.filter(call => call.status === 'connected').length || 0,
        voicemail: data?.filter(call => call.status === 'voicemail').length || 0,
        noAnswer: data?.filter(call => call.status === 'no_answer').length || 0,
        totalDuration: data?.reduce((acc, call) => acc + (call.duration || 0), 0) || 0,
        averageDuration: 0
      };

      stats.averageDuration = stats.connected > 0 ? Math.round(stats.totalDuration / stats.connected) : 0;

      return stats;

    } catch (error) {
      console.error('Erreur lors de la récupération des stats d\'appel:', error);
      return null;
    }
  }, [supabase]);

  return {
    getCallStats
  };
}