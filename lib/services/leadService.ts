import { createClient } from '@/lib/utils/supabase/client';

const supabase = createClient();

export type LeadStatus = 'nouveau' | 'en_cours' | 'traite' | 'abandonne';

export interface LeadData {
  id: string;
  fichier_id: string;
  donnees: Record<string, any>;
  statut: LeadStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  fichier?: {
    id: string;
    nom: string;
    date_import: string;
    user_id: string;
  };
}

interface LeadStats {
  statut: LeadStatus;
  count: number;
}

interface FileStats {
  fichier_id: string;
  fichiers_import: { nom: string };
  count: number;
}

interface LeadQueryOptions {
  page?: number;
  pageSize?: number;
  filters?: Record<string, any>;
  sortBy?: { field: string; order: 'asc' | 'desc' };
}

export const leadService = {
  /**
   * Supprime un lead par son ID
   */
  async deleteLead(leadId: string): Promise<void> {
    const { error } = await supabase
      .from('fichier_donnees')
      .delete()
      .eq('id', leadId);

    if (error) {
      console.error('Erreur lors de la suppression du lead:', error);
      throw new Error('Erreur lors de la suppression du lead');
    }
  },

  /**
   * Récupère les leads à partir des fichiers sélectionnés
   */
  async getLeadsFromFiles(fileIds: string[], options: {
    page?: number;
    pageSize?: number;
    filters?: Record<string, any>;
    sortBy?: { field: string; order: 'asc' | 'desc' };
  } = {}): Promise<{ data: LeadData[]; count: number }> {
    const { page = 1, pageSize = 50, filters = {}, sortBy } = options;
    
    try {
      let query = supabase
        .from('fichier_donnees')
        .select('*, fichier:fichier_id(id, nom, date_import, user_id)', { count: 'exact' })
        .in('fichier_id', fileIds);

      // Appliquer les filtres
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (key === 'search') {
            // Recherche dans les données JSON
            query = query.or(`donnees->>${key}.ilike.%${value}%`);
          } else if (key.startsWith('donnees.')) {
            // Filtre sur un champ spécifique des données
            const field = key.replace('donnees.', '');
            query = query.or(`donnees->>${field}.ilike.%${value}%`);
          } else {
            // Filtre sur un champ standard
            query = query.eq(key, value);
          }
        }
      });

      // Trier les résultats
      if (sortBy) {
        if (sortBy.field.startsWith('donnees.')) {
          // Tri sur un champ des données JSON
          const field = sortBy.field.replace('donnees.', '');
          query = query.order(`donnees->>${field}`, { ascending: sortBy.order === 'asc' });
        } else {
          // Tri sur un champ standard
          query = query.order(sortBy.field, { ascending: sortBy.order === 'asc' });
        }
      } else {
        // Tri par défaut
        query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data?.map(lead => ({
          ...lead,
          fichier: lead.fichier ? {
            id: lead.fichier.id,
            nom: lead.fichier.nom,
            date_import: lead.fichier.date_import,
            user_id: lead.fichier.user_id
          } : undefined
        })) || [],
        count: count || 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des leads:', error);
      throw new Error('Erreur lors de la récupération des données des leads');
    }
  },

  /**
   * Met à jour le statut d'un lead
   */
  async updateLeadStatus(leadId: string, status: LeadData['statut']): Promise<void> {
    try {
      const { error } = await supabase
        .from('fichier_donnees')
        .update({ 
          statut: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du lead:', error);
      throw new Error('Erreur lors de la mise à jour du statut du lead');
    }
  },

  /**
   * Ajoute une note à un lead
   */
  async addNoteToLead(leadId: string, note: string): Promise<void> {
    try {
      // Récupérer les notes existantes
      const { data: existingLead, error: fetchError } = await supabase
        .from('fichier_donnees')
        .select('notes')
        .eq('id', leadId)
        .single();

      if (fetchError) throw fetchError;

      // Mettre à jour les notes
      const updatedNotes = existingLead?.notes
        ? `${existingLead.notes}\n${new Date().toISOString()}: ${note}`
        : `${new Date().toISOString()}: ${note}`;

      const { error } = await supabase
        .from('fichier_donnees')
        .update({ 
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la note:', error);
      throw new Error('Erreur lors de l\'ajout de la note');
    }
  },

  /**
   * Récupère les statistiques des leads
   */
  async getLeadStats(fileIds: string[]): Promise<{
    total: number;
    byStatus: Record<LeadStatus, number>;
    byFile: Record<string, { count: number; file: string }>;
  }> {
    try {
      // Vérifier si des fichiers sont sélectionnés
      if (fileIds.length === 0) {
        return {
          total: 0,
          byStatus: {
            nouveau: 0,
            en_cours: 0,
            traite: 0,
            abandonne: 0
          },
          byFile: {}
        };
      }

      // Compter le nombre total de leads
      const { count: total, error: countError } = await supabase
        .from('fichier_donnees')
        .select('*', { count: 'exact', head: true })
        .in('fichier_id', fileIds);

      if (countError) throw countError;

      // Compter les leads par statut
      const { data: statusData, error: statusError } = await supabase
        .from('fichier_donnees')
        .select('statut')
        .in('fichier_id', fileIds);

      if (statusError) throw statusError;

      // Compter manuellement les leads par statut
      const statusCounts = (statusData || []).reduce<Record<LeadStatus, number>>(
        (acc, { statut }) => {
          if (statut in acc) {
            acc[statut as LeadStatus]++;
          }
          return acc;
        },
        {
          nouveau: 0,
          en_cours: 0,
          traite: 0,
          abandonne: 0
        }
      );

      // Compter les leads par fichier
      const { data: fileData, error: fileError } = await supabase
        .from('fichier_donnees')
        .select('fichier_id, fichiers_import!inner(nom)')
        .in('fichier_id', fileIds);

      if (fileError) throw fileError;

      // Compter manuellement les leads par fichier
      const fileCounts = (fileData || []).reduce<Record<string, { count: number; file: string }>>(
        (acc, { fichier_id, fichiers_import }) => {
          if (!acc[fichier_id]) {
            acc[fichier_id] = {
              count: 0,
              file: (fichiers_import as any)?.nom || 'Inconnu'
            };
          }
          acc[fichier_id].count++;
          return acc;
        },
        {}
      );

      return {
        total: total || 0,
        byStatus: statusCounts,
        byFile: fileCounts
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new Error('Erreur lors de la récupération des statistiques');
    }
  },

  /**
   * Met à jour les données d'un lead
   */
  async updateLeadData(leadId: string, updates: Partial<LeadData>): Promise<LeadData> {
    try {
      const { data, error } = await supabase
        .from('fichier_donnees')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select('*, fichier:fichier_id(id, nom, date_import, user_id)')
        .single();

      if (error) throw error;

      return {
        ...data,
        fichier: data.fichier ? {
          id: data.fichier.id,
          nom: data.fichier.nom,
          date_import: data.fichier.date_import,
          user_id: data.fichier.user_id
        } : undefined
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du lead:', error);
      throw new Error('Erreur lors de la mise à jour du lead');
    }
  },

  /**
   * Met à jour le statut de plusieurs leads
   */
  async updateMultipleLeadsStatus(
    leadIds: string[], 
    status: LeadStatus,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < leadIds.length; i++) {
      try {
        await this.updateLeadStatus(leadIds[i], status);
        success++;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour du lead ${leadIds[i]}:`, error);
        failed++;
      }
      
      if (onProgress) {
        onProgress(i + 1, leadIds.length);
      }
    }

    return { success, failed };
  },

  /**
   * Supprime plusieurs leads
   */
  async deleteMultipleLeads(
    leadIds: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < leadIds.length; i++) {
      try {
        await this.deleteLead(leadIds[i]);
        success++;
      } catch (error) {
        console.error(`Erreur lors de la suppression du lead ${leadIds[i]}:`, error);
        failed++;
      }
      
      if (onProgress) {
        onProgress(i + 1, leadIds.length);
      }
    }

    return { success, failed };
  },

  /**
   * Attribue plusieurs leads à un utilisateur
   */
  async assignMultipleLeads(
    leadIds: string[],
    userId: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < leadIds.length; i++) {
      try {
        const { error } = await supabase
          .from('fichier_donnees')
          .update({ 
            donnees: supabase.rpc('jsonb_set', {
              target: 'donnees',
              path: '{assigned_to}',
              new_value: `"${userId}"`
            }),
            updated_at: new Date().toISOString()
          })
          .eq('id', leadIds[i]);

        if (error) throw error;
        success++;
      } catch (error) {
        console.error(`Erreur lors de l'attribution du lead ${leadIds[i]}:`, error);
        failed++;
      }
      
      if (onProgress) {
        onProgress(i + 1, leadIds.length);
      }
    }

    return { success, failed };
  },

  /**
   * Exporte les leads au format CSV
   */
  async exportLeadsToCsv(fileIds: string[], columns: string[]): Promise<Blob> {
    try {
      // Récupérer les données des leads
      const { data: leads, error } = await supabase
        .from('fichier_donnees')
        .select('*')
        .in('fichier_id', fileIds);

      if (error) throw error;

      // Préparer les données pour le CSV
      const headers = columns;
      const rows = leads.map(lead => {
        const row: Record<string, any> = {};
        columns.forEach(col => {
          if (col in lead) {
            row[col] = lead[col];
          } else if (lead.donnees && col in lead.donnees) {
            row[col] = lead.donnees[col];
          } else {
            row[col] = '';
          }
        });
        return row;
      });

      // Convertir en CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          headers.map(fieldName => 
            `"${String(row[fieldName] || '').replace(/"/g, '""')}"`
          ).join(',')
        )
      ].join('\n');

      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      console.error('Erreur lors de l\'export des leads:', error);
      throw new Error('Erreur lors de l\'export des leads');
    }
  }
};
