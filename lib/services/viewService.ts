import { createClient } from '@/lib/utils/supabase/client';
import { LeadViewConfig, ViewTemplate, ColumnConfig, ViewFilter, ViewSort } from '@/types/leads';

const supabase = createClient();

export const viewService = {
  async createView(view: Omit<LeadViewConfig, 'id' | 'created_at' | 'updated_at'>): Promise<LeadViewConfig> {
    const { data, error } = await supabase
      .from('lead_views')
      .insert({
        name: view.name,
        description: view.description,
        user_id: view.user_id,
        is_template: view.is_template || false,
        template_type: view.template_type,
        is_shared: view.is_shared || false,
        shared_with_team: view.shared_with_team || false,
        shared_with_users: view.shared_with_users || [],
        columns: view.columns,
        filters: view.filters,
        sorts: view.sorts,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating view:', error);
      throw new Error('Failed to create view');
    }

    return data;
  },

  async updateView(id: string, updates: Partial<LeadViewConfig>): Promise<LeadViewConfig> {
    const { data, error } = await supabase
      .from('lead_views')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating view:', error);
      throw new Error('Failed to update view');
    }

    return data;
  },

  async deleteView(id: string): Promise<void> {
    const { error } = await supabase
      .from('lead_views')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting view:', error);
      throw new Error('Failed to delete view');
    }
  },

  async getView(id: string): Promise<LeadViewConfig | null> {
    const { data, error } = await supabase
      .from('lead_views')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching view:', error);
      return null;
    }

    return data;
  },

  async getUserViews(userId: string): Promise<LeadViewConfig[]> {
    const { data, error } = await supabase
      .from('lead_views')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user views:', error);
      return [];
    }

    return data || [];
  },

  async getSharedViews(userId: string): Promise<LeadViewConfig[]> {
    const { data, error } = await supabase
      .from('lead_views')
      .select('*')
      .or(`shared_with_team.eq.true,shared_with_users.cs.{${userId}}`)
      .neq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared views:', error);
      return [];
    }

    return data || [];
  },

  async getTemplateViews(): Promise<LeadViewConfig[]> {
    const { data, error } = await supabase
      .from('lead_views')
      .select('*')
      .eq('is_template', true)
      .order('template_type', { ascending: true });

    if (error) {
      console.error('Error fetching template views:', error);
      return [];
    }

    return data || [];
  },

  async shareViewWithTeam(viewId: string, shared: boolean): Promise<void> {
    const { error } = await supabase
      .from('lead_views')
      .update({
        shared_with_team: shared,
        is_shared: shared,
        updated_at: new Date().toISOString(),
      })
      .eq('id', viewId);

    if (error) {
      console.error('Error sharing view with team:', error);
      throw new Error('Failed to share view with team');
    }
  },

  async shareViewWithUsers(viewId: string, userIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('lead_views')
      .update({
        shared_with_users: userIds,
        is_shared: userIds.length > 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', viewId);

    if (error) {
      console.error('Error sharing view with users:', error);
      throw new Error('Failed to share view with users');
    }
  },

  async duplicateView(viewId: string, userId: string, newName?: string): Promise<LeadViewConfig> {
    const original = await this.getView(viewId);
    if (!original) {
      throw new Error('View not found');
    }

    const { data, error } = await supabase
      .from('lead_views')
      .insert({
        name: newName || `${original.name} (copie)`,
        description: original.description,
        user_id: userId,
        is_template: false,
        is_shared: false,
        shared_with_team: false,
        shared_with_users: [],
        columns: original.columns,
        filters: original.filters,
        sorts: original.sorts,
      })
      .select()
      .single();

    if (error) {
      console.error('Error duplicating view:', error);
      throw new Error('Failed to duplicate view');
    }

    return data;
  },

  getDefaultTemplates(): ViewTemplate[] {
    return [
      {
        id: 'template-new-leads',
        name: 'Nouveaux leads',
        description: 'Afficher tous les leads avec le statut "nouveau"',
        type: 'status',
        icon: 'Sparkles',
        config: {
          is_template: true,
          template_type: 'status',
          columns: [
            { key: 'name', visible: true, order: 0 },
            { key: 'firstname', visible: true, order: 1 },
            { key: 'email', visible: true, order: 2 },
            { key: 'phone', visible: true, order: 3 },
            { key: 'company', visible: true, order: 4 },
            { key: 'statut', visible: true, order: 5 },
            { key: 'created_at', visible: true, order: 6 },
          ],
          filters: [
            {
              field: 'statut',
              operator: 'equals',
              value: 'nouveau',
            },
          ],
          sorts: [
            {
              field: 'created_at',
              direction: 'desc',
            },
          ],
        },
      },
      {
        id: 'template-in-progress',
        name: 'Leads en cours',
        description: 'Afficher tous les leads en cours de traitement',
        type: 'status',
        icon: 'Clock',
        config: {
          is_template: true,
          template_type: 'status',
          columns: [
            { key: 'name', visible: true, order: 0 },
            { key: 'firstname', visible: true, order: 1 },
            { key: 'email', visible: true, order: 2 },
            { key: 'phone', visible: true, order: 3 },
            { key: 'statut', visible: true, order: 4 },
            { key: 'updated_at', visible: true, order: 5 },
          ],
          filters: [
            {
              field: 'statut',
              operator: 'equals',
              value: 'en_cours',
            },
          ],
          sorts: [
            {
              field: 'updated_at',
              direction: 'desc',
            },
          ],
        },
      },
      {
        id: 'template-completed',
        name: 'Leads traités',
        description: 'Afficher tous les leads traités',
        type: 'status',
        icon: 'CheckCircle',
        config: {
          is_template: true,
          template_type: 'status',
          columns: [
            { key: 'name', visible: true, order: 0 },
            { key: 'firstname', visible: true, order: 1 },
            { key: 'email', visible: true, order: 2 },
            { key: 'statut', visible: true, order: 3 },
            { key: 'updated_at', visible: true, order: 4 },
          ],
          filters: [
            {
              field: 'statut',
              operator: 'equals',
              value: 'traite',
            },
          ],
          sorts: [
            {
              field: 'updated_at',
              direction: 'desc',
            },
          ],
        },
      },
      {
        id: 'template-abandoned',
        name: 'Leads abandonnés',
        description: 'Afficher tous les leads abandonnés',
        type: 'status',
        icon: 'XCircle',
        config: {
          is_template: true,
          template_type: 'status',
          columns: [
            { key: 'name', visible: true, order: 0 },
            { key: 'email', visible: true, order: 1 },
            { key: 'statut', visible: true, order: 2 },
            { key: 'updated_at', visible: true, order: 3 },
          ],
          filters: [
            {
              field: 'statut',
              operator: 'equals',
              value: 'abandonne',
            },
          ],
          sorts: [
            {
              field: 'updated_at',
              direction: 'desc',
            },
          ],
        },
      },
      {
        id: 'template-phone-only',
        name: 'Leads avec téléphone',
        description: 'Afficher uniquement les leads avec numéro de téléphone',
        type: 'channel',
        icon: 'Phone',
        config: {
          is_template: true,
          template_type: 'channel',
          columns: [
            { key: 'name', visible: true, order: 0 },
            { key: 'firstname', visible: true, order: 1 },
            { key: 'phone', visible: true, order: 2 },
            { key: 'statut', visible: true, order: 3 },
          ],
          filters: [
            {
              field: 'phone',
              operator: 'is_not_empty',
              value: '',
            },
          ],
          sorts: [
            {
              field: 'created_at',
              direction: 'desc',
            },
          ],
        },
      },
      {
        id: 'template-email-only',
        name: 'Leads avec email',
        description: 'Afficher uniquement les leads avec adresse email',
        type: 'channel',
        icon: 'Mail',
        config: {
          is_template: true,
          template_type: 'channel',
          columns: [
            { key: 'name', visible: true, order: 0 },
            { key: 'firstname', visible: true, order: 1 },
            { key: 'email', visible: true, order: 2 },
            { key: 'statut', visible: true, order: 3 },
          ],
          filters: [
            {
              field: 'email',
              operator: 'is_not_empty',
              value: '',
            },
          ],
          sorts: [
            {
              field: 'created_at',
              direction: 'desc',
            },
          ],
        },
      },
      {
        id: 'template-high-priority',
        name: 'Leads prioritaires',
        description: 'Afficher les leads avec score élevé',
        type: 'custom',
        icon: 'Star',
        config: {
          is_template: true,
          template_type: 'custom',
          columns: [
            { key: 'name', visible: true, order: 0 },
            { key: 'firstname', visible: true, order: 1 },
            { key: 'email', visible: true, order: 2 },
            { key: 'phone', visible: true, order: 3 },
            { key: 'score', visible: true, order: 4 },
            { key: 'statut', visible: true, order: 5 },
          ],
          filters: [
            {
              field: 'score',
              operator: 'greater_than',
              value: 70,
            },
          ],
          sorts: [
            {
              field: 'score',
              direction: 'desc',
            },
          ],
        },
      },
    ];
  },

  async createViewFromTemplate(template: ViewTemplate, userId: string, customName?: string): Promise<LeadViewConfig> {
    return this.createView({
      name: customName || template.name,
      description: template.description,
      user_id: userId,
      is_template: false,
      columns: template.config.columns,
      filters: template.config.filters,
      sorts: template.config.sorts,
    });
  },
};
