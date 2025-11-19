-- Migration pour corriger les politiques RLS qui causent les erreurs 500
-- Problème: Les politiques RLS actuelles bloquent même les admins

-- D'abord, désactiver temporairement RLS pour diagnostiquer
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers_import DISABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques problématiques
DROP POLICY IF EXISTS "users_profile_select_own" ON users_profile;
DROP POLICY IF EXISTS "users_profile_update_own" ON users_profile;
DROP POLICY IF EXISTS "users_profile_insert_admin" ON users_profile;
DROP POLICY IF EXISTS "users_profile_select_admin" ON users_profile;
DROP POLICY IF EXISTS "users_profile_update_admin" ON users_profile;

DROP POLICY IF EXISTS "teams_select_own" ON teams;
DROP POLICY IF EXISTS "teams_insert_admin" ON teams;
DROP POLICY IF EXISTS "teams_update_own" ON teams;
DROP POLICY IF EXISTS "teams_delete_own" ON teams;
DROP POLICY IF EXISTS "teams_select_admin" ON teams;
DROP POLICY IF EXISTS "teams_update_admin" ON teams;

DROP POLICY IF EXISTS "campaigns_select_own" ON campaigns;
DROP POLICY IF EXISTS "campaigns_insert_own" ON campaigns;
DROP POLICY IF EXISTS "campaigns_update_own" ON campaigns;
DROP POLICY IF EXISTS "campaigns_delete_own" ON campaigns;
DROP POLICY IF EXISTS "campaigns_select_admin" ON campaigns;
DROP POLICY IF EXISTS "campaigns_update_admin" ON campaigns;

DROP POLICY IF EXISTS "leads_select_own" ON leads;
DROP POLICY IF EXISTS "leads_insert_own" ON leads;
DROP POLICY IF EXISTS "leads_update_own" ON leads;
DROP POLICY IF EXISTS "leads_delete_own" ON leads;
DROP POLICY IF EXISTS "leads_select_admin" ON leads;
DROP POLICY IF EXISTS "leads_update_admin" ON leads;

DROP POLICY IF EXISTS "team_members_select_own" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_own" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_own" ON team_members;
DROP POLICY IF EXISTS "team_members_select_admin" ON team_members;

DROP POLICY IF EXISTS "lead_actions_select_own" ON lead_actions;
DROP POLICY IF EXISTS "lead_actions_insert_own" ON lead_actions;
DROP POLICY IF EXISTS "lead_actions_update_own" ON lead_actions;
DROP POLICY IF EXISTS "lead_actions_select_admin" ON lead_actions;

DROP POLICY IF EXISTS "fichiers_import_select_own" ON fichiers_import;
DROP POLICY IF EXISTS "fichiers_import_insert_own" ON fichiers_import;
DROP POLICY IF EXISTS "fichiers_import_update_own" ON fichiers_import;
DROP POLICY IF EXISTS "fichiers_import_select_admin" ON fichiers_import;

-- Réactiver RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers_import ENABLE ROW LEVEL SECURITY;

-- Créer des politiques simplifiées basées sur auth.uid() et auth.jwt()

-- Politiques pour users_profile
CREATE POLICY "users_profile_select_own" ON users_profile
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_profile_update_own" ON users_profile
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_profile_insert_admin" ON users_profile
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "users_profile_select_admin" ON users_profile
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "users_profile_update_admin" ON users_profile
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour teams
CREATE POLICY "teams_select_own" ON teams
    FOR SELECT USING (
        auth.uid() = leader_id OR 
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = teams.id 
            AND team_members.user_id = auth.uid()
        )
    );

CREATE POLICY "teams_insert_admin" ON teams
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "teams_update_own" ON teams
    FOR UPDATE USING (
        auth.uid() = leader_id OR 
        auth.uid() = created_by OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "teams_delete_own" ON teams
    FOR DELETE USING (auth.uid() = created_by OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "teams_select_admin" ON teams
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour campaigns
CREATE POLICY "campaigns_select_own" ON campaigns
    FOR SELECT USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = campaigns.team_id 
            AND (teams.leader_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM team_members 
                     WHERE team_members.team_id = teams.id 
                     AND team_members.user_id = auth.uid()
                 ))
        )
    );

