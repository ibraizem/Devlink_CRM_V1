import { createClient } from '@/lib/utils/supabase/client';
import type {
  Campaign,
  CampaignSequence,
  CampaignLead,
  CampaignOutreach,
  CampaignTask,
  LeadScoringRule,
  ProgressionRule,
} from '@/types/campaign';
import { campaignService } from './campaignService';

const supabase = createClient();

export class CampaignExecutionEngine {
  async processScheduledOutreaches(): Promise<void> {
    const now = new Date().toISOString();

    const { data: pendingOutreaches, error } = await supabase
      .from('campaign_outreaches')
      .select('*, campaign_sequences(*), campaign_leads(*), campaigns(*)')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);

    if (error) throw error;

    for (const outreach of pendingOutreaches || []) {
      await this.executeOutreach(outreach);
    }
  }

  async executeOutreach(outreach: CampaignOutreach & { campaign_sequences?: CampaignSequence }): Promise<void> {
    try {
      await campaignService.updateOutreach(outreach.id, { status: 'sent' });

      switch (outreach.channel) {
        case 'email':
          await this.sendEmail(outreach);
          break;
        case 'sms':
          await this.sendSms(outreach);
          break;
        case 'call':
          await this.scheduleCall(outreach);
          break;
      }

      await campaignService.updateOutreach(outreach.id, {
        status: 'delivered',
        sent_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      });
    } catch (error) {
      await campaignService.updateOutreach(outreach.id, {
        status: 'failed',
        failed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async sendEmail(outreach: CampaignOutreach): Promise<void> {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', outreach.lead_id)
      .single();

    if (!lead || !lead.email) {
      throw new Error('Lead email not found');
    }

    console.log(`Sending email to ${lead.email}`);
  }

  private async sendSms(outreach: CampaignOutreach): Promise<void> {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', outreach.lead_id)
      .single();

    if (!lead || !lead.telephone) {
      throw new Error('Lead phone not found');
    }

    console.log(`Sending SMS to ${lead.telephone}`);
  }

  private async scheduleCall(outreach: CampaignOutreach): Promise<void> {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', outreach.lead_id)
      .single();

    if (!lead) {
      throw new Error('Lead not found');
    }

    await campaignService.createTask({
      campaign_id: outreach.campaign_id,
      lead_id: outreach.lead_id,
      title: `Appel - ${lead.nom} ${lead.prenom}`,
      description: `Appel prévu dans le cadre de la campagne`,
      task_type: 'call',
      status: 'pending',
      priority: 'medium',
      due_date: outreach.scheduled_at,
    });
  }

  async scheduleSequenceOutreaches(campaignLead: CampaignLead): Promise<void> {
    const sequences = await campaignService.getSequences(campaignLead.campaign_id);
    const nextSequence = sequences.find(s => s.order === campaignLead.current_step + 1);

    if (!nextSequence) return;

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + nextSequence.delay_days);
    scheduledAt.setHours(scheduledAt.getHours() + nextSequence.delay_hours);

    await campaignService.createOutreach({
      campaign_id: campaignLead.campaign_id,
      campaign_sequence_id: nextSequence.id,
      campaign_lead_id: campaignLead.id,
      lead_id: campaignLead.lead_id,
      channel: nextSequence.channel,
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
    });

    await campaignService.updateCampaignLead(campaignLead.id, {
      current_step: nextSequence.order,
      status: 'active',
    });
  }

  async calculateLeadScore(leadId: string, campaignId: string): Promise<number> {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('lead_scoring_rules')
      .eq('id', campaignId)
      .single();

    if (!campaign?.lead_scoring_rules) return 0;

    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) return 0;

    let score = 0;
    const rules = campaign.lead_scoring_rules as LeadScoringRule[];

    for (const rule of rules.filter(r => r.is_active)) {
      if (this.evaluateCondition(lead, rule.condition)) {
        score += rule.score_change;
      }
    }

    const { data: campaignLead } = await supabase
      .from('campaign_leads')
      .select('*')
      .eq('lead_id', leadId)
      .eq('campaign_id', campaignId)
      .single();

    if (campaignLead) {
      await campaignService.updateCampaignLead(campaignLead.id, { score });
    }

    return score;
  }

  async applyProgressionRules(leadId: string, campaignId: string): Promise<void> {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('progression_rules')
      .eq('id', campaignId)
      .single();

    if (!campaign?.progression_rules) return;

    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) return;

    const rules = campaign.progression_rules as ProgressionRule[];

    for (const rule of rules.filter(r => r.is_active)) {
      if (lead.statut !== rule.from_status) continue;

      const allConditionsMet = rule.conditions.every(condition =>
        this.evaluateCondition(lead, condition)
      );

      if (allConditionsMet) {
        await supabase
          .from('leads')
          .update({ statut: rule.to_status })
          .eq('id', leadId);

        for (const action of rule.actions) {
          await this.executeAction(leadId, campaignId, action);
        }

        break;
      }
    }
  }

  private evaluateCondition(lead: any, condition: any): boolean {
    const fieldValue = lead[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(condition.value);
      case 'not_contains':
        return !String(fieldValue).includes(condition.value);
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;
      case 'not_exists':
        return fieldValue === null || fieldValue === undefined;
      default:
        return false;
    }
  }

  private async executeAction(leadId: string, campaignId: string, action: any): Promise<void> {
    switch (action.type) {
      case 'update_field':
        await supabase
          .from('leads')
          .update({ [action.params.field]: action.params.value })
          .eq('id', leadId);
        break;

      case 'create_task':
        await campaignService.createTask({
          campaign_id: campaignId,
          lead_id: leadId,
          title: action.params.title,
          description: action.params.description,
          task_type: action.params.task_type || 'follow_up',
          status: 'pending',
          priority: action.params.priority || 'medium',
          due_date: action.params.due_date || new Date().toISOString(),
          assigned_to: action.params.assigned_to,
        });
        break;

      case 'assign_to':
        await supabase
          .from('leads')
          .update({ agent_id: action.params.agent_id })
          .eq('id', leadId);
        break;

      case 'send_notification':
        console.log(`Notification: ${action.params.message}`);
        break;
    }
  }

  async generateFollowUpTasks(campaignId: string): Promise<void> {
    const { data: outreaches } = await supabase
      .from('campaign_outreaches')
      .select('*, campaign_leads(*)')
      .eq('campaign_id', campaignId)
      .in('status', ['replied', 'clicked']);

    if (!outreaches) return;

    for (const outreach of outreaches) {
      const existingTasks = await campaignService.getTasks(campaignId, {
        status: 'pending',
      });

      const hasTask = existingTasks.some(
        task => task.lead_id === outreach.lead_id && task.task_type === 'follow_up'
      );

      if (!hasTask) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        await campaignService.createTask({
          campaign_id: campaignId,
          lead_id: outreach.lead_id,
          title: 'Suivi après interaction',
          description: `Le lead a interagi avec la campagne (${outreach.status}). Suivi nécessaire.`,
          task_type: 'follow_up',
          status: 'pending',
          priority: 'high',
          due_date: dueDate.toISOString(),
        });
      }
    }
  }

  async processAllCampaigns(): Promise<void> {
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active');

    if (!campaigns) return;

    for (const campaign of campaigns) {
      await this.processScheduledOutreaches();
      await this.generateFollowUpTasks(campaign.id);

      const { data: campaignLeads } = await supabase
        .from('campaign_leads')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('status', 'active');

      if (campaignLeads) {
        for (const campaignLead of campaignLeads) {
          await this.calculateLeadScore(campaignLead.lead_id, campaign.id);
          await this.applyProgressionRules(campaignLead.lead_id, campaign.id);
        }
      }
    }
  }

  async startCampaign(campaignId: string): Promise<void> {
    await campaignService.updateCampaign(campaignId, { status: 'active' });

    const campaignLeads = await campaignService.getCampaignLeads(campaignId, 'enrolled');

    for (const campaignLead of campaignLeads) {
      await this.scheduleSequenceOutreaches(campaignLead);
    }
  }

  async pauseCampaign(campaignId: string): Promise<void> {
    await campaignService.updateCampaign(campaignId, { status: 'paused' });

    const { error } = await supabase
      .from('campaign_outreaches')
      .update({ status: 'skipped' })
      .eq('campaign_id', campaignId)
      .eq('status', 'scheduled');

    if (error) throw error;
  }

  async resumeCampaign(campaignId: string): Promise<void> {
    await campaignService.updateCampaign(campaignId, { status: 'active' });

    const campaignLeads = await campaignService.getCampaignLeads(campaignId, 'active');

    for (const campaignLead of campaignLeads) {
      await this.scheduleSequenceOutreaches(campaignLead);
    }
  }

  async completeCampaign(campaignId: string): Promise<void> {
    await campaignService.updateCampaign(campaignId, { 
      status: 'completed',
      end_date: new Date().toISOString()
    });

    const { error } = await supabase
      .from('campaign_leads')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)
      .in('status', ['enrolled', 'active']);

    if (error) throw error;
  }
}

export const campaignExecutionEngine = new CampaignExecutionEngine();
