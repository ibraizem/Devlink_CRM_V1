import { supabase } from '@/lib/supabase/client';
import { Team, CreateTeamFormData, UpdateTeamFormData } from '@/lib/types/teams';
import { PermissionService } from './PermissionService';

export const teamService = {
  // Récupérer toutes les équipes avec leurs membres et leader
  async getAllTeams() {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        leader:leader_id (id, nom, prenom, email, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Récupérer les membres séparément pour éviter la récursion
    const teamsWithMembers = await Promise.all(
      data.map(async (team) => {
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select(`
            id, role, team_id,
            user:user_id (id, nom, prenom, email, avatar_url)
          `)
          .eq('team_id', team.id);

        return {
          ...team,
          members: members || []
        };
      })
    );

    return teamsWithMembers as Team[];
  },

  // Récupérer une équipe par son ID
  async getTeamById(id: string) {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        leader:leader_id (id, nom, prenom, email, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Récupérer les membres séparément
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id, role, team_id,
        user:user_id (id, nom, prenom, email, avatar_url)
      `)
      .eq('team_id', id);

    return {
      ...data,
      members: members || []
    } as Team;
  },

  // Créer une nouvelle équipe
  async createTeam(teamData: CreateTeamFormData) {
    // Vérifier les permissions
    const canManageTeams = await PermissionService.checkPermission('canManageTeams');
    if (!canManageTeams) {
      throw new Error('Vous n\'avez pas les permissions pour créer une équipe');
    }

    // Récupérer l'utilisateur actuel pour created_by
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    const { data, error } = await supabase
      .from('teams')
      .insert([{
        name: teamData.name,
        description: teamData.description,
        leader_id: teamData.leader_id,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Team;
  },

  // Mettre à jour une équipe
  async updateTeam({ id, ...updates }: UpdateTeamFormData) {
    // Vérifier les permissions
    const canAccess = await PermissionService.canAccessTeam(id);
    if (!canAccess) {
      throw new Error('Vous n\'avez pas les permissions pour modifier cette équipe');
    }

    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Team;
  },

  // Supprimer une équipe
  async deleteTeam(id: string) {
    // Vérifier les permissions
    const canAccess = await PermissionService.canAccessTeam(id);
    if (!canAccess) {
      throw new Error('Vous n\'avez pas les permissions pour supprimer cette équipe');
    }

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Ajouter un membre à une équipe
  async addTeamMember(teamId: string, userId: string, role: string = 'member') {
    // Vérifier les permissions
    const canAccess = await PermissionService.canAccessTeam(teamId);
    if (!canAccess) {
      throw new Error('Vous n\'avez pas les permissions pour modifier cette équipe');
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert([
        { team_id: teamId, user_id: userId, role }
      ]);

    if (error) throw error;
    return data;
  },

  // Retirer un membre d'une équipe
  async removeTeamMember(teamId: string, userId: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  },

  // Mettre à jour le rôle d'un membre
  async updateTeamMemberRole(teamId: string, userId: string, role: string) {
    const { data, error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
