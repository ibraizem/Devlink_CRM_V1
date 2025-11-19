import { supabase } from '../supabase/client';
import { Campaign, CampaignFile, TeamCampaign, CreateCampaignData, UpdateCampaignData, CampaignFilters } from '@/lib/types/campaign';
import { PermissionService } from './PermissionService';

export const campaignService = {
  // Récupérer toutes les campagnes (avec pagination et filtres)
  async getCampaigns(page = 1, pageSize = 10, filters: CampaignFilters = {}) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.team_id) {
      query = query.eq('team_id', filters.team_id);
    }
    if (filters.start_date_from && filters.start_date_to) {
      query = query.gte('start_date', filters.start_date_from).lte('start_date', filters.start_date_to);
    }

    const { data, count, error } = await query.range(from, to);
    
    if (error) throw error;
    return { data, count };
  },

  // Récupérer une campagne par son ID
  async getCampaignById(id: string) {
    console.log('🔍 Service - Recherche campagne ID:', id);
    
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Service - Utilisateur authentifié:', user?.id);
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    console.log('📊 Service - Résultat:', { data, error });
    if (error) {
      console.error('❌ Service - Erreur Supabase:', error);
      throw error;
    }
    return data as Campaign;
  },

  // Créer une nouvelle campagne
  async createCampaign(campaignData: CreateCampaignData) {
    // Vérifier les permissions
    const canManageCampaigns = await PermissionService.checkPermission('canManageCampaigns');
    if (!canManageCampaigns) {
      throw new Error('Vous n\'avez pas les permissions pour créer une campagne');
    }

    // Vérifier si le nom de campagne existe déjà pour cet utilisateur
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: existingCampaign, error: checkError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('name', campaignData.name)
        .eq('created_by', user.id)
        .single();

      if (!checkError && existingCampaign) {
        const timestamp = new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(/[/:]/g, '-');
        
        const alternativeName = `${campaignData.name} - ${timestamp}`;
        
        throw new Error(`Le nom "${campaignData.name}" est déjà utilisé. Suggestion: "${alternativeName}"`);
      }
    }

    // Ne pas envoyer created_by/created_at/updated_at: triggers DB les gèrent.
    // Éviter d'envoyer team_id directement si l'association se fait via team_campaigns.
    const { team_id, ...campaignCore } = campaignData;

    const { data, error } = await supabase
      .from('campaigns')
      .insert([{
        ...campaignCore,
        status: campaignCore.status || 'draft',
        files: campaignCore.files || [],
      }])
      .select()
      .single();

    if (error) throw error;

    const created = data as Campaign;

    // Si un team_id est fourni, créer le lien dans team_campaigns
    if (team_id) {
      try {
        await supabase
          .from('team_campaigns')
          .insert([{ team_id, campaign_id: created.id, assigned_at: new Date().toISOString() }]);
      } catch (_) {
        // Ne bloque pas la création de campagne si l'assignation échoue
      }
    }

    return created;
  },

  // Mettre à jour une campagne
  async updateCampaign(updates: UpdateCampaignData) {
    const { id, ...updateData } = updates;
    
    const { data, error } = await supabase
      .from('campaigns')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
        files: updateData.files || []
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  // Supprimer une campagne
  async deleteCampaign(id: string) {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Gestion des fichiers de campagne
  async addCampaignFile(fileData: Omit<CampaignFile, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('campaign_files')
      .insert([{
        ...fileData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data as CampaignFile;
  },

  // Récupérer les fichiers d'une campagne
  async getCampaignFiles(campaignId: string) {
    const { data, error } = await supabase
      .from('campaign_files')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CampaignFile[];
  },

  // Supprimer un fichier de campagne
  async deleteCampaignFile(fileId: string) {
    const { error } = await supabase
      .from('campaign_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
    return true;
  },

  // Gestion des équipes associées aux campagnes
  async assignCampaignToTeam(teamId: string, campaignId: string) {
    const { data, error } = await supabase
      .from('team_campaigns')
      .insert([{
        team_id: teamId,
        campaign_id: campaignId,
        assigned_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data as TeamCampaign;
  },

  // Récupérer les campagnes d'une équipe
  async getTeamCampaigns(teamId: string) {
    const { data, error } = await supabase
      .from('team_campaigns')
      .select('campaigns(*)')
      .eq('team_id', teamId);

    if (error) throw error;
    return (data as unknown as { campaigns: Campaign }[]).map(item => item.campaigns);
  },

  // Récupérer les équipes d'une campagne
  async getCampaignTeams(campaignId: string) {
    const { data, error } = await supabase
      .from('team_campaigns')
      .select('teams(*)')
      .eq('campaign_id', campaignId);

    if (error) throw error;
    return data.map(item => item.teams);
  },

  // Mettre à jour le statut d'une campagne
  async updateCampaignStatus(campaignId: string, status: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  // Mettre à jour le progrès d'une campagne
  async updateCampaignProgress(campaignId: string, progress: number) {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ 
        progress,
        updated_at: new Date().toISOString() 
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  // Cloner une campagne
  async cloneCampaign(campaignId: string, newName?: string) {
    // Récupérer la campagne originale
    const originalCampaign = await this.getCampaignById(campaignId);
    
    const cloneData = {
      name: newName || `${originalCampaign.name} (Copie)`,
      description: originalCampaign.description || undefined,
      status: 'draft' as const,
      start_date: originalCampaign.start_date,
      end_date: originalCampaign.end_date,
      budget: originalCampaign.budget,
      target_audience: originalCampaign.target_audience,
      created_by: originalCampaign.created_by,
      team_id: originalCampaign.team_id,
      total_leads: 0,
      converted_leads: 0,
      progress: 0,
      channels: originalCampaign.channels || [],
      files: originalCampaign.files || [],
      file_name: originalCampaign.file_name,
    };

    return await this.createCampaign(cloneData);
  },

  // Exporter une campagne en CSV
  exportCampaignToCSV(campaign: Campaign): string {
    const rows = [{
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      start_date: campaign.start_date ?? '',
      end_date: campaign.end_date ?? '',
      budget: campaign.budget ?? '',
      total_leads: campaign.total_leads ?? 0,
      converted_leads: campaign.converted_leads ?? 0,
      progress: campaign.progress ?? 0,
      channels: (campaign.channels ?? []).join('|'),
      created_at: campaign.created_at ?? '',
      updated_at: campaign.updated_at ?? '',
    }];
    
    return [
      Object.keys(rows[0]).join(','),
      ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
  },

  // Obtenir les statistiques d'une campagne
  async getCampaignStats(campaignId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error) throw error;

    const campaign = data as Campaign;
    const conversionRate = campaign.total_leads > 0 
      ? Math.round((campaign.converted_leads / campaign.total_leads) * 100) 
      : 0;

    return {
      totalLeads: campaign.total_leads || 0,
      convertedLeads: campaign.converted_leads || 0,
      conversionRate,
      progress: campaign.progress || 0,
      budget: campaign.budget || 0,
      status: campaign.status,
      channels: campaign.channels || [],
      teamId: campaign.team_id,
    };
  },

  // Mettre à jour plusieurs campagnes en lot
  async bulkUpdateCampaigns(updates: Array<{ id: string; data: Partial<CreateCampaignData> & { total_leads?: number; converted_leads?: number; progress?: number } }>) {
    const results = [];
    
    for (const update of updates) {
      try {
        const result = await this.updateCampaign({ id: update.id, ...update.data });
        results.push({ success: true, id: update.id, data: result });
      } catch (error) {
        results.push({ success: false, id: update.id, error: error as Error });
      }
    }
    
    return results;
  },

  // Archiver une campagne
  async archiveCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString() 
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  // Réactiver une campagne archivée
  async reactivateCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ 
        status: 'draft',
        updated_at: new Date().toISOString() 
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return data as Campaign;
  },

  // Obtenir les campagnes par période
  async getCampaignsByPeriod(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data as Campaign[];
  },

  // Synchroniser les fichiers d'une campagne (toutes les tables)
  async syncCampaignFilesComplete(campaignId: string, fileIds: string[]) {
    // 1. Mettre à jour campaign_file_links
    await this.syncCampaignFiles(campaignId, fileIds);
    
    // 2. Mettre à jour campaign_files avec les objets fichiers complets
    if (fileIds.length > 0) {
      // Récupérer les objets fichiers depuis la table fichiers_import
      const { data: fileObjects, error: fetchError } = await supabase
        .from('fichiers_import')
        .select('*')
        .in('id', fileIds);
        
      if (fetchError) throw fetchError;
      
      if (fileObjects && fileObjects.length > 0) {
        // Supprimer les anciens enregistrements
        await supabase
          .from('campaign_files')
          .delete()
          .eq('campaign_id', campaignId);
          
        // Ajouter les nouveaux enregistrements
        const campaignFilesToAdd = fileObjects.map(file => ({
          name: file.nom || file.original_filename || 'Fichier sans nom',
          file_url: file.chemin || '',
          file_type: file.type || file.mime_type || 'unknown',
          file_size: file.taille || 0,
          campaign_id: campaignId,
          uploaded_by: file.user_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString() // Ajouté pour correspondre au schéma
        }));
        
        const { data, error } = await supabase
          .from('campaign_files')
          .insert(campaignFilesToAdd)
          .select();
          
        if (error) throw error;
        return data;
      }
    }
    
    return [];
  },

  // Synchroniser les fichiers d'une campagne
  async syncCampaignFiles(campaignId: string, fileIds: string[]) {
    // Supprimer les liens existants
    await supabase
      .from('campaign_file_links')
      .delete()
      .eq('campaign_id', campaignId);

    // Ajouter les nouveaux liens
    const linksToAdd = fileIds.map(fileId => ({
      campaign_id: campaignId,
      fichier_id: fileId,
      created_at: new Date().toISOString()
    }));

    if (linksToAdd.length > 0) {
      const { data, error } = await supabase
        .from('campaign_file_links')
        .insert(linksToAdd)
        .select();

      if (error) throw error;
      return data;
    }

    return [];
  },

  // Gestion avancée des équipes et campagnes
  async assignCampaignToTeams(campaignId: string, teamIds: string[]) {
    // Supprimer les assignations existantes
    await supabase
      .from('team_campaigns')
      .delete()
      .eq('campaign_id', campaignId);

    // Ajouter les nouvelles assignations
    const assignments = teamIds.map(teamId => ({
      team_id: teamId,
      campaign_id: campaignId,
      assigned_at: new Date().toISOString()
    }));

    if (assignments.length > 0) {
      const { data, error } = await supabase
        .from('team_campaigns')
        .insert(assignments)
        .select('*, teams(*), campaigns(*)');

      if (error) throw error;
      return data;
    }

    return [];
  },

  // Obtenir les campagnes avec leurs équipes
  async getCampaignsWithTeams(page = 1, pageSize = 10, filters: CampaignFilters = {}) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        team_campaigns!left(
          teams(*)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.team_id) {
      query = query.eq('team_id', filters.team_id);
    }

    const { data, count, error } = await query.range(from, to);
    
    if (error) throw error;
    
    // Formater les données pour inclure les équipes
    const formattedData = data?.map(campaign => ({
      ...campaign,
      teams: campaign.team_campaigns?.map((tc: any) => tc.teams).filter(Boolean) || []
    })) || [];

    return { data: formattedData, count };
  },

  // Obtenir les membres des équipes assignées à une campagne
  async getCampaignTeamMembers(campaignId: string) {
    const { data, error } = await supabase
      .from('team_campaigns')
      .select(`
        teams(
          team_members(
            users_profile(*)
          )
        )
      `)
      .eq('campaign_id', campaignId);

    if (error) throw error;
    
    // Extraire tous les membres de toutes les équipes
    const members = data?.flatMap((tc: any) => 
      tc.teams?.team_members?.map((tm: any) => tm.users_profile).filter(Boolean) || []
    ) || [];

    return members;
  },

  // Mettre à jour une campagne avec ses équipes
  async updateCampaignWithTeams(campaignId: string, campaignData: Partial<Campaign>, teamIds?: string[]) {
    // Filtrer les données pour ne garder que les champs valides pour UpdateCampaignData
    const validUpdateData: UpdateCampaignData = {
      id: campaignId,
      name: campaignData.name,
      description: campaignData.description || undefined,
      status: campaignData.status,
      start_date: campaignData.start_date,
      end_date: campaignData.end_date,
      budget: campaignData.budget,
      target_audience: campaignData.target_audience,
      team_id: campaignData.team_id,
      channels: campaignData.channels,
      total_leads: campaignData.total_leads,
      converted_leads: campaignData.converted_leads,
      progress: campaignData.progress || undefined,
    };

    // Mettre à jour la campagne
    const updatedCampaign = await this.updateCampaign(validUpdateData);

    // Mettre à jour les équipes si spécifiées
    if (teamIds !== undefined) {
      await this.assignCampaignToTeams(campaignId, teamIds);
    }

    return updatedCampaign;
  },

  // Obtenir les statistiques par équipe pour une campagne
  async getCampaignTeamStats(campaignId: string) {
    const { data, error } = await supabase
      .from('team_campaigns')
      .select(`
        teams(*),
        campaigns(*)
      `)
      .eq('campaign_id', campaignId);

    if (error) throw error;

    return data?.map((tc: any) => ({
      team: tc.teams,
      campaign: tc.campaigns,
      // Ajouter des statistiques spécifiques par équipe si nécessaire
      teamLeadCount: 0, // À implémenter avec les leads par équipe
      teamConversionRate: 0 // À implémenter avec les conversions par équipe
    })) || [];
  },

  // Gestion avancée des fichiers dans les campagnes

  async addFilesToCampaign(campaignId: string, fileIds: string[]) {
    if (fileIds.length === 0) return [];

    // Récupérer les objets fichiers depuis la table fichiers_import
    const { data: fileObjects, error: fetchError } = await supabase
      .from('fichiers_import')
      .select('*')
      .in('id', fileIds);
    
    if (fetchError) throw fetchError;
    
    if (!fileObjects || fileObjects.length === 0) return [];

    // Ajouter les enregistrements dans campaign_files avec tous les champs nécessaires
    const filesToAdd = fileObjects.map(file => ({
      name: file.nom || file.original_filename || 'Fichier sans nom',
      file_url: file.chemin || '',
      file_type: file.type || file.mime_type || 'unknown',
      file_size: file.taille || 0,
      campaign_id: campaignId,
      uploaded_by: file.user_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('campaign_files')
      .insert(filesToAdd)
      .select();

    if (error) throw error;
    return data;
  },

  async removeFileFromCampaign(campaignId: string, fileId: string) {
    // D'abord, trouver l'enregistrement dans campaign_files correspondant au fichier
    const { data: campaignFile, error: findError } = await supabase
      .from('campaign_files')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('file_url', fileId) // Utiliser file_url comme identifiant unique
      .single();

    if (findError && findError.code !== 'PGRST116') { // Ignorer l'erreur "not found"
      throw findError;
    }

    if (campaignFile) {
      // Supprimer l'enregistrement de campaign_files
      const { error } = await supabase
        .from('campaign_files')
        .delete()
        .eq('id', campaignFile.id);

      if (error) throw error;
    }

    // Supprimer aussi le lien dans campaign_file_links
    const { error: linkError } = await supabase
      .from('campaign_file_links')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('fichier_id', fileId);

    if (linkError) throw linkError;
    
    return true;
  },

  async updateCampaignFiles(campaignId: string, fileIds: string[]) {
    // Supprimer tous les fichiers existants
    await supabase
      .from('campaign_files')
      .delete()
      .eq('campaign_id', campaignId);

    // Ajouter les nouveaux fichiers
    return await this.addFilesToCampaign(campaignId, fileIds);
  },

  async getCampaignsWithFiles(page = 1, pageSize = 10, filters: CampaignFilters = {}) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        campaign_files!left(
          fichiers(*)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, count, error } = await query.range(from, to);
    
    if (error) throw error;
    
    // Formater les données pour inclure les fichiers
    const formattedData = data?.map(campaign => ({
      ...campaign,
      files: campaign.campaign_files?.map((cf: any) => cf.fichiers).filter(Boolean) || []
    })) || [];

    return { data: formattedData, count };
  },

  async getCampaignFileStats(campaignId: string) {
    const { data, error } = await supabase
      .from('campaign_files')
      .select(`
        *,
        fichiers(*)
      `)
      .eq('campaign_id', campaignId);

    if (error) throw error;

    const files = data?.map((cf: any) => cf.fichiers).filter(Boolean) || [];
    
    return {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
      fileTypes: files.reduce((acc, file) => {
        const type = file.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentFiles: files.slice(0, 5)
    };
  },

  async duplicateCampaignFiles(sourceCampaignId: string, targetCampaignId: string) {
    // Récupérer les fichiers de la campagne source avec tous les détails
    const { data: sourceFiles, error } = await supabase
      .from('campaign_files')
      .select('*')
      .eq('campaign_id', sourceCampaignId);

    if (error) throw error;
    
    if (!sourceFiles || sourceFiles.length === 0) return [];
    
    // Dupliquer les fichiers vers la campagne cible
    const filesToAdd = sourceFiles.map(file => ({
      name: file.name,
      file_url: file.file_url,
      file_type: file.file_type,
      file_size: file.file_size,
      campaign_id: targetCampaignId,
      uploaded_by: file.uploaded_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data: newFiles, error: insertError } = await supabase
      .from('campaign_files')
      .insert(filesToAdd)
      .select();

    if (insertError) throw insertError;
    
    return newFiles || [];
  }
};
