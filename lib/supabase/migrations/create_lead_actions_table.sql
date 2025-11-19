-- Création de la table lead_actions pour l'historique des actions sur les leads
CREATE TABLE IF NOT EXISTS public.lead_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL,
  agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('lead_assigne', 'statut_change', 'note', 'rendezvous', 'appel', 'email', 'autre')),
  description text,
  contenu text, -- Pour les notes directes
  metadata jsonb DEFAULT '{}', -- Données supplémentaires flexibles
  bulk_operation boolean DEFAULT false,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS (Row Level Security)
ALTER TABLE lead_actions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- 1. Les utilisateurs peuvent voir les actions de leurs propres leads
CREATE POLICY "Users can view lead actions for their leads" ON lead_actions
  FOR SELECT USING (
    auth.uid() = agent_id OR 
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE users_profile.id = auth.uid() 
      AND users_profile.role = 'admin'
    )
  );

-- 2. Les utilisateurs peuvent insérer des actions (pour les notes, etc.)
CREATE POLICY "Users can insert lead actions" ON lead_actions
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- 3. Les utilisateurs peuvent mettre à jour leurs propres actions
CREATE POLICY "Users can update their own lead actions" ON lead_actions
  FOR UPDATE USING (auth.uid() = agent_id);

-- 4. Les admins peuvent tout faire
CREATE POLICY "Admins full access to lead_actions" ON lead_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE users_profile.id = auth.uid() 
      AND users_profile.role = 'admin'
    )
  );

-- Index pour améliorer les performances
CREATE INDEX idx_lead_actions_lead_id ON lead_actions(lead_id);
CREATE INDEX idx_lead_actions_agent_id ON lead_actions(agent_id);
CREATE INDEX idx_lead_actions_timestamp ON lead_actions(timestamp DESC);
CREATE INDEX idx_lead_actions_type ON lead_actions(type);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_actions_updated_at 
  BEFORE UPDATE ON lead_actions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE lead_actions IS 'Historique des actions effectuées sur les leads';
COMMENT ON COLUMN lead_actions.type IS 'Type d''action: lead_assigne, statut_change, note, rendezvous, appel, email, autre';
COMMENT ON COLUMN lead_actions.metadata IS 'Données supplémentaires en JSON pour flexibilité';
