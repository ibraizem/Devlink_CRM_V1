import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface CampaignProgress {
  totalLeads: number;
  contactedLeads: number;
  progress: number;
  loading: boolean;
  error: string | null;
}

export function useCampaignProgress(campaignId: string | null) {
  const [data, setData] = useState<CampaignProgress>({
    totalLeads: 0,
    contactedLeads: 0,
    progress: 0,
    loading: false,
    error: null,
  });

  const setLoading = (loading: boolean) => setData(prev => ({ ...prev, loading }));
  const setError = (error: string | null) => setData(prev => ({ ...prev, error }));
  const setProgress = (progress: CampaignProgress) => setData(progress);

  const fetchProgress = useCallback(async (campaignId: string) => {
    if (!campaignId) return;

    setLoading(true);
    setError(null);

    try {
      // Essayer d'abord avec la fonction RPC optimisée
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_campaign_progress', { p_campaign_id: campaignId });

      if (rpcError) {
        console.error('Erreur RPC:', rpcError);
        
        // Fallback: utiliser les requêtes directes si RPC pas encore disponible
        // Compter tous les leads de la campagne (y compris ceux des fichiers)
        const { count: totalLeads, error: totalError } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId);

        if (totalError) throw totalError;

        // Compter les leads contactés (rdv_planifie, rdv_ok, a_replanifier)
        const { count: contactedLeads, error: contactedError } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignId)
          .in('statut', ['rdv_planifie', 'rdv_ok', 'a_replanifier']);

        if (contactedError) throw contactedError;

        const total = totalLeads || 0;
        const contacted = contactedLeads || 0;
        const progress = total > 0 ? Math.round((contacted / total) * 100) : 0;

        setProgress({
          totalLeads: total,
          contactedLeads: contacted,
          progress,
          loading: false,
          error: null
        });
      } else {
        // Utiliser les données du RPC
        const rpcResult = rpcData?.[0];
        if (rpcResult) {
          setProgress({
            totalLeads: rpcResult.total_leads || 0,
            contactedLeads: rpcResult.contacted_leads || 0,
            progress: Number(rpcResult.progress_percentage) || 0,
            loading: false,
            error: null
          });
        } else {
          // Aucune donnée retournée
          setProgress({
            totalLeads: 0,
            contactedLeads: 0,
            progress: 0,
            loading: false,
            error: null
          });
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la progression:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      setProgress({
        totalLeads: 0,
        contactedLeads: 0,
        progress: 0,
        loading: false,
        error: errorMessage
      });
    }
  }, []);

  useEffect(() => {
    if (!campaignId) return;

    fetchProgress(campaignId);
  }, [campaignId, fetchProgress]);

  return data;
}
