-- Fix pour les politiques RLS de team_members
-- Le problème: WITH CHECK ne fonctionne pas correctement pour les insertions
-- Solution: Utiliser USING pour les insertions et ajuster la logique

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS team_members_select_policy ON team_members;
DROP POLICY IF EXISTS team_members_insert_policy ON team_members;
DROP POLICY IF EXISTS team_members_delete_policy ON team_members;

-- Recréer les politiques avec la bonne syntaxe
CREATE POLICY team_members_select_policy ON team_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        team_id IN (
            SELECT id FROM teams 
            WHERE created_by = auth.uid() OR leader_id = auth.uid()
        )
    );

CREATE POLICY team_members_insert_policy ON team_members
    FOR INSERT USING (
        user_id = auth.uid() OR
        team_id IN (
            SELECT id FROM teams 
            WHERE created_by = auth.uid() OR leader_id = auth.uid()
        )
    )
    WITH CHECK (
        user_id = auth.uid() OR
        team_id IN (
            SELECT id FROM teams 
            WHERE created_by = auth.uid() OR leader_id = auth.uid()
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
