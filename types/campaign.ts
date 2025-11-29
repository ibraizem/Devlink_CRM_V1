export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'archived';
export type CampaignChannel = 'email' | 'sms' | 'call';
export type OutreachStatus = 'pending' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked' | 'replied' | 'completed' | 'skipped';
export type TaskStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  start_date?: string;
  end_date?: string;
  target_audience?: any;
  lead_scoring_rules?: LeadScoringRule[];
  progression_rules?: ProgressionRule[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CampaignSequence {
  id: string;
  campaign_id: string;
  name: string;
  channel: CampaignChannel;
  order: number;
  delay_days: number;
  delay_hours: number;
  template_id?: string;
  content?: any;
  conditions?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  status: 'enrolled' | 'active' | 'completed' | 'paused' | 'exited';
  current_step: number;
  score: number;
  enrolled_at: string;
  completed_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CampaignOutreach {
  id: string;
  campaign_id: string;
  campaign_sequence_id: string;
  campaign_lead_id: string;
  lead_id: string;
  channel: CampaignChannel;
  status: OutreachStatus;
  scheduled_at: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  failed_at?: string;
  error_message?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CampaignTask {
  id: string;
  campaign_id: string;
  lead_id: string;
  assigned_to?: string;
  title: string;
  description?: string;
  task_type: 'call' | 'follow_up' | 'meeting' | 'other';
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  completed_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables?: string[];
  created_at: string;
  updated_at: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  body: string;
  variables?: string[];
  created_at: string;
  updated_at: string;
}

export interface LeadScoringRule {
  id: string;
  name: string;
  condition: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
    value: any;
  };
  score_change: number;
  is_active: boolean;
}

export interface ProgressionRule {
  id: string;
  name: string;
  from_status: string;
  to_status: string;
  conditions: {
    field: string;
    operator: string;
    value: any;
  }[];
  actions: {
    type: 'update_field' | 'create_task' | 'send_notification' | 'assign_to';
    params: any;
  }[];
  is_active: boolean;
}

export interface CampaignProgress {
  campaign_id: string;
  total_leads: number;
  enrolled: number;
  active: number;
  completed: number;
  paused: number;
  exited: number;
  emails_sent: number;
  emails_opened: number;
  emails_clicked: number;
  emails_replied: number;
  sms_sent: number;
  sms_replied: number;
  calls_completed: number;
  tasks_pending: number;
  tasks_completed: number;
  avg_score: number;
}

export interface ScheduledExecution {
  id: string;
  campaign_id: string;
  execution_type: 'outreach' | 'scoring' | 'progression' | 'task_generation';
  scheduled_at: string;
  executed_at?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}
