/*
  # Migration: Update RLS Policies for Clerk Authentication

  This migration updates all RLS policies to support both Supabase Auth and Clerk:
  1. Drops existing policies
  2. Recreates policies with dual authentication support
  3. Uses helper functions for consistent auth checks
  
  ## Tables Updated
  - users_profile
  - leads
  - rendezvous
  - notes
  - historique_actions
  - documents
*/

-- ========================================
-- DROP EXISTING POLICIES
-- ========================================

-- users_profile policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Admins can insert profiles" ON users_profile;
DROP POLICY IF EXISTS "Admins can update all profiles" ON users_profile;

-- leads policies
DROP POLICY IF EXISTS "Telepros can view assigned leads" ON leads;
DROP POLICY IF EXISTS "Authenticated users can create leads" ON leads;
DROP POLICY IF EXISTS "Agents can update their leads" ON leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON leads;

-- rendezvous policies
DROP POLICY IF EXISTS "Users can view related rendezvous" ON rendezvous;
DROP POLICY IF EXISTS "Users can create rendezvous" ON rendezvous;
DROP POLICY IF EXISTS "Users can update related rendezvous" ON rendezvous;
DROP POLICY IF EXISTS "Users can delete related rendezvous" ON rendezvous;

-- notes policies
DROP POLICY IF EXISTS "Users can view notes for their leads" ON notes;
DROP POLICY IF EXISTS "Users can create notes" ON notes;
DROP POLICY IF EXISTS "Authors can update own notes" ON notes;
DROP POLICY IF EXISTS "Authors and admins can delete notes" ON notes;

-- historique_actions policies
DROP POLICY IF EXISTS "Users can view history for their leads" ON historique_actions;
DROP POLICY IF EXISTS "Authenticated users can create history" ON historique_actions;

-- documents policies
DROP POLICY IF EXISTS "Users can view documents for their leads" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;
DROP POLICY IF EXISTS "Uploaders and admins can delete documents" ON documents;

-- ========================================
-- RECREATE POLICIES WITH CLERK SUPPORT
-- ========================================

-- Helper function to check if user is current user (Supabase Auth or Clerk)
CREATE OR REPLACE FUNCTION is_current_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT 
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = user_id
      AND users_profile.clerk_user_id = get_clerk_user_id()
    );
$$;

-- ========================================
-- users_profile POLICIES
-- ========================================

CREATE POLICY "Users can view all profiles"
  ON users_profile FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL OR is_clerk_authenticated()
  );

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (is_current_user(id))
  WITH CHECK (is_current_user(id));

CREATE POLICY "Admins can insert profiles"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (
    current_user_has_role('admin')
  );

CREATE POLICY "Admins can update all profiles"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

-- Allow Clerk webhook to insert/update profiles
CREATE POLICY "Allow clerk sync"
  ON users_profile FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================
-- leads POLICIES
-- ========================================

CREATE POLICY "Telepros can view assigned leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    is_current_user(agent_id) OR
    current_user_has_any_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Authenticated users can create leads"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE (users_profile.id = auth.uid() OR users_profile.clerk_user_id = get_clerk_user_id())
      AND actif = true
    )
  );

CREATE POLICY "Agents can update their leads"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    is_current_user(agent_id) OR
    current_user_has_any_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    is_current_user(agent_id) OR
    current_user_has_any_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Admins can delete leads"
  ON leads FOR DELETE
  TO authenticated
  USING (current_user_has_role('admin'));

-- ========================================
-- rendezvous POLICIES
-- ========================================

CREATE POLICY "Users can view related rendezvous"
  ON rendezvous FOR SELECT
  TO authenticated
  USING (
    is_current_user(agent_id) OR
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = rendezvous.lead_id AND is_current_user(leads.agent_id)
    ) OR
    current_user_has_any_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Users can create rendezvous"
  ON rendezvous FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE (users_profile.id = auth.uid() OR users_profile.clerk_user_id = get_clerk_user_id())
      AND actif = true
    )
  );

CREATE POLICY "Users can update related rendezvous"
  ON rendezvous FOR UPDATE
  TO authenticated
  USING (
    is_current_user(agent_id) OR
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = rendezvous.lead_id AND is_current_user(leads.agent_id)
    ) OR
    current_user_has_any_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    is_current_user(agent_id) OR
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = rendezvous.lead_id AND is_current_user(leads.agent_id)
    ) OR
    current_user_has_any_role(ARRAY['admin', 'manager'])
  );

CREATE POLICY "Users can delete related rendezvous"
  ON rendezvous FOR DELETE
  TO authenticated
  USING (
    is_current_user(agent_id) OR
    current_user_has_any_role(ARRAY['admin', 'manager'])
  );

-- ========================================
-- notes POLICIES
-- ========================================

CREATE POLICY "Users can view notes for their leads"
  ON notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = notes.lead_id AND (
        is_current_user(leads.agent_id) OR
        current_user_has_any_role(ARRAY['admin', 'manager'])
      )
    )
  );

CREATE POLICY "Users can create notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (
    is_current_user(auteur_id) AND
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE (users_profile.id = auth.uid() OR users_profile.clerk_user_id = get_clerk_user_id())
      AND actif = true
    )
  );

CREATE POLICY "Authors can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (is_current_user(auteur_id))
  WITH CHECK (is_current_user(auteur_id));

CREATE POLICY "Authors and admins can delete notes"
  ON notes FOR DELETE
  TO authenticated
  USING (
    is_current_user(auteur_id) OR
    current_user_has_role('admin')
  );

-- ========================================
-- historique_actions POLICIES
-- ========================================

CREATE POLICY "Users can view history for their leads"
  ON historique_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = historique_actions.lead_id AND (
        is_current_user(leads.agent_id) OR
        current_user_has_any_role(ARRAY['admin', 'manager'])
      )
    )
  );

CREATE POLICY "Authenticated users can create history"
  ON historique_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE (users_profile.id = auth.uid() OR users_profile.clerk_user_id = get_clerk_user_id())
      AND actif = true
    )
  );

-- ========================================
-- documents POLICIES
-- ========================================

CREATE POLICY "Users can view documents for their leads"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = documents.lead_id AND (
        is_current_user(leads.agent_id) OR
        current_user_has_any_role(ARRAY['admin', 'manager'])
      )
    )
  );

CREATE POLICY "Users can upload documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    is_current_user(uploade_par) AND
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE (users_profile.id = auth.uid() OR users_profile.clerk_user_id = get_clerk_user_id())
      AND actif = true
    )
  );

CREATE POLICY "Uploaders and admins can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (
    is_current_user(uploade_par) OR
    current_user_has_role('admin')
  );
