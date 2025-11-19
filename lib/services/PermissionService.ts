import { supabase } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/types/user';

export interface UserPermissions {
  canViewAllUsers: boolean;
  canManageTeams: boolean;
  canViewAllLeads: boolean;
  canAssignLeads: boolean;
  canManageCampaigns: boolean;
  canViewAllCampaigns: boolean;
  canImportFiles: boolean;
  canManageFiles: boolean;
}

export class PermissionService {
  /**
   * Récupère le rôle de l'utilisateur actuel
   */
  static async getCurrentUserRole(): Promise<UserRole | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !data) return null;
      return data.role as UserRole;
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error);
      return null;
    }
  }

  /**
   * Récupère les permissions basées sur le rôle
   */
  static getPermissionsByRole(role: UserRole): UserPermissions {
    switch (role) {
      case 'admin':
        return {
          canViewAllUsers: true,
          canManageTeams: true,
          canViewAllLeads: true,
          canAssignLeads: true,
          canManageCampaigns: true,
          canViewAllCampaigns: true,
          canImportFiles: true,
          canManageFiles: true,
        };

      case 'manager':
        return {
          canViewAllUsers: false, // Ne voit que les membres de ses équipes
          canManageTeams: true,   // Gère ses équipes
          canViewAllLeads: false, // Ne voit que les leads de ses équipes
          canAssignLeads: true,   // Peut assigner les leads à ses commerciaux
          canManageCampaigns: true, // Gère les campagnes de ses équipes
          canViewAllCampaigns: false, // Ne voit que les campagnes de ses équipes
          canImportFiles: true,
          canManageFiles: true,
        };

      case 'commercial':
        return {
          canViewAllUsers: false,
          canManageTeams: false,
          canViewAllLeads: false, // Ne voit que ses leads assignés
          canAssignLeads: false,
          canManageCampaigns: false,
          canViewAllCampaigns: false, // Ne voit que les campagnes où il a des leads
          canImportFiles: false,
          canManageFiles: false, // Ne voit que ses fichiers
        };

      default:
        return {
          canViewAllUsers: false,
          canManageTeams: false,
          canViewAllLeads: false,
          canAssignLeads: false,
          canManageCampaigns: false,
          canViewAllCampaigns: false,
          canImportFiles: false,
          canManageFiles: false,
        };
    }
  }

  /**
   * Vérifie si l'utilisateur actuel a une permission spécifique
   */
  static async checkPermission(permission: keyof UserPermissions): Promise<boolean> {
    const role = await this.getCurrentUserRole();
    if (!role) return false;

    const permissions = this.getPermissionsByRole(role);
    return permissions[permission];
  }

  /**
   * Récupère les équipes gérées par un manager
   */
  static async getManagedTeams(): Promise<string[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('teams')
        .select('id')
        .eq('leader_id', user.id);

      if (error || !data) return [];
      return data.map(team => team.id);
    } catch (error) {
      console.error('Erreur lors de la récupération des équipes gérées:', error);
      return [];
    }
  }

  /**
   * Vérifie si l'utilisateur peut accéder à une équipe spécifique
   */
  static async canAccessTeam(teamId: string): Promise<boolean> {
    try {
      const role = await this.getCurrentUserRole();
      if (!role) return false;

      // Admin peut accéder à toutes les équipes
      if (role === 'admin') return true;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Manager peut accéder à ses équipes
      if (role === 'manager') {
        const { data, error } = await supabase
          .from('teams')
          .select('leader_id')
          .eq('id', teamId)
          .single();

        if (error || !data) return false;
        return data.leader_id === user.id;
      }

      // Commercial peut accéder s'il est membre de l'équipe
      if (role === 'commercial') {
        const { data, error } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .single();

        return !error && !!data;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification d\'accès à l\'équipe:', error);
      return false;
    }
  }

  /**
   * Vérifie si l'utilisateur peut accéder à un lead spécifique
   */
  static async canAccessLead(leadId: string): Promise<boolean> {
    try {
      const role = await this.getCurrentUserRole();
      if (!role) return false;

      // Admin peut accéder à tous les leads
      if (role === 'admin') return true;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Commercial peut accéder à ses leads
      if (role === 'commercial') {
        const { data, error } = await supabase
          .from('leads')
          .select('agent_id')
          .eq('id', leadId)
          .single();

        if (error || !data) return false;
        return data.agent_id === user.id;
      }

      // Manager peut accéder aux leads de ses équipes
      if (role === 'manager') {
        const { data, error } = await supabase
          .from('leads')
          .select(`
            campaign_id,
            campaigns!inner(
              team_id,
              teams!inner(leader_id)
            )
          `)
          .eq('id', leadId)
          .single();

        if (error || !data) return false;
        // @ts-ignore - Supabase nested query structure
        return data.campaigns.teams.leader_id === user.id;
      }

      return false;
    } catch (error) {
      console.error('Erreur lors de la vérification d\'accès au lead:', error);
      return false;
    }
  }

  /**
   * Récupère les commerciaux qu'un manager peut assigner à des leads
   */
  static async getAssignableAgents(): Promise<string[]> {
    try {
      const role = await this.getCurrentUserRole();
      if (role !== 'manager') return [];

      const managedTeams = await this.getManagedTeams();
      if (managedTeams.length === 0) return [];

      const { data, error } = await supabase
        .from('team_members')
        .select('user_id')
        .in('team_id', managedTeams);

      if (error || !data) return [];
      return data.map(member => member.user_id);
    } catch (error) {
      console.error('Erreur lors de la récupération des agents assignables:', error);
      return [];
    }
  }
}
