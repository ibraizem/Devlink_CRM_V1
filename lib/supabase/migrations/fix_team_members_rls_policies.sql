-- Politiques RLS pour la table team_members (sans récursion)
-- Permet aux utilisateurs de voir les équipes où ils sont membres via team_members

-- Supprimer les anciennes politiques sur team_members
DROP POLICY IF EXISTS team_members_select_policy ON team_members;
DROP POLICY IF EXISTS team_members_insert_policy ON team_members;
DROP POLICY IF EXISTS team_members_update_policy ON team_members;
DROP POLICY IF EXISTS team_members_delete_policy ON team_members;

-- Politique SELECT pour team_members
CREATE POLICY team_members_select_policy ON team_members
    FOR SELECT USING (
        -- L'utilisateur peut voir les équipes où il est membre
        user_id = auth.uid() OR
        -- Les admins voient tout
        auth.jwt()->>'role' = 'admin' OR
        -- Les managers voient les membres de leurs équipes
        (auth.jwt()->>'role' = 'manager' AND 
         EXISTS (
             SELECT 1 FROM teams 
             WHERE teams.id = team_members.team_id 
             AND teams.leader_id = auth.uid()
         ))
    );

-- Politique INSERT pour team_members
CREATE POLICY team_members_insert_policy ON team_members
    FOR INSERT WITH CHECK (
        -- L'utilisateur peut s'ajouter lui-même
        user_id = auth.uid() OR
        -- Les admins peuvent ajouter n'importe qui
        auth.jwt()->>'role' = 'admin' OR
        -- Les managers peuvent ajouter des membres à leurs équipes
        (auth.jwt()->>'role' = 'manager' AND 
         EXISTS (
             SELECT 1 FROM teams 
             WHERE teams.id = team_members.team_id 
             AND teams.leader_id = auth.uid()
         ))
    );

-- Politique UPDATE pour team_members
CREATE POLICY team_members_update_policy ON team_members
    FOR UPDATE USING (
        -- L'utilisateur peut modifier son propre rôle
        user_id = auth.uid() OR
        -- Les admins peuvent modifier tout
        auth.jwt()->>'role' = 'admin' OR
        -- Les managers peuvent modifier les membres de leurs équipes
        (auth.jwt()->>'role' = 'manager' AND 
         EXISTS (
             SELECT 1 FROM teams 
             WHERE teams.id = team_members.team_id 
             AND teams.leader_id = auth.uid()
         ))
    );

-- Politique DELETE pour team_members
CREATE POLICY team_members_delete_policy ON team_members
    FOR DELETE USING (
        -- L'utilisateur peut se retirer lui-même
        user_id = auth.uid() OR
        -- Les admins peuvent supprimer tout
        auth.jwt()->>'role' = 'admin' OR
        -- Les managers peuvent supprimer des membres de leurs équipes
        (auth.jwt()->>'role' = 'manager' AND 
         EXISTS (
             SELECT 1 FROM teams 
             WHERE teams.id = team_members.team_id 
             AND teams.leader_id = auth.uid()
         ))
    );
