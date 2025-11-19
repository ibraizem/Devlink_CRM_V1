import { supabase } from '../supabase/client';

export interface SyncLog {
  id: string;
  file_id: string;
  sync_type: 'manual' | 'automatic';
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  error_message?: string;
  created_at: string;
}

export interface FileStatistics {
  total_leads: number;
  leads_by_status: Record<string, number>;
  conversion_rate: number;
  last_sync: string;
  duplicates_found: number;
}

export interface CampaignFileLink {
  id: string;
  campaign_id: string;
  file_id: string;
  created_at: string;
}

export class SyncService {
  // Synchronisation manuelle d'un fichier
  static async manualSyncFile(fileId: string, userId: string): Promise<{ success: boolean; error?: string; syncLog?: SyncLog }> {
    try {
      const { data, error } = await supabase.rpc('manual_sync_file', {
        p_file_id: fileId,
        p_user_id: userId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, syncLog: data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Récupérer les statistiques d'un fichier
  static async getFileStatistics(fileId: string): Promise<{ success: boolean; data?: FileStatistics; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_file_statistics', {
        p_file_id: fileId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Lier un fichier à une campagne
  static async linkFileToCampaign(fileId: string, campaignId: string): Promise<{ success: boolean; error?: string; link?: CampaignFileLink }> {
    try {
      const { data, error } = await supabase
        .from('campaign_file_links')
        .insert({
          campaign_id: campaignId,
          file_id: fileId
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, link: data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Dissocier un fichier d'une campagne
  static async unlinkFileFromCampaign(fileId: string, campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('campaign_file_links')
        .delete()
        .eq('file_id', fileId)
        .eq('campaign_id', campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Récupérer les fichiers liés à une campagne
  static async getCampaignFiles(campaignId: string): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('campaign_file_links')
        .select(`
          *,
          fichiers_import (
            id,
            nom_fichier,
            type_fichier,
            taille_fichier,
            statut,
            created_at
          )
        `)
        .eq('campaign_id', campaignId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, files: data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Récupérer les campagnes liées à un fichier
  static async getFileCampaigns(fileId: string): Promise<{ success: boolean; campaigns?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('campaign_file_links')
        .select(`
          *,
          campaigns (
            id,
            nom,
            description,
            statut,
            created_at
          )
        `)
        .eq('file_id', fileId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, campaigns: data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // Récupérer les logs de synchronisation
  static async getSyncLogs(fileId?: string, limit = 50): Promise<{ success: boolean; logs?: SyncLog[]; error?: string }> {
    try {
      let query = supabase
        .from('sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fileId) {
        query = query.eq('file_id', fileId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, logs: data };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
