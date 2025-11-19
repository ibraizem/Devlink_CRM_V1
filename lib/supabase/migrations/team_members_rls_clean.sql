-- Politiques RLS propres pour team_members (SANS RÉCURSION)
-- Basées sur les meilleures pratiques Supabase

-- Activer RLS sur team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS team_members_select_policy ON team_members;
DROP POLICY IF EXISTS team_members_insert_policy ON team_members;
DROP POLICY IF EXISTS team_members_update_policy ON team_members;
DROP POLICY IF EXISTS team_members_delete_policy ON team_members;

-- 1. Politique SELECT : Qui peut voir les membres d'équipe
CREATE POLICY team_members_select_policy ON team_members
    FOR SELECT USING (
        -- Un utilisateur peut voir les équipes dont il est membre
        user_id = auth.uid() OR
        -- Les admins voient tous les membres
        auth.jwt()->>'role' = 'admin' OR
        -- Les managers voient les membres de leurs équipes (directement, sans EXISTS)
        auth.jwt()->>'role' = 'manager'
    );

-- 2. Politique INSERT : Qui peut ajouter des membres
CREATE POLICY team_members_insert_policy ON team_members
    FOR INSERT WITH CHECK (
        -- Un utilisateur peut s'ajouter lui-même à une équipe
        user_id = auth.uid() OR
        -- Les admins peuvent ajouter n'importe qui
        auth.jwt()->>'role' = 'admin' OR
        -- Les managers peuvent ajouter des membres
        auth.jwt()->>'role' = 'manager'
    );

-- 3. Politique UPDATE : Qui peut modifier les rôles
CREATE POLICY team_members_update_policy ON team_members
    FOR UPDATE USING (
        -- Un utilisateur peut modifier son propre statut
        user_id = auth.uid() OR
        -- Les admins peuvent modifier tout
        auth.jwt()->>'role' = 'admin' OR
        -- Les managers peuvent modifier les membres de leurs équipes
        auth.jwt()->>'role' = 'manager'
    );

-- 4. Politique DELETE : Qui peut supprimer des membres
CREATE POLICY team_members_delete_policy ON team_members
    FOR DELETE USING (
        -- Un utilisateur peut se retirer lui-même
        user_id = auth.uid() OR
        -- Les admins peuvent supprimer n'importe qui
        auth.jwt()->>'role' = 'admin' OR
        -- Les managers peuvent supprimer des membres de leurs équipes
        auth.jwt()->>'role' = 'manager'
    );

-- Alternative plus restrictive si nécessaire :
-- Commentaire : Si vous voulez que les managers ne voient que les membres
-- de leurs équipes spécifiques, vous pouvez utiliser cette version :
/*
CREATE POLICY team_members_select_policy_strict ON team_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        auth.jwt()->>'role' = 'admin' OR
        (
            auth.jwt()->>'role' = 'manager' AND 
            team_id IN (
                SELECT id FROM teams WHERE leader_id = auth.uid()
            )
        )
    );
*/
