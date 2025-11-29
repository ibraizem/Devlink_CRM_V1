-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed')),
  secret_key TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  headers JSONB DEFAULT '{}',
  transform_enabled BOOLEAN DEFAULT FALSE,
  transform_script TEXT,
  retry_enabled BOOLEAN DEFAULT TRUE,
  max_retries INTEGER DEFAULT 3,
  retry_delay INTEGER DEFAULT 5,
  timeout INTEGER DEFAULT 30000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_triggered_at TIMESTAMPTZ
);

-- Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  transformed_payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_by ON webhooks(created_by);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE status = 'pending' AND next_retry_at IS NOT NULL;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_webhook_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_updated_at();

-- Enable Row Level Security
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for webhooks
CREATE POLICY "Users can view their own webhooks"
  ON webhooks FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own webhooks"
  ON webhooks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own webhooks"
  ON webhooks FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own webhooks"
  ON webhooks FOR DELETE
  USING (auth.uid() = created_by);

-- Create policies for webhook_deliveries
CREATE POLICY "Users can view deliveries for their webhooks"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks
      WHERE webhooks.id = webhook_deliveries.webhook_id
      AND webhooks.created_by = auth.uid()
    )
  );

CREATE POLICY "System can create webhook deliveries"
  ON webhook_deliveries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update webhook deliveries"
  ON webhook_deliveries FOR UPDATE
  USING (true);
