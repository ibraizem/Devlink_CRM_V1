-- Politiques RLS optimisées pour TEAMS (SANS RÉCURSION)
-- Basées sur les patterns existants mais simplifiées

-- Activer RLS sur teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes sur teams
DROP POLICY IF EXISTS teams_select_policy ON teams;
DROP POLICY IF EXISTS teams_insert_policy ON teams;
DROP POLICY IF EXISTS teams_update_policy ON teams;
DROP POLICY IF EXISTS teams_delete_policy ON teams;
DROP POLICY IF EXISTS teams_select_admin ON teams;
DROP POLICY IF EXISTS teams_select_leader ON teams;
DROP POLICY IF EXISTS teams_select_member ON teams;
DROP POLICY IF EXISTS teams_insert_admin ON teams;
DROP POLICY IF EXISTS teams_update_admin ON teams;
DROP POLICY IF EXISTS teams_update_leader ON teams;
DROP POLICY IF EXISTS teams_delete_admin ON teams;

-- Politiques SELECT pour teams
CREATE POLICY teams_select_admin ON teams
    FOR SELECT USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY teams_select_leader ON teams
    FOR SELECT USING (leader_id = auth.uid());

CREATE POLICY teams_select_member ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = teams.id 
            AND team_members.user_id = auth.uid()
        )
    );

-- Politiques INSERT pour teams
CREATE POLICY teams_insert_admin ON teams
    FOR INSERT WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Politiques UPDATE pour teams
CREATE POLICY teams_update_admin ON teams
    FOR UPDATE USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY teams_update_leader ON teams
    FOR UPDATE USING (leader_id = auth.uid());

-- Politiques DELETE pour teams
CREATE POLICY teams_delete_admin ON teams
    FOR DELETE USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
