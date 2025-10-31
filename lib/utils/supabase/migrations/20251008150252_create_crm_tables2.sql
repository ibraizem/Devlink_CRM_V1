/*
  # CRM Téléprospection - Schema Initial

  ## Tables créées
  
  ### 1. users_profile
  - Extension de auth.users avec profil métier
  - Champs: id, nom, prenom, role (admin/manager/telepro), actif, avatar_url, created_at, updated_at
  
  ### 2. leads
  - Gestion complète des prospects
  - Champs: id, nom, prenom, email, telephone, telephone_2, entreprise, statut, source, agent_id, priorite, dernier_contact, prochain_rappel, notes_rapides, created_at, updated_at
  - Statuts possibles: nouveau, rdv_planifie, rdv_ok, ko, a_replanifier, en_attente_doc, recrute, classe
  
  ### 3. rendezvous
  - Gestion des rendez-vous avec les leads
  - Champs: id, lead_id, agent_id, date_heure, duree_minutes, statut, canal, lien_calendly, lien_visio, notes, rappel_envoye, created_at, updated_at
  
  ### 4. notes
  - Notes et commentaires sur les leads
  - Champs: id, lead_id, auteur_id, contenu, epingle, created_at, updated_at
  
  ### 5. historique_actions
  - Traçabilité de toutes les actions
  - Champs: id, lead_id, agent_id, type_action, description, metadata (JSONB), created_at
  
  ### 6. documents
  - Gestion des documents liés aux leads
  - Champs: id, lead_id, nom_fichier, type_fichier, url_stockage, taille, uploadé_par, created_at
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Policies basées sur l'authentification et le rôle
  - Les admins ont accès complet
  - Les managers peuvent voir tous les leads de leur équipe
  - Les téléprospecteurs ne voient que leurs leads assignés
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table users_profile (extension de auth.users)
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom text NOT NULL,
  prenom text NOT NULL,
  role text NOT NULL DEFAULT 'telepro' CHECK (role IN ('admin', 'manager', 'telepro')),
  actif boolean DEFAULT true,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- Table leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  prenom text NOT NULL,
  email text,
  telephone text NOT NULL,
  telephone_2 text,
  entreprise text,
  statut text NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'rdv_planifie', 'rdv_ok', 'ko', 'a_replanifier', 'en_attente_doc', 'recrute', 'classe')),
  source text,
  agent_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  priorite text DEFAULT 'moyenne' CHECK (priorite IN ('basse', 'moyenne', 'haute', 'urgente')),
  dernier_contact timestamptz,
  prochain_rappel timestamptz,
  notes_rapides text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_leads_statut ON leads(statut);
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_prochain_rappel ON leads(prochain_rappel);
CREATE INDEX IF NOT EXISTS idx_leads_telephone ON leads(telephone);

-- Table rendezvous
CREATE TABLE IF NOT EXISTS rendezvous (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  date_heure timestamptz NOT NULL,
  duree_minutes integer DEFAULT 30,
  statut text DEFAULT 'planifie' CHECK (statut IN ('planifie', 'confirme', 'termine', 'annule', 'reporte', 'absent')),
  canal text CHECK (canal IN ('visio', 'telephonique', 'presentiel')),
  lien_calendly text,
  lien_visio text,
  notes text,
  rappel_envoye boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rendezvous ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rendezvous_lead_id ON rendezvous(lead_id);
CREATE INDEX IF NOT EXISTS idx_rendezvous_agent_id ON rendezvous(agent_id);
CREATE INDEX IF NOT EXISTS idx_rendezvous_date_heure ON rendezvous(date_heure);

-- Table notes
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  auteur_id uuid NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  contenu text NOT NULL,
  epingle boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_notes_auteur_id ON notes(auteur_id);

-- Table historique_actions
CREATE TABLE IF NOT EXISTS historique_actions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  type_action text NOT NULL CHECK (type_action IN ('appel', 'sms', 'email', 'note', 'rdv_cree', 'rdv_modifie', 'statut_change', 'document_ajoute', 'lead_assigne')),
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE historique_actions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_historique_lead_id ON historique_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_historique_agent_id ON historique_actions(agent_id);
CREATE INDEX IF NOT EXISTS idx_historique_created_at ON historique_actions(created_at);

-- Table documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  nom_fichier text NOT NULL,
  type_fichier text,
  url_stockage text NOT NULL,
  taille bigint,
  uploade_par uuid REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_documents_lead_id ON documents(lead_id);

-- Function pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON users_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rendezvous_updated_at BEFORE UPDATE ON rendezvous
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- RLS POLICIES
-- ========================================

-- Policies users_profile
CREATE POLICY "Users can view all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies leads
CREATE POLICY "Telepros can view assigned leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Authenticated users can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND actif = true
    )
  );

CREATE POLICY "Agents can update their leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies rendezvous
CREATE POLICY "Users can view related rendezvous"
  ON rendezvous FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = rendezvous.lead_id AND leads.agent_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can create rendezvous"
  ON rendezvous FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND actif = true
    )
  );

CREATE POLICY "Users can update related rendezvous"
  ON rendezvous FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = rendezvous.lead_id AND leads.agent_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = rendezvous.lead_id AND leads.agent_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Users can delete related rendezvous"
  ON rendezvous FOR DELETE
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Policies notes
CREATE POLICY "Users can view notes for their leads"
  ON notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = notes.lead_id AND (
        leads.agent_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users_profile
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can create notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (
    auteur_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND actif = true
    )
  );

CREATE POLICY "Authors can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auteur_id = auth.uid())
  WITH CHECK (auteur_id = auth.uid());

CREATE POLICY "Authors and admins can delete notes"
  ON notes FOR DELETE
  TO authenticated
  USING (
    auteur_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies historique_actions
CREATE POLICY "Users can view history for their leads"
  ON historique_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = historique_actions.lead_id AND (
        leads.agent_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users_profile
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Authenticated users can create history"
  ON historique_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND actif = true
    )
  );

-- Policies documents
CREATE POLICY "Users can view documents for their leads"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = documents.lead_id AND (
        leads.agent_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users_profile
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
      )
    )
  );

CREATE POLICY "Users can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploade_par = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND actif = true
    )
  );

CREATE POLICY "Uploaders and admins can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (
    uploade_par = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
