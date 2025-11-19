'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// --- Types -----------------------------------------------------------------

export type CallStatus = 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'failed';

export interface CallLog {
  id: string;
  lead_id: string;
  phone_number: string;
  status: CallStatus;
  duration?: number;
  notes?: string;
  call_time: string;
}

export type LeadActionType =
  | 'lead_assigne'
  | 'statut_change'
  | 'note'
  | 'rendezvous'
  | 'appel'
  | 'email'
  | 'autre';

export interface LeadAction {
  id: string;
  lead_id: string;
  agent_id?: string;
  type: LeadActionType;
  description?: string;
  contenu?: string;
  metadata?: any;
  bulk_operation?: boolean;
  timestamp?: string;
  created_at?: string;
  updated_at?: string;
}

// ---------------------------------------------------------------------------

export function useLeadActions() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const insertLeadAction = async (payload: Omit<LeadAction, 'id' | 'created_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const insertData = {
      ...payload,
      agent_id: user?.id,
    };
    
    console.log('🔍 Données envoyées à lead_actions:', insertData);
    
    const { error } = await supabase.from('lead_actions').insert(insertData);
    if (error) {
      console.error('❌ Erreur insertion lead_actions:', error);
      throw error;
    }
  };

  const updateLead = async (leadId: string, updates: any) => {
    const { error } = await supabase
      .from('fichiers_import')
      .update(updates)
      .eq('id', leadId);

    if (error) throw error;
  };

  const refreshLeads = () =>
    queryClient.invalidateQueries({ queryKey: ['leads'] });

  // -------------------------------------------------------------------------
  // CALL HANDLING
  // -------------------------------------------------------------------------

  const handleCall = useCallback(async (leadId: string, phone: string) => {
    setIsLoading(`call-${leadId}`);

    try {
      console.log(`📞 Appel en cours → Lead ${leadId} (${phone})`);

      await insertLeadAction({
        lead_id: leadId,
        type: 'appel',
        description: `Appel téléphonique vers ${phone}`,
        metadata: {
          phone_number: phone,
          timestamp: new Date().toISOString(),
          status: 'attempted',
        },
      });

      await updateLeadStatus(leadId, 'en_cours');

      toast({
        title: 'Appel initié',
        description: `Appel vers ${phone} lancé`,
      });

      // Simulation (à remplacer plus tard par ton module VoIP)
      setTimeout(() => logCallResult(leadId, phone, 'connected', 120), 3000);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: 'Impossible d’initier l’appel',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }, []);

  // -------------------------------------------------------------------------
  // EMAIL
  // -------------------------------------------------------------------------

  const handleEmail = useCallback(async (leadId: string, email: string) => {
    setIsLoading(`email-${leadId}`);

    try {
      const subject = encodeURIComponent('Votre demande');
      const body = encodeURIComponent('Bonjour,\n\nSuite à votre demande…');

      window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');

      await insertLeadAction({
        lead_id: leadId,
        type: 'email',
        description: `Email envoyé vers ${email}`,
        metadata: {
          email_address: email,
          timestamp: new Date().toISOString(),
          status: 'sent',
        },
      });

      toast({
        title: 'Email ouvert',
        description: `Votre client email a été ouvert`,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: 'Impossible de préparer l’email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }, []);

  // -------------------------------------------------------------------------
  // UPDATE STATUS
  // -------------------------------------------------------------------------

  const updateLeadStatus = useCallback(async (leadId: string, status: string) => {
    setIsLoading(`status-${leadId}`);

    try {
      await insertLeadAction({
        lead_id: leadId,
        type: 'statut_change',
        description: `Statut changé en ${status}`,
        metadata: {
          new_status: status,
          timestamp: new Date().toISOString(),
        },
      });

      await updateLead(leadId, { statut: status });

      toast({
        title: 'Statut mis à jour',
        description: `Nouveau statut: ${status}`,
      });

      refreshLeads();
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: 'Échec de mise à jour du statut',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }, []);

  // -------------------------------------------------------------------------
  // NOTES
  // -------------------------------------------------------------------------

  const addNoteToLead = useCallback(async (leadId: string, note: string) => {
    try {
      await insertLeadAction({
        lead_id: leadId,
        type: 'note',
        description: 'Note ajoutée',
        contenu: note,
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: 'Note ajoutée',
        description: 'La note a été enregistrée',
      });

      queryClient.invalidateQueries({ queryKey: ['lead-actions', leadId] });
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: 'Impossible d’ajouter la note',
        variant: 'destructive',
      });
    }
  }, []);

  // -------------------------------------------------------------------------
  // BULK UPDATE
  // -------------------------------------------------------------------------

  const bulkUpdateLeads = useCallback(async (leadIds: string[], updates: any) => {
    setIsLoading('bulk-update');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const actions = leadIds.map((id) => ({
        lead_id: id,
        agent_id: user?.id,
        type: 'statut_change',
        description: `Statut changé en ${updates.statut || 'multiple'}`,
        metadata: {
          ...updates,
          timestamp: new Date().toISOString(),
          bulk_operation: true,
        },
      }));

      const { error } = await supabase.from('lead_actions').insert(actions);
      if (error) throw error;

      if (updates.statut) {
        await supabase
          .from('fichiers_import')
          .update({ statut: updates.statut })
          .in('id', leadIds);
      }

      toast({
        title: 'Mise à jour groupée',
        description: `${leadIds.length} leads mis à jour`,
      });

      refreshLeads();
      setSelectedLeads([]);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: 'Échec de la mise à jour groupée',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }, []);

  // -------------------------------------------------------------------------
  // DELETE LEADS
  // -------------------------------------------------------------------------

  const deleteLeads = useCallback(async (leadIds: string[]) => {
    if (!confirm(`Supprimer ${leadIds.length} lead(s) ?`)) return;

    setIsLoading('delete-leads');

    try {
      await supabase.from('fichiers_import').delete().in('id', leadIds);

      toast({
        title: 'Supprimé',
        description: `${leadIds.length} lead(s) supprimé(s)`,
      });

      refreshLeads();
      setSelectedLeads([]);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer les leads',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  }, []);

  // -------------------------------------------------------------------------
  // LOG CALL RESULT
  // -------------------------------------------------------------------------

  const logCallResult = useCallback(
    async (leadId: string, phone: string, status: CallStatus, duration?: number) => {
      try {
        const { error } = await supabase.from('call_logs').insert({
          lead_id: leadId,
          phone_number: phone,
          status,
          duration,
          call_time: new Date().toISOString(),
        });

        if (error) throw error;

        const statusMap: Record<CallStatus, string> = {
          connected: 'en_cours',
          voicemail: 'relance',
          no_answer: 'a_relancer',
          busy: 'a_relancer',
          failed: 'a_relancer',
        };

        await updateLeadStatus(leadId, statusMap[status]);

        toast({
          title: `Appel ${status === 'connected' ? 'réussi' : 'terminé'}`,
          description: duration ? `Durée: ${duration}s` : '',
        });
      } catch (e) {
        console.error(e);
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // SELECTION
  // -------------------------------------------------------------------------

  const toggleLeadSelection = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllLeads = (ids: string[]) => setSelectedLeads(ids);
  const clearSelection = () => setSelectedLeads([]);

  // -------------------------------------------------------------------------
  // MUTATION
  // -------------------------------------------------------------------------

  const updateLeadMutation = useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: any }) =>
      updateLead(leadId, updates),
    onSuccess: () => {
      refreshLeads();
      toast({
        title: 'Lead mis à jour',
        description: 'Modifications enregistrées',
      });
    },
    onError: (e) => {
      console.error(e);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour',
        variant: 'destructive',
      });
    },
  });

  // -------------------------------------------------------------------------

  return {
    isLoading,
    selectedLeads,

    handleCall,
    handleEmail,
    updateLeadStatus,
    addNoteToLead,
    bulkUpdateLeads,
    deleteLeads,
    logCallResult,

    toggleLeadSelection,
    selectAllLeads,
    clearSelection,

    updateLeadMutation,

    isLeadLoading: (action: string, leadId?: string) =>
      isLoading === action || isLoading === `${action}-${leadId}`,
  };
}
