import { createClient } from '@/lib/utils/supabase/client';
import type { ScheduledExecution } from '@/types/campaign';
import { campaignExecutionEngine } from './campaignExecutionEngine';

const supabase = createClient();

export class SchedulingService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  startScheduler(): void {
    this.scheduleTask('process-outreaches', 60000, async () => {
      await campaignExecutionEngine.processScheduledOutreaches();
    });

    this.scheduleTask('generate-tasks', 300000, async () => {
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('status', 'active');

      if (campaigns) {
        for (const campaign of campaigns) {
          await campaignExecutionEngine.generateFollowUpTasks(campaign.id);
        }
      }
    });

    this.scheduleTask('process-campaigns', 600000, async () => {
      await campaignExecutionEngine.processAllCampaigns();
    });
  }

  stopScheduler(): void {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }

  private scheduleTask(name: string, interval: number, task: () => Promise<void>): void {
    const intervalId = setInterval(async () => {
      try {
        await task();
      } catch (error) {
        console.error(`Error executing scheduled task ${name}:`, error);
      }
    }, interval);

    this.intervals.set(name, intervalId);
  }

  async scheduleExecution(
    campaignId: string,
    executionType: 'outreach' | 'scoring' | 'progression' | 'task_generation',
    scheduledAt: string,
    metadata?: any
  ): Promise<ScheduledExecution> {
    const { data, error } = await supabase
      .from('scheduled_executions')
      .insert({
        campaign_id: campaignId,
        execution_type: executionType,
        scheduled_at: scheduledAt,
        status: 'pending',
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async processScheduledExecutions(): Promise<void> {
    const now = new Date().toISOString();

    const { data: executions, error } = await supabase
      .from('scheduled_executions')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (error) throw error;

    for (const execution of executions || []) {
      await this.executeScheduledTask(execution);
    }
  }

  private async executeScheduledTask(execution: ScheduledExecution): Promise<void> {
    try {
      await supabase
        .from('scheduled_executions')
        .update({ status: 'running' })
        .eq('id', execution.id);

      switch (execution.execution_type) {
        case 'outreach':
          await campaignExecutionEngine.processScheduledOutreaches();
          break;

        case 'scoring':
          const { data: leads } = await supabase
            .from('campaign_leads')
            .select('*')
            .eq('campaign_id', execution.campaign_id)
            .eq('status', 'active');

          if (leads) {
            for (const lead of leads) {
              await campaignExecutionEngine.calculateLeadScore(
                lead.lead_id,
                execution.campaign_id
              );
            }
          }
          break;

        case 'progression':
          const { data: progressionLeads } = await supabase
            .from('campaign_leads')
            .select('*')
            .eq('campaign_id', execution.campaign_id)
            .eq('status', 'active');

          if (progressionLeads) {
            for (const lead of progressionLeads) {
              await campaignExecutionEngine.applyProgressionRules(
                lead.lead_id,
                execution.campaign_id
              );
            }
          }
          break;

        case 'task_generation':
          await campaignExecutionEngine.generateFollowUpTasks(execution.campaign_id);
          break;
      }

      await supabase
        .from('scheduled_executions')
        .update({
          status: 'completed',
          executed_at: new Date().toISOString(),
        })
        .eq('id', execution.id);
    } catch (error) {
      await supabase
        .from('scheduled_executions')
        .update({
          status: 'failed',
          executed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', execution.id);
    }
  }

  async scheduleRecurringTask(
    campaignId: string,
    executionType: 'outreach' | 'scoring' | 'progression' | 'task_generation',
    cronExpression: string
  ): Promise<void> {
    console.log(`Scheduled recurring task for campaign ${campaignId}: ${executionType}`);
  }
}

export const schedulingService = new SchedulingService();
