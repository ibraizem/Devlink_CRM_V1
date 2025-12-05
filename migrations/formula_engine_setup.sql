-- Migration: Formula Engine Tables
-- Description: Creates tables for calculated columns, results cache, and AI enrichment cache
-- Date: 2024

-- Create calculated_columns table
CREATE TABLE IF NOT EXISTS calculated_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(user_id) ON DELETE CASCADE,
  column_name text NOT NULL,
  formula text NOT NULL,
  formula_type text NOT NULL DEFAULT 'calculation',
  result_type text NOT NULL DEFAULT 'text',
  is_active boolean NOT NULL DEFAULT true,
  cache_duration integer DEFAULT 3600,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, column_name),
  CHECK (formula_type IN ('calculation', 'ai_enrichment')),
  CHECK (result_type IN ('text', 'number', 'boolean'))
);

-- Create indexes for calculated_columns
CREATE INDEX IF NOT EXISTS idx_calculated_columns_user_id ON calculated_columns(user_id);
CREATE INDEX IF NOT EXISTS idx_calculated_columns_active ON calculated_columns(is_active);
CREATE INDEX IF NOT EXISTS idx_calculated_columns_type ON calculated_columns(formula_type);

-- Create calculated_results table
CREATE TABLE IF NOT EXISTS calculated_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid NOT NULL REFERENCES calculated_columns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES fichier_donnees(id) ON DELETE CASCADE,
  result_value jsonb,
  computed_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  UNIQUE(column_id, lead_id)
);

-- Create indexes for calculated_results
CREATE INDEX IF NOT EXISTS idx_calculated_results_column_id ON calculated_results(column_id);
CREATE INDEX IF NOT EXISTS idx_calculated_results_lead_id ON calculated_results(lead_id);
CREATE INDEX IF NOT EXISTS idx_calculated_results_expires_at ON calculated_results(expires_at);

-- Create ai_enrichment_cache table
CREATE TABLE IF NOT EXISTS ai_enrichment_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  enrichment_type text NOT NULL,
  input_data jsonb NOT NULL,
  result_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  CHECK (enrichment_type IN ('company_detect', 'data_complete', 'lead_score', 'other'))
);

-- Create indexes for ai_enrichment_cache
CREATE INDEX IF NOT EXISTS idx_ai_enrichment_cache_key ON ai_enrichment_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_enrichment_cache_type_expires ON ai_enrichment_cache(enrichment_type, expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_enrichment_cache_expires ON ai_enrichment_cache(expires_at);

-- Enable Row Level Security
ALTER TABLE calculated_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculated_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_enrichment_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calculated_columns
CREATE POLICY "Users can view their own calculated columns"
ON calculated_columns FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own calculated columns"
ON calculated_columns FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own calculated columns"
ON calculated_columns FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own calculated columns"
ON calculated_columns FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for calculated_results
CREATE POLICY "Users can view calculated results"
ON calculated_results FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calculated_columns
    WHERE calculated_columns.id = calculated_results.column_id
    AND calculated_columns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert calculated results"
ON calculated_results FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM calculated_columns
    WHERE calculated_columns.id = calculated_results.column_id
    AND calculated_columns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update calculated results"
ON calculated_results FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calculated_columns
    WHERE calculated_columns.id = calculated_results.column_id
    AND calculated_columns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete calculated results"
ON calculated_results FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calculated_columns
    WHERE calculated_columns.id = calculated_results.column_id
    AND calculated_columns.user_id = auth.uid()
  )
);

-- RLS Policies for ai_enrichment_cache (global cache, readable by all authenticated users)
CREATE POLICY "All authenticated users can view cache"
ON ai_enrichment_cache FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can insert cache"
ON ai_enrichment_cache FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on calculated_columns
DROP TRIGGER IF EXISTS update_calculated_columns_updated_at ON calculated_columns;
CREATE TRIGGER update_calculated_columns_updated_at
  BEFORE UPDATE ON calculated_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired cache entries (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired calculated results
  DELETE FROM calculated_results
  WHERE expires_at IS NOT NULL AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete expired AI enrichment cache
  DELETE FROM ai_enrichment_cache
  WHERE expires_at < now();
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for column statistics
CREATE OR REPLACE VIEW calculated_column_stats AS
SELECT 
  cc.id,
  cc.user_id,
  cc.column_name,
  cc.formula_type,
  cc.is_active,
  COUNT(cr.id) as total_results,
  COUNT(CASE WHEN cr.expires_at > now() THEN 1 END) as cached_results,
  MAX(cr.computed_at) as last_computed,
  AVG(EXTRACT(EPOCH FROM (cr.computed_at - LAG(cr.computed_at) OVER (PARTITION BY cc.id ORDER BY cr.computed_at)))) as avg_computation_time
FROM calculated_columns cc
LEFT JOIN calculated_results cr ON cc.id = cr.column_id
GROUP BY cc.id, cc.user_id, cc.column_name, cc.formula_type, cc.is_active;

-- Grant permissions on the view
GRANT SELECT ON calculated_column_stats TO authenticated;

-- Comments for documentation
COMMENT ON TABLE calculated_columns IS 'Stores formula definitions for calculated columns';
COMMENT ON TABLE calculated_results IS 'Stores cached results of formula evaluations';
COMMENT ON TABLE ai_enrichment_cache IS 'Global cache for AI enrichment API responses';
COMMENT ON COLUMN calculated_columns.formula_type IS 'Type of formula: calculation or ai_enrichment';
COMMENT ON COLUMN calculated_columns.result_type IS 'Expected result type: text, number, or boolean';
COMMENT ON COLUMN calculated_columns.cache_duration IS 'Cache duration in seconds, NULL for no cache';
COMMENT ON FUNCTION cleanup_expired_cache IS 'Removes expired cache entries, returns count of deleted rows';
