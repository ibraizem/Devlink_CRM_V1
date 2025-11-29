import { createClient } from '@/lib/utils/supabase/client';
import type {
  Campaign,
  CampaignSequence,
  CampaignLead,
  CampaignOutreach,
  CampaignTask,
  CampaignProgress,
  EmailTemplate,
  SmsTemplate,
  LeadScoringRule,
  ProgressionRule,
  ScheduledExecution,
} from '@/types/campaign';

const supabase = createClient();

export const campaignService = {
  async createCampaign(campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCampaigns(filters?: { status?: string; created_by?: string }): Promise<Campaign[]> {
    let query = supabase.from('campaigns').select('*');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCampaignById(id: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteCampaign(id: string): Promise<void> {
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw error;
  },

  async createSequence(sequence: Omit<CampaignSequence, 'id' | 'created_at' | 'updated_at'>): Promise<CampaignSequence> {
    const { data, error } = await supabase
      .from('campaign_sequences')
      .insert(sequence)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSequences(campaignId: string): Promise<CampaignSequence[]> {
    const { data, error } = await supabase
      .from('campaign_sequences')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updateSequence(id: string, updates: Partial<CampaignSequence>): Promise<CampaignSequence> {
    const { data, error } = await supabase
      .from('campaign_sequences')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSequence(id: string): Promise<void> {
    const { error } = await supabase.from('campaign_sequences').delete().eq('id', id);
    if (error) throw error;
  },

  async enrollLeads(campaignId: string, leadIds: string[]): Promise<CampaignLead[]> {
    const enrollments = leadIds.map(leadId => ({
      campaign_id: campaignId,
      lead_id: leadId,
      status: 'enrolled' as const,
      current_step: 0,
      score: 0,
      enrolled_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('campaign_leads')
      .insert(enrollments)
      .select();

    if (error) throw error;
    return data || [];
  },

  async getCampaignLeads(campaignId: string, status?: string): Promise<CampaignLead[]> {
    let query = supabase
      .from('campaign_leads')
      .select('*')
      .eq('campaign_id', campaignId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('enrolled_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateCampaignLead(id: string, updates: Partial<CampaignLead>): Promise<CampaignLead> {
    const { data, error } = await supabase
      .from('campaign_leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createOutreach(outreach: Omit<CampaignOutreach, 'id' | 'created_at' | 'updated_at'>): Promise<CampaignOutreach> {
    const { data, error } = await supabase
      .from('campaign_outreaches')
      .insert(outreach)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getOutreaches(campaignId: string, filters?: { status?: string; channel?: string }): Promise<CampaignOutreach[]> {
    let query = supabase
      .from('campaign_outreaches')
      .select('*')
      .eq('campaign_id', campaignId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }

    const { data, error } = await query.order('scheduled_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateOutreach(id: string, updates: Partial<CampaignOutreach>): Promise<CampaignOutreach> {
    const { data, error } = await supabase
      .from('campaign_outreaches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createTask(task: Omit<CampaignTask, 'id' | 'created_at' | 'updated_at'>): Promise<CampaignTask> {
    const { data, error } = await supabase
      .from('campaign_tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTasks(campaignId: string, filters?: { status?: string; assigned_to?: string }): Promise<CampaignTask[]> {
    let query = supabase
      .from('campaign_tasks')
      .select('*')
      .eq('campaign_id', campaignId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    const { data, error } = await query.order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async updateTask(id: string, updates: Partial<CampaignTask>): Promise<CampaignTask> {
    const { data, error } = await supabase
      .from('campaign_tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase.from('campaign_tasks').delete().eq('id', id);
    if (error) throw error;
  },

  async getCampaignProgress(campaignId: string): Promise<CampaignProgress> {
    const { data, error } = await supabase
      .rpc('get_campaign_progress', { p_campaign_id: campaignId });

    if (error) throw error;
    return data || {
      campaign_id: campaignId,
      total_leads: 0,
      enrolled: 0,
      active: 0,
      completed: 0,
      paused: 0,
      exited: 0,
      emails_sent: 0,
      emails_opened: 0,
      emails_clicked: 0,
      emails_replied: 0,
      sms_sent: 0,
      sms_replied: 0,
      calls_completed: 0,
      tasks_pending: 0,
      tasks_completed: 0,
      avg_score: 0,
    };
  },

  async createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    const { data, error } = await supabase
      .from('email_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createSmsTemplate(template: Omit<SmsTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<SmsTemplate> {
    const { data, error } = await supabase
      .from('sms_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSmsTemplates(): Promise<SmsTemplate[]> {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
