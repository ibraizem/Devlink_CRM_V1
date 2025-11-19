'use client';

import { useState, useCallback } from 'react';
import { campaignService } from '@/lib/services/campaignService';
import { Campaign, CampaignFilters, CampaignFile, CreateCampaignData, UpdateCampaignData } from '@/lib/types/campaign';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Récupérer les campagnes avec pagination et filtres
  const fetchCampaigns = useCallback(async (page = 1, pageSize = 10, filters: CampaignFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await campaignService.getCampaigns(page, pageSize, filters);
      setCampaigns(data || []);
      setTotalCount(count || 0);
      return { data, count };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer une campagne par son ID
  const fetchCampaignById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getCampaignById(id);
      setCurrentCampaign(data);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer une nouvelle campagne
  const createCampaign = useCallback(async (campaignData: CreateCampaignData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.createCampaign(campaignData);
      setCampaigns(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour une campagne
  const updateCampaign = useCallback(async (updates: UpdateCampaignData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.updateCampaign(updates);
      setCampaigns(prev => 
        prev.map(camp => camp.id === updates.id ? { ...camp, ...data } : camp)
      );
      if (currentCampaign?.id === updates.id) {
        setCurrentCampaign(prev => prev ? { ...prev, ...data } : null);
      }
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Supprimer une campagne
  const deleteCampaign = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await campaignService.deleteCampaign(id);
      setCampaigns(prev => prev.filter(camp => camp.id !== id));
      if (currentCampaign?.id === id) {
        setCurrentCampaign(null);
      }
      return true;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Gestion des fichiers de campagne
  const addFileToCampaign = useCallback(async (fileData: Omit<CampaignFile, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.addCampaignFile(fileData);
      // Mettre à jour la campagne actuelle avec le nouveau fichier
      if (currentCampaign) {
        const updatedFiles = [...(currentCampaign.files || []), data];
        setCurrentCampaign({
          ...currentCampaign,
          files: updatedFiles as CampaignFile[]
        });
      }
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Supprimer un fichier de campagne
  const deleteCampaignFile = useCallback(async (fileId: string) => {
    setLoading(true);
    setError(null);
    try {
      await campaignService.deleteCampaignFile(fileId);
      // Mettre à jour la campagne actuelle en supprimant le fichier
      if (currentCampaign) {
        const updatedFiles = (currentCampaign.files || []).filter(file => file.id !== fileId);
        setCurrentCampaign({
          ...currentCampaign,
          files: updatedFiles as CampaignFile[]
        });
      }
      return true;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Mettre à jour le statut d'une campagne
  const updateStatus = useCallback(async (campaignId: string, status: Campaign['status']) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.updateCampaignStatus(campaignId, status);
      setCampaigns(prev => 
        prev.map(camp => camp.id === campaignId ? { ...camp, ...data } : camp)
      );
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(prev => prev ? { ...prev, ...data } : null);
      }
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Mettre à jour le progrès d'une campagne
  const updateProgress = useCallback(async (campaignId: string, progress: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.updateCampaignProgress(campaignId, progress);
      setCampaigns(prev => 
        prev.map(camp => camp.id === campaignId ? { ...camp, ...data } : camp)
      );
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(prev => prev ? { ...prev, ...data } : null);
      }
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Cloner une campagne
  const cloneCampaign = useCallback(async (campaignId: string, newName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.cloneCampaign(campaignId, newName);
      setCampaigns(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Exporter une campagne en CSV
  const exportCampaignToCSV = useCallback((campaign: Campaign) => {
    try {
      const csv = campaignService.exportCampaignToCSV(campaign);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${campaign.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Obtenir les statistiques d'une campagne
  const getCampaignStats = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const stats = await campaignService.getCampaignStats(campaignId);
      return stats;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour plusieurs campagnes en lot
  const bulkUpdateCampaigns = useCallback(async (updates: Array<{ id: string; data: Partial<CreateCampaignData> & { total_leads?: number; converted_leads?: number; progress?: number } }>) => {
    setLoading(true);
    setError(null);
    try {
      const results = await campaignService.bulkUpdateCampaigns(updates);
      
      // Mettre à jour le state local pour les campagnes mises à jour avec succès
      const successfulUpdates = results.filter(r => r.success);
      if (successfulUpdates.length > 0) {
        setCampaigns(prev => 
          prev.map(camp => {
            const update = successfulUpdates.find(u => u.id === camp.id);
            return update ? { ...camp, ...update.data } : camp;
          })
        );
      }
      
      return results;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Archiver une campagne
  const archiveCampaign = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.archiveCampaign(campaignId);
      setCampaigns(prev => 
        prev.map(camp => camp.id === campaignId ? { ...camp, ...data } : camp)
      );
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(prev => prev ? { ...prev, ...data } : null);
      }
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Réactiver une campagne archivée
  const reactivateCampaign = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.reactivateCampaign(campaignId);
      setCampaigns(prev => 
        prev.map(camp => camp.id === campaignId ? { ...camp, ...data } : camp)
      );
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(prev => prev ? { ...prev, ...data } : null);
      }
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Obtenir les campagnes par période
  const getCampaignsByPeriod = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getCampaignsByPeriod(startDate, endDate);
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Synchroniser les fichiers d'une campagne (toutes les tables)
  const syncCampaignFilesComplete = useCallback(async (campaignId: string, fileIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const files = await campaignService.syncCampaignFilesComplete(campaignId, fileIds);
      
      // Mettre à jour la campagne actuelle avec les nouveaux fichiers
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(prev => prev ? { ...prev, files } : null);
      }
      
      return files;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Synchroniser les fichiers d'une campagne
  const syncCampaignFiles = useCallback(async (campaignId: string, fileIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const files = await campaignService.syncCampaignFiles(campaignId, fileIds);
      
      // Mettre à jour la campagne actuelle avec les nouveaux fichiers
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(prev => prev ? { ...prev, files } : null);
      }
      
      return files;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Assigner des équipes à une campagne
  const assignTeamsToCampaign = useCallback(async (campaignId: string, teamIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const assignments = await campaignService.assignCampaignToTeams(campaignId, teamIds);
      
      // Mettre à jour la campagne actuelle avec les nouvelles équipes
      if (currentCampaign?.id === campaignId) {
        const teams = assignments.map((a: any) => a.teams).filter(Boolean);
        setCurrentCampaign(prev => prev ? { ...prev, teams } : null);
      }
      
      return assignments;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Obtenir les campagnes avec leurs équipes
  const fetchCampaignsWithTeams = useCallback(async (page = 1, pageSize = 10, filters: CampaignFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await campaignService.getCampaignsWithTeams(page, pageSize, filters);
      setCampaigns(data || []);
      setTotalCount(count || 0);
      return { data, count };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir les membres des équipes d'une campagne
  const getCampaignTeamMembers = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const members = await campaignService.getCampaignTeamMembers(campaignId);
      return members;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour une campagne avec ses équipes
  const updateCampaignWithTeams = useCallback(async (campaignId: string, campaignData: Partial<Campaign>, teamIds?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const updatedCampaign = await campaignService.updateCampaignWithTeams(campaignId, campaignData, teamIds);
      
      // Mettre à jour le state local
      setCampaigns(prev => 
        prev.map(camp => camp.id === campaignId ? { ...camp, ...updatedCampaign } : camp)
      );
      
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(prev => prev ? { ...prev, ...updatedCampaign } : null);
      }
      
      return updatedCampaign;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Obtenir les statistiques par équipe pour une campagne
  const getCampaignTeamStats = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const stats = await campaignService.getCampaignTeamStats(campaignId);
      return stats;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Gestion avancée des fichiers
  const getCampaignFiles = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const files = await campaignService.getCampaignFiles(campaignId);
      return files;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addFilesToCampaign = useCallback(async (campaignId: string, fileIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const files = await campaignService.addFilesToCampaign(campaignId, fileIds);
      
      // Mettre à jour la campagne actuelle avec les nouveaux fichiers
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(prev => prev ? { ...prev, files } : null);
      }
      
      return files;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  const removeFileFromCampaign = useCallback(async (campaignId: string, fileId: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await campaignService.removeFileFromCampaign(campaignId, fileId);
      
      if (success && currentCampaign?.id === campaignId) {
        const updatedFiles = currentCampaign.files?.filter(file => file.id !== fileId) || [];
        setCurrentCampaign(prev => prev ? { ...prev, files: updatedFiles } : null);
      }
      
      return success;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  const updateCampaignFiles = useCallback(async (campaignId: string, fileIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const files = await campaignService.updateCampaignFiles(campaignId, fileIds);
      
      // Mettre à jour la campagne actuelle avec les nouveaux fichiers
      if (currentCampaign?.id === campaignId) {
        setCurrentCampaign(prev => prev ? { ...prev, files } : null);
      }
      
      return files;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  const fetchCampaignsWithFiles = useCallback(async (page = 1, pageSize = 10, filters: CampaignFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await campaignService.getCampaignsWithFiles(page, pageSize, filters);
      setCampaigns(data || []);
      setTotalCount(count || 0);
      return { data, count };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCampaignFileStats = useCallback(async (campaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const stats = await campaignService.getCampaignFileStats(campaignId);
      return stats;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const duplicateCampaignFiles = useCallback(async (sourceCampaignId: string, targetCampaignId: string) => {
    setLoading(true);
    setError(null);
    try {
      const files = await campaignService.duplicateCampaignFiles(sourceCampaignId, targetCampaignId);
      
      // Mettre à jour la campagne cible si c'est la campagne actuelle
      if (currentCampaign?.id === targetCampaignId) {
        setCurrentCampaign(prev => prev ? { ...prev, files } : null);
      }
      
      return files;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentCampaign]);

  // Réinitialiser la campagne actuelle
  const resetCurrentCampaign = useCallback(() => {
    setCurrentCampaign(null);
  }, []);

  return {
    campaigns,
    currentCampaign,
    loading,
    error,
    totalCount,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    fetchCampaignById,
    cloneCampaign,
    exportCampaignToCSV,
    getCampaignStats,
    bulkUpdateCampaigns,
    archiveCampaign,
    reactivateCampaign,
    getCampaignsByPeriod,
    syncCampaignFiles,
    syncCampaignFilesComplete,
    fetchCampaignsWithTeams,
    assignTeamsToCampaign,
    getCampaignTeamMembers,
    updateCampaignWithTeams,
    getCampaignTeamStats,
    getCampaignFiles,
    addFilesToCampaign,
    removeFileFromCampaign,
    updateCampaignFiles,
    fetchCampaignsWithFiles,
    getCampaignFileStats,
    duplicateCampaignFiles,
    deleteCampaignFile,
    setCurrentCampaign,
    resetCurrentCampaign,
    refetch: fetchCampaigns
  };
}
