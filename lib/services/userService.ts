import { supabase } from '../supabase/client';

export const userService = {
  // Récupérer tous les utilisateurs (avec pagination)
  async getUsers(page = 1, pageSize = 10) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, count };
  },

  // Récupérer un utilisateur par son ID
  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour un utilisateur
  async updateUser(id: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Désactiver un utilisateur
  async deactivateUser(id: string) {
    return this.updateUser(id, { is_active: false });
  },

  // Réactiver un utilisateur
  async activateUser(id: string) {
    return this.updateUser(id, { is_active: true });
  },

  // Rechercher des utilisateurs
  async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.%${query}%,nom.ilike.%${query}%,prenom.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return data;
  },

  // Récupérer les équipes d'un utilisateur
  async getUserTeams(userId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        role,
        team:teams(*, leader:leader_id(id, nom, prenom, email))
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  },

  // Mettre à jour le mot de passe de l'utilisateur connecté
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  },

  // Envoyer un email de réinitialisation de mot de passe
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) throw error;
    return data;
  },

  // Mettre à jour le mot de passe après réinitialisation
  async updatePasswordAfterReset(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  },

  // Activités utilisateur
  async logActivity(userId: string, activityType: string, details: Record<string, any> = {}) {
    const payload: Record<string, any> = {
      user_id: userId,
      entity_type: 'user',
      entity_id: userId,
      action: activityType,
      metadata: details,
    };

    const { error } = await supabase
      .from('user_activities')
      .insert(payload);

    if (error) throw error;
    return { ok: true };
  },

  async getUserActivities(userId: string, limit = 10, page = 1) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  },

  async getRecentActivities(limit = 10) {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*, user:user_id(id, email, nom, prenom, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
};
