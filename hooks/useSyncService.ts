import { useState, useCallback } from 'react';
import { SyncService, SyncLog, FileStatistics, CampaignFileLink } from '@/lib/services/SyncService';

export interface UseSyncServiceReturn {
  // États
  isLoading: boolean;
  error: string | null;
  
  // Actions
  manualSyncFile: (fileId: string, userId: string) => Promise<{ success: boolean; syncLog?: SyncLog; error?: string }>;
  getFileStatistics: (fileId: string) => Promise<{ success: boolean; data?: FileStatistics; error?: string }>;
  linkFileToCampaign: (fileId: string, campaignId: string) => Promise<{ success: boolean; link?: CampaignFileLink; error?: string }>;
  unlinkFileFromCampaign: (fileId: string, campaignId: string) => Promise<{ success: boolean; error?: string }>;
  getCampaignFiles: (campaignId: string) => Promise<{ success: boolean; files?: any[]; error?: string }>;
  getFileCampaigns: (fileId: string) => Promise<{ success: boolean; campaigns?: any[]; error?: string }>;
  getSyncLogs: (fileId?: string, limit?: number) => Promise<{ success: boolean; logs?: SyncLog[]; error?: string }>;
  
  // Réinitialiser l'erreur
  clearError: () => void;
}

export const useSyncService = (): UseSyncServiceReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<{ success: boolean; data?: T; error?: string }>,
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await operation();
      
      if (!result.success && result.error) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const manualSyncFile = useCallback(async (fileId: string, userId: string) => {
    return executeWithErrorHandling<SyncLog>(async () => {
      const result = await SyncService.manualSyncFile(fileId, userId);
      return {
        success: result.success,
        data: result.syncLog,
        error: result.error
      };
    });
  }, [executeWithErrorHandling]);

  const getFileStatistics = useCallback(async (fileId: string) => {
    return executeWithErrorHandling<FileStatistics>(async () => {
      const result = await SyncService.getFileStatistics(fileId);
      return {
        success: result.success,
        data: result.data,
        error: result.error
      };
    });
  }, [executeWithErrorHandling]);

  const linkFileToCampaign = useCallback(async (fileId: string, campaignId: string) => {
    return executeWithErrorHandling<CampaignFileLink>(async () => {
      const result = await SyncService.linkFileToCampaign(fileId, campaignId);
      return {
        success: result.success,
        data: result.link,
        error: result.error
      };
    });
  }, [executeWithErrorHandling]);

  const unlinkFileFromCampaign = useCallback(async (fileId: string, campaignId: string) => {
    return executeWithErrorHandling(async () => {
      const result = await SyncService.unlinkFileFromCampaign(fileId, campaignId);
      return {
        success: result.success,
        error: result.error
      };
    });
  }, [executeWithErrorHandling]);

  const getCampaignFiles = useCallback(async (campaignId: string) => {
    return executeWithErrorHandling(async () => {
      const result = await SyncService.getCampaignFiles(campaignId);
      return {
        success: result.success,
        data: result.files,
        error: result.error
      };
    });
  }, [executeWithErrorHandling]);

  const getFileCampaigns = useCallback(async (fileId: string) => {
    return executeWithErrorHandling(async () => {
      const result = await SyncService.getFileCampaigns(fileId);
      return {
        success: result.success,
        data: result.campaigns,
        error: result.error
      };
    });
  }, [executeWithErrorHandling]);

  const getSyncLogs = useCallback(async (fileId?: string, limit = 50) => {
    return executeWithErrorHandling<SyncLog[]>(async () => {
      const result = await SyncService.getSyncLogs(fileId, limit);
      return {
        success: result.success,
        data: result.logs,
        error: result.error
      };
    });
  }, [executeWithErrorHandling]);

  return {
    // États
    isLoading,
    error,
    
    // Actions
    manualSyncFile,
    getFileStatistics,
    linkFileToCampaign,
    unlinkFileFromCampaign,
    getCampaignFiles,
    getFileCampaigns,
    getSyncLogs,
    
    // Utilitaires
    clearError
  };
};
