-- Politiques RLS optimisées pour TEAM_MEMBERS (SANS RÉCURSION)
-- Basées sur les patterns existants mais simplifiées

-- Activer RLS sur team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes sur team_members
DROP POLICY IF EXISTS team_members_select_policy ON team_members;
DROP POLICY IF EXISTS team_members_insert_policy ON team_members;
DROP POLICY IF EXISTS team_members_update_policy ON team_members;
DROP POLICY IF EXISTS team_members_delete_policy ON team_members;
DROP POLICY IF EXISTS team_members_select_admin ON team_members;
DROP POLICY IF EXISTS team_members_select_leader ON team_members;
DROP POLICY IF EXISTS team_members_select_member ON team_members;
DROP POLICY IF EXISTS team_members_insert_admin ON team_members;
DROP POLICY IF EXISTS team_members_update_admin ON team_members;
DROP POLICY IF EXISTS team_members_update_leader ON team_members;
DROP POLICY IF EXISTS team_members_delete_admin ON team_members;

-- Politiques SELECT pour team_members
CREATE POLICY team_members_select_admin ON team_members
    FOR SELECT USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY team_members_select_leader ON team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_members.team_id 
            AND teams.leader_id = auth.uid()
        )
    );

CREATE POLICY team_members_select_member ON team_members
    FOR SELECT USING (user_id = auth.uid());

-- Politiques INSERT pour team_members
CREATE POLICY team_members_insert_admin ON team_members
    FOR INSERT WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY team_members_insert_leader ON team_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_members.team_id 
            AND teams.leader_id = auth.uid()
        )
    );

-- Politiques UPDATE pour team_members
CREATE POLICY team_members_update_admin ON team_members
    FOR UPDATE USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY team_members_update_leader ON team_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_members.team_id 
            AND teams.leader_id = auth.uid()
        )
    );

-- Politiques DELETE pour team_members
CREATE POLICY team_members_delete_admin ON team_members
    FOR DELETE USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

CREATE POLICY team_members_delete_leader ON team_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_members.team_id 
            AND teams.leader_id = auth.uid()
        )
    );

CREATE POLICY team_members_delete_self ON team_members
    FOR DELETE USING (user_id = auth.uid());
