-- Create lead_views table for custom views
CREATE TABLE IF NOT EXISTS lead_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  is_template BOOLEAN DEFAULT FALSE,
  template_type TEXT CHECK (template_type IN ('status', 'agent', 'channel', 'custom')),
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with_team BOOLEAN DEFAULT FALSE,
  shared_with_users TEXT[] DEFAULT ARRAY[]::TEXT[],
  columns JSONB NOT NULL DEFAULT '[]'::JSONB,
  filters JSONB NOT NULL DEFAULT '[]'::JSONB,
  sorts JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_views_user_id ON lead_views(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_views_is_template ON lead_views(is_template);
CREATE INDEX IF NOT EXISTS idx_lead_views_shared_with_team ON lead_views(shared_with_team) WHERE shared_with_team = TRUE;
CREATE INDEX IF NOT EXISTS idx_lead_views_shared_with_users ON lead_views USING GIN(shared_with_users);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_views_updated_at
  BEFORE UPDATE ON lead_views
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_views_updated_at();

-- Enable RLS
ALTER TABLE lead_views ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own views
CREATE POLICY "Users can view their own views"
  ON lead_views FOR SELECT
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Users can view shared views
CREATE POLICY "Users can view shared views"
  ON lead_views FOR SELECT
  USING (
    shared_with_team = TRUE 
    OR current_setting('request.jwt.claims', true)::json->>'sub' = ANY(shared_with_users)
  );

-- Users can view template views
CREATE POLICY "Users can view templates"
  ON lead_views FOR SELECT
  USING (is_template = TRUE);

-- Users can create their own views
CREATE POLICY "Users can create their own views"
  ON lead_views FOR INSERT
  WITH CHECK (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Users can update their own views
CREATE POLICY "Users can update their own views"
  ON lead_views FOR UPDATE
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Users can delete their own views
CREATE POLICY "Users can delete their own views"
  ON lead_views FOR DELETE
  USING (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Grant permissions
GRANT ALL ON lead_views TO authenticated;
GRANT SELECT ON lead_views TO anon;
