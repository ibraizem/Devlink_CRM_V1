-- Fix simplifié pour les politiques RLS de team_members
-- Politique plus permissive pour éviter les erreurs 400

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS team_members_select_policy ON team_members;
DROP POLICY IF EXISTS team_members_insert_policy ON team_members;
DROP POLICY IF EXISTS team_members_delete_policy ON team_members;

-- Politiques simplifiées et plus permissives
CREATE POLICY team_members_select_policy ON team_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        team_id IN (
            SELECT id FROM teams 
            WHERE created_by = auth.uid() OR leader_id = auth.uid()
        )
    );

CREATE POLICY team_members_insert_policy ON team_members
    FOR INSERT WITH CHECK (
        -- Permettre l'insertion si l'utilisateur est le membre lui-même
        -- ou s'il est leader/créateur de l'équipe
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE id = team_id 
            AND (created_by = auth.uid() OR leader_id = auth.uid())
        )
    );

CREATE POLICY team_members_delete_policy ON team_members
    FOR DELETE USING (
        user_id = auth.uid() OR
        team_id IN (
            SELECT id FROM teams 
            WHERE created_by = auth.uid() OR leader_id = auth.uid()
        )
    );