CREATE POLICY "campaigns_insert_own" ON campaigns
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = campaigns.team_id 
            AND teams.leader_id = auth.uid()
        )
    );

CREATE POLICY "campaigns_update_own" ON campaigns
    FOR UPDATE USING (
        auth.uid() = created_by OR
        auth.jwt() ->> 'role' = 'admin' OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = campaigns.team_id 
            AND teams.leader_id = auth.uid()
        )
    );

CREATE POLICY "campaigns_delete_own" ON campaigns
    FOR DELETE USING (auth.uid() = created_by OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "campaigns_select_admin" ON campaigns
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour leads
CREATE POLICY "leads_select_own" ON leads
    FOR SELECT USING (
        auth.uid() = agent_id OR
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = leads.campaign_id 
            AND (campaigns.created_by = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM teams 
                     WHERE teams.id = campaigns.team_id 
                     AND (teams.leader_id = auth.uid() OR
                          EXISTS (
                              SELECT 1 FROM team_members 
                              WHERE team_members.team_id = teams.id 
                              AND team_members.user_id = auth.uid()
                          ))
                 ))
        )
    );

CREATE POLICY "leads_insert_own" ON leads
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager', 'commercial') OR
        auth.uid() = agent_id
    );

CREATE POLICY "leads_update_own" ON leads
    FOR UPDATE USING (
        auth.uid() = agent_id OR
        auth.jwt() ->> 'role' = 'admin' OR
        EXISTS (
            SELECT 1 FROM campaigns 
            WHERE campaigns.id = leads.campaign_id 
            AND campaigns.created_by = auth.uid()
        )
    );

CREATE POLICY "leads_delete_own" ON leads
    FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "leads_select_admin" ON leads
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour team_members
CREATE POLICY "team_members_select_own" ON team_members
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_members.team_id 
            AND (teams.leader_id = auth.uid() OR teams.created_by = auth.uid())
        )
    );

CREATE POLICY "team_members_insert_own" ON team_members
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_members.team_id 
            AND teams.leader_id = auth.uid()
        )
    );

CREATE POLICY "team_members_delete_own" ON team_members
    FOR DELETE USING (
        auth.uid() = user_id OR
        auth.jwt() ->> 'role' = 'admin' OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_members.team_id 
            AND teams.leader_id = auth.uid()
        )
    );

CREATE POLICY "team_members_select_admin" ON team_members
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour lead_actions
CREATE POLICY "lead_actions_select_own" ON lead_actions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_actions.lead_id 
            AND leads.agent_id = auth.uid()
        )
    );

CREATE POLICY "lead_actions_insert_own" ON lead_actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lead_actions_update_own" ON lead_actions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "lead_actions_select_admin" ON lead_actions
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour fichiers_import
CREATE POLICY "fichiers_import_select_own" ON fichiers_import
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "fichiers_import_insert_own" ON fichiers_import
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'manager'));

CREATE POLICY "fichiers_import_update_own" ON fichiers_import
    FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "fichiers_import_select_admin" ON fichiers_import
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Créer une fonction pour s'assurer que les métadonnées JWT sont synchronisées
CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les métadonnées JWT quand le rôle change
    IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
        PERFORM auth.admin.set_user_metadata(NEW.id, jsonb_build_object('role', NEW.role));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger si il n'existe pas
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON users_profile;
CREATE TRIGGER sync_user_metadata_trigger
    AFTER UPDATE ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_metadata();

-- Donner les permissions nécessaires à la fonction
GRANT EXECUTE ON FUNCTION sync_user_metadata TO authenticated;

-- S'assurer que le service role a les permissions nécessaires
GRANT ALL ON users_profile TO service_role;
GRANT ALL ON teams TO service_role;
GRANT ALL ON campaigns TO service_role;
GRANT ALL ON leads TO service_role;
GRANT ALL ON team_members TO service_role;
GRANT ALL ON lead_actions TO service_role;
GRANT ALL ON fichiers_import TO service_role;
