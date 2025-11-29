-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_audience JSONB,
  lead_scoring_rules JSONB DEFAULT '[]'::jsonb,
  progression_rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users_profile(id) ON DELETE SET NULL
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- Create campaign_sequences table
CREATE TABLE IF NOT EXISTS campaign_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'call')),
  "order" INTEGER NOT NULL DEFAULT 0,
  delay_days INTEGER NOT NULL DEFAULT 0,
  delay_hours INTEGER NOT NULL DEFAULT 0,
  template_id UUID,
  content JSONB,
  conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_sequences_campaign ON campaign_sequences(campaign_id);
CREATE INDEX idx_campaign_sequences_order ON campaign_sequences(campaign_id, "order");

-- Create campaign_leads table
CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'active', 'completed', 'paused', 'exited')),
  current_step INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

CREATE INDEX idx_campaign_leads_campaign ON campaign_leads(campaign_id);
CREATE INDEX idx_campaign_leads_lead ON campaign_leads(lead_id);
CREATE INDEX idx_campaign_leads_status ON campaign_leads(campaign_id, status);

-- Create campaign_outreaches table
CREATE TABLE IF NOT EXISTS campaign_outreaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  campaign_sequence_id UUID NOT NULL REFERENCES campaign_sequences(id) ON DELETE CASCADE,
  campaign_lead_id UUID NOT NULL REFERENCES campaign_leads(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'sms', 'call')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'delivered', 'failed', 'opened', 'clicked', 'replied', 'completed', 'skipped')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_outreaches_campaign ON campaign_outreaches(campaign_id);
CREATE INDEX idx_campaign_outreaches_lead ON campaign_outreaches(lead_id);
CREATE INDEX idx_campaign_outreaches_status ON campaign_outreaches(status);
CREATE INDEX idx_campaign_outreaches_scheduled ON campaign_outreaches(scheduled_at);
CREATE INDEX idx_campaign_outreaches_channel ON campaign_outreaches(channel);

-- Create campaign_tasks table
CREATE TABLE IF NOT EXISTS campaign_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('call', 'follow_up', 'meeting', 'other')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaign_tasks_campaign ON campaign_tasks(campaign_id);
CREATE INDEX idx_campaign_tasks_lead ON campaign_tasks(lead_id);
CREATE INDEX idx_campaign_tasks_assigned ON campaign_tasks(assigned_to);
CREATE INDEX idx_campaign_tasks_status ON campaign_tasks(status);
CREATE INDEX idx_campaign_tasks_due_date ON campaign_tasks(due_date);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sms_templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled_executions table
CREATE TABLE IF NOT EXISTS scheduled_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  execution_type VARCHAR(50) NOT NULL CHECK (execution_type IN ('outreach', 'scoring', 'progression', 'task_generation')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_executions_campaign ON scheduled_executions(campaign_id);
CREATE INDEX idx_scheduled_executions_status ON scheduled_executions(status);
CREATE INDEX idx_scheduled_executions_scheduled ON scheduled_executions(scheduled_at);

-- Create function to get campaign progress
CREATE OR REPLACE FUNCTION get_campaign_progress(p_campaign_id UUID)
RETURNS TABLE (
  campaign_id UUID,
  total_leads BIGINT,
  enrolled BIGINT,
  active BIGINT,
  completed BIGINT,
  paused BIGINT,
  exited BIGINT,
  emails_sent BIGINT,
  emails_opened BIGINT,
  emails_clicked BIGINT,
  emails_replied BIGINT,
  sms_sent BIGINT,
  sms_replied BIGINT,
  calls_completed BIGINT,
  tasks_pending BIGINT,
  tasks_completed BIGINT,
  avg_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_campaign_id,
    COUNT(DISTINCT cl.id) AS total_leads,
    COUNT(DISTINCT CASE WHEN cl.status = 'enrolled' THEN cl.id END) AS enrolled,
    COUNT(DISTINCT CASE WHEN cl.status = 'active' THEN cl.id END) AS active,
    COUNT(DISTINCT CASE WHEN cl.status = 'completed' THEN cl.id END) AS completed,
    COUNT(DISTINCT CASE WHEN cl.status = 'paused' THEN cl.id END) AS paused,
    COUNT(DISTINCT CASE WHEN cl.status = 'exited' THEN cl.id END) AS exited,
    COUNT(DISTINCT CASE WHEN co.channel = 'email' AND co.status IN ('sent', 'delivered', 'opened', 'clicked', 'replied') THEN co.id END) AS emails_sent,
    COUNT(DISTINCT CASE WHEN co.channel = 'email' AND co.status IN ('opened', 'clicked', 'replied') THEN co.id END) AS emails_opened,
    COUNT(DISTINCT CASE WHEN co.channel = 'email' AND co.status IN ('clicked', 'replied') THEN co.id END) AS emails_clicked,
    COUNT(DISTINCT CASE WHEN co.channel = 'email' AND co.status = 'replied' THEN co.id END) AS emails_replied,
    COUNT(DISTINCT CASE WHEN co.channel = 'sms' AND co.status IN ('sent', 'delivered', 'replied') THEN co.id END) AS sms_sent,
    COUNT(DISTINCT CASE WHEN co.channel = 'sms' AND co.status = 'replied' THEN co.id END) AS sms_replied,
    COUNT(DISTINCT CASE WHEN co.channel = 'call' AND co.status = 'completed' THEN co.id END) AS calls_completed,
    COUNT(DISTINCT CASE WHEN ct.status = 'pending' THEN ct.id END) AS tasks_pending,
    COUNT(DISTINCT CASE WHEN ct.status = 'completed' THEN ct.id END) AS tasks_completed,
    COALESCE(AVG(cl.score), 0)::NUMERIC AS avg_score
  FROM campaign_leads cl
  LEFT JOIN campaign_outreaches co ON co.campaign_lead_id = cl.id
  LEFT JOIN campaign_tasks ct ON ct.campaign_id = cl.campaign_id AND ct.lead_id = cl.lead_id
  WHERE cl.campaign_id = p_campaign_id
  GROUP BY p_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_sequences_updated_at BEFORE UPDATE ON campaign_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_leads_updated_at BEFORE UPDATE ON campaign_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_outreaches_updated_at BEFORE UPDATE ON campaign_outreaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_tasks_updated_at BEFORE UPDATE ON campaign_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_executions_updated_at BEFORE UPDATE ON scheduled_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
