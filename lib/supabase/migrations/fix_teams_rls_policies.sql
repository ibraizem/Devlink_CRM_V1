-- Correction des politiques RLS pour la table teams
-- Permettre aux utilisateurs de voir les équipes où ils sont membres ou leaders
-- et aux admins/managers de voir plus d'équipes

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS teams_select_policy ON teams;
DROP POLICY IF EXISTS teams_insert_policy ON teams;
DROP POLICY IF EXISTS teams_update_policy ON teams;
DROP POLICY IF EXISTS teams_delete_policy ON teams;

-- Politique SELECT améliorée (sans récursion)
CREATE POLICY teams_select_policy ON teams
    FOR SELECT USING (
        -- L'utilisateur peut voir les équipes qu'il a créées
        created_by = auth.uid() OR
        -- L'utilisateur peut voir les équipes dont il est leader
        leader_id = auth.uid() OR
        -- Les admins voient tout
        auth.jwt()->>'role' = 'admin' OR
        -- Les managers voient les équipes où ils sont leaders
        (auth.jwt()->>'role' = 'manager' AND leader_id = auth.uid())
    );

-- Politique INSERT améliorée
CREATE POLICY teams_insert_policy ON teams
    FOR INSERT WITH CHECK (
        -- L'utilisateur peut créer des équipes (created_by sera automatiquement auth.uid())
        created_by = auth.uid() OR
        -- Les admins peuvent créer des équipes pour n'importe qui
        auth.jwt()->>'role' = 'admin'
    );

-- Politique UPDATE améliorée
CREATE POLICY teams_update_policy ON teams
    FOR UPDATE USING (
        -- L'utilisateur peut modifier les équipes qu'il a créées
        created_by = auth.uid() OR
        -- L'utilisateur peut modifier les équipes dont il est leader
        leader_id = auth.uid() OR
        -- Les admins peuvent modifier toutes les équipes
        auth.jwt()->>'role' = 'admin' OR
        -- Les managers peuvent modifier les équipes où ils sont leaders
        (auth.jwt()->>'role' = 'manager' AND leader_id = auth.uid())
    );

-- Politique DELETE améliorée
CREATE POLICY teams_delete_policy ON teams
    FOR DELETE USING (
        -- L'utilisateur peut supprimer les équipes qu'il a créées
        created_by = auth.uid() OR
        -- Les admins peuvent supprimer toutes les équipes
        auth.jwt()->>'role' = 'admin'
    );
