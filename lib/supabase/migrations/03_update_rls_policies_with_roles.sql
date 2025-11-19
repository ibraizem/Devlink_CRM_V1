-- Migration pour implémenter les permissions basées sur les rôles
-- Admin: Accès complet à toutes les ressources
-- Manager: Gestion d'équipes et campagnes, accès aux leads des campagnes de ses équipes
-- Commercial: Accès limité à leurs propres ressources (leads assignés)

-- 1. Users Profile RLS avec rôles
DROP POLICY IF EXISTS users_profile_select_policy ON users_profile;
CREATE POLICY users_profile_select_policy ON users_profile
    FOR SELECT USING (
        auth.uid() = id OR  -- Voir son propre profil
        auth.jwt()->>'role' = 'admin'  -- Admin voit tout
    );

DROP POLICY IF EXISTS users_profile_update_policy ON users_profile;
CREATE POLICY users_profile_update_policy ON users_profile
    FOR UPDATE USING (
        auth.uid() = id OR  -- Modifier son propre profil
        auth.jwt()->>'role' = 'admin'  -- Admin modifie tout
    );

-- 2. Teams RLS avec rôles
DROP POLICY IF EXISTS teams_select_policy ON teams;
CREATE POLICY teams_select_policy ON teams
    FOR SELECT USING (
        created_by = auth.uid() OR  -- Créateur de l'équipe
        leader_id = auth.uid() OR   -- Leader de l'équipe
        auth.jwt()->>'role' = 'admin' OR  -- Admin voit tout
        (
            -- Manager voit les équipes où il est leader
            auth.jwt()->>'role' = 'manager' AND 
            leader_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS teams_insert_policy ON teams;
CREATE POLICY teams_insert_policy ON teams
    FOR INSERT WITH CHECK (
        created_by = auth.uid() OR  -- Créateur
        auth.jwt()->>'role' = 'admin'  -- Admin
    );

DROP POLICY IF EXISTS teams_update_policy ON teams;
CREATE POLICY teams_update_policy ON teams
    FOR UPDATE USING (
        created_by = auth.uid() OR  -- Créateur
        leader_id = auth.uid() OR   -- Leader
        auth.jwt()->>'role' = 'admin' OR  -- Admin
        (
            -- Manager peut modifier les équipes où il est leader
            auth.jwt()->>'role' = 'manager' AND 
            leader_id = auth.uid()
        )
    );

-- 3. Team Members RLS avec rôles
DROP POLICY IF EXISTS team_members_select_policy ON team_members;
CREATE POLICY team_members_select_policy ON team_members
    FOR SELECT USING (
        user_id = auth.uid() OR  -- Membre lui-même
        (
            -- Leader de l'équipe peut voir les membres
            SELECT leader_id FROM teams WHERE id = team_members.team_id
        ) = auth.uid() OR
        (
            -- Manager peut voir les membres de ses équipes
            auth.jwt()->>'role' = 'manager' AND
            EXISTS (
                SELECT 1 FROM teams 
                WHERE id = team_members.team_id AND leader_id = auth.uid()
            )
        ) OR
        auth.jwt()->>'role' = 'admin'  -- Admin voit tout
    );

-- 4. Leads RLS avec rôles
DROP POLICY IF EXISTS leads_select_policy ON leads;
CREATE POLICY leads_select_policy ON leads
    FOR SELECT USING (
        agent_id = auth.uid() OR  -- Commercial voit ses leads
        auth.jwt()->>'role' = 'admin' OR  -- Admin voit tout
        (
            -- Manager voit les leads des campagnes de ses équipes
            auth.jwt()->>'role' = 'manager' AND
            campaign_id IN (
                SELECT c.id FROM campaigns c
                JOIN teams t ON c.team_id = t.id
                WHERE t.leader_id = auth.uid()
            )
        ) OR
        (
            -- Manager voit aussi les leads qu'il a créés directement
            auth.jwt()->>'role' = 'manager' AND
            fichier_id IN (
                SELECT id FROM fichiers_import 
                WHERE user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS leads_insert_policy ON leads;
CREATE POLICY leads_insert_policy ON leads
    FOR INSERT WITH CHECK (
        auth.jwt()->>'role' = 'admin' OR  -- Admin peut tout insérer
        agent_id = auth.uid() OR  -- Commercial peut insérer ses leads
        (
            -- Manager peut insérer des leads pour ses équipes
            auth.jwt()->>'role' = 'manager' AND
            (
                campaign_id IN (
                    SELECT c.id FROM campaigns c
                    JOIN teams t ON c.team_id = t.id
                    WHERE t.leader_id = auth.uid()
                ) OR
                fichier_id IN (
                    SELECT id FROM fichiers_import 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS leads_update_policy ON leads;
CREATE POLICY leads_update_policy ON leads
    FOR UPDATE USING (
        agent_id = auth.uid() OR  -- Commercial modifie ses leads
        auth.jwt()->>'role' = 'admin' OR  -- Admin modifie tout
        (
            -- Manager modifie les leads des campagnes de ses équipes
            auth.jwt()->>'role' = 'manager' AND
            campaign_id IN (
                SELECT c.id FROM campaigns c
                JOIN teams t ON c.team_id = t.id
                WHERE t.leader_id = auth.uid()
            )
        )
    );

-- 5. Campaigns RLS avec rôles
DROP POLICY IF EXISTS campaigns_select_policy ON campaigns;
CREATE POLICY campaigns_select_policy ON campaigns
    FOR SELECT USING (
        created_by = auth.uid() OR  -- Créateur
        auth.jwt()->>'role' = 'admin' OR  -- Admin voit tout
        (
            -- Manager voit les campagnes de ses équipes
            auth.jwt()->>'role' = 'manager' AND
            team_id IN (
                SELECT id FROM teams WHERE leader_id = auth.uid()
            )
        ) OR
        (
            -- Commercial voit les campagnes où il a des leads
            auth.jwt()->>'role' = 'commercial' AND
            id IN (
                SELECT DISTINCT campaign_id FROM leads WHERE agent_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS campaigns_insert_policy ON campaigns;
CREATE POLICY campaigns_insert_policy ON campaigns
    FOR INSERT WITH CHECK (
        created_by = auth.uid() OR  -- Créateur
        auth.jwt()->>'role' = 'admin' OR  -- Admin
        (
            -- Manager peut créer pour ses équipes
            auth.jwt()->>'role' = 'manager' AND
            team_id IN (
                SELECT id FROM teams WHERE leader_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS campaigns_update_policy ON campaigns;
CREATE POLICY campaigns_update_policy ON campaigns
    FOR UPDATE USING (
        created_by = auth.uid() OR  -- Créateur
        auth.jwt()->>'role' = 'admin' OR  -- Admin
        (
            -- Manager modifie les campagnes de ses équipes
            auth.jwt()->>'role' = 'manager' AND
            team_id IN (
                SELECT id FROM teams WHERE leader_id = auth.uid()
            )
        )
    );

-- 6. Lead Actions RLS avec rôles
DROP POLICY IF EXISTS lead_actions_select_policy ON lead_actions;
CREATE POLICY lead_actions_select_policy ON lead_actions
    FOR SELECT USING (
        agent_id = auth.uid() OR  -- Commercial voit ses actions
        auth.jwt()->>'role' = 'admin' OR  -- Admin voit tout
        (
            -- Manager voit les actions sur les leads de ses équipes
            auth.jwt()->>'role' = 'manager' AND
            lead_id IN (
                SELECT id FROM leads 
                WHERE campaign_id IN (
                    SELECT c.id FROM campaigns c
                    JOIN teams t ON c.team_id = t.id
                    WHERE t.leader_id = auth.uid()
                )
            )
        )
    );

DROP POLICY IF EXISTS lead_actions_insert_policy ON lead_actions;
CREATE POLICY lead_actions_insert_policy ON lead_actions
    FOR INSERT WITH CHECK (
        agent_id = auth.uid() OR  -- Commercial insère ses actions
        auth.jwt()->>'role' = 'admin' OR  -- Admin
        (
            -- Manager peut insérer des actions sur les leads de ses équipes
            auth.jwt()->>'role' = 'manager' AND
            lead_id IN (
                SELECT id FROM leads 
                WHERE campaign_id IN (
                    SELECT c.id FROM campaigns c
                    JOIN teams t ON c.team_id = t.id
                    WHERE t.leader_id = auth.uid()
                )
            )
        )
    );

-- 7. Fichiers Import RLS avec rôles
DROP POLICY IF EXISTS fichiers_import_select_policy ON fichiers_import;
CREATE POLICY fichiers_import_select_policy ON fichiers_import
    FOR SELECT USING (
        user_id = auth.uid() OR  -- Propriétaire
        auth.jwt()->>'role' = 'admin'  -- Admin voit tout
    );

DROP POLICY IF EXISTS fichiers_import_insert_policy ON fichiers_import;
CREATE POLICY fichiers_import_insert_policy ON fichiers_import
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR  -- Propriétaire
        auth.jwt()->>'role' = 'admin'  -- Admin
    );

DROP POLICY IF EXISTS fichiers_import_update_policy ON fichiers_import;
CREATE POLICY fichiers_import_update_policy ON fichiers_import
    FOR UPDATE USING (
        user_id = auth.uid() OR  -- Propriétaire
        auth.jwt()->>'role' = 'admin'  -- Admin
    );
