-- ====================================================================
-- SCRIPT DE POLITIQUES RLS (ROW LEVEL SECURITY)
-- ====================================================================
-- Adapté aux schémas réels des tables
-- Exécuter après la création des tables

-- Activer RLS sur toutes les tables
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_file_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers_import ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendezvous ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_table_views ENABLE ROW LEVEL SECURITY;

-- 1. Users Profile RLS
DROP POLICY IF EXISTS users_profile_select_policy ON users_profile;
CREATE POLICY users_profile_select_policy ON users_profile
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS users_profile_update_policy ON users_profile;
CREATE POLICY users_profile_update_policy ON users_profile
    FOR UPDATE USING (id = auth.uid());

-- 2. Teams RLS
DROP POLICY IF EXISTS teams_select_policy ON teams;
CREATE POLICY teams_select_policy ON teams
    FOR SELECT USING (
        created_by = auth.uid() OR 
        leader_id = auth.uid()
    );

DROP POLICY IF EXISTS teams_insert_policy ON teams;
CREATE POLICY teams_insert_policy ON teams
    FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS teams_update_policy ON teams;
CREATE POLICY teams_update_policy ON teams
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        leader_id = auth.uid()
    );

-- 3. Team Members RLS
DROP POLICY IF EXISTS team_members_select_policy ON team_members;
CREATE POLICY team_members_select_policy ON team_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        team_id IN (
            SELECT id FROM teams 
            WHERE created_by = auth.uid() OR leader_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS team_members_insert_policy ON team_members;
CREATE POLICY team_members_insert_policy ON team_members
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR
        team_id IN (
            SELECT id FROM teams 
            WHERE created_by = auth.uid() OR leader_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS team_members_delete_policy ON team_members;
CREATE POLICY team_members_delete_policy ON team_members
    FOR DELETE USING (
        user_id = auth.uid() OR
        team_id IN (
            SELECT id FROM teams 
            WHERE created_by = auth.uid() OR leader_id = auth.uid()
        )
    );

-- 4. Campaigns RLS
DROP POLICY IF EXISTS campaigns_select_policy ON campaigns;
CREATE POLICY campaigns_select_policy ON campaigns
    FOR SELECT USING (
        created_by = auth.uid()
    );

DROP POLICY IF EXISTS campaigns_insert_policy ON campaigns;
CREATE POLICY campaigns_insert_policy ON campaigns
    FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS campaigns_update_policy ON campaigns;
CREATE POLICY campaigns_update_policy ON campaigns
    FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS campaigns_delete_policy ON campaigns;
CREATE POLICY campaigns_delete_policy ON campaigns
    FOR DELETE USING (created_by = auth.uid());

-- 5. Campaign Files RLS
DROP POLICY IF EXISTS campaign_files_select_policy ON campaign_files;
CREATE POLICY campaign_files_select_policy ON campaign_files
    FOR SELECT USING (
        uploaded_by = auth.uid() OR
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS campaign_files_insert_policy ON campaign_files;
CREATE POLICY campaign_files_insert_policy ON campaign_files
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS campaign_files_update_policy ON campaign_files;
CREATE POLICY campaign_files_update_policy ON campaign_files
    FOR UPDATE USING (uploaded_by = auth.uid());

-- 6. Campaign File Links RLS
DROP POLICY IF EXISTS campaign_file_links_select_policy ON campaign_file_links;
CREATE POLICY campaign_file_links_select_policy ON campaign_file_links
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE created_by = auth.uid()
        ) OR
        fichier_id IN (
            SELECT id FROM fichiers_import 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS campaign_file_links_insert_policy ON campaign_file_links;
CREATE POLICY campaign_file_links_insert_policy ON campaign_file_links
    FOR INSERT WITH CHECK (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE created_by = auth.uid()
        )
    );

-- 7. Fichiers Import RLS
DROP POLICY IF EXISTS fichiers_import_select_policy ON fichiers_import;
CREATE POLICY fichiers_import_select_policy ON fichiers_import
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS fichiers_import_insert_policy ON fichiers_import;
CREATE POLICY fichiers_import_insert_policy ON fichiers_import
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS fichiers_import_update_policy ON fichiers_import;
CREATE POLICY fichiers_import_update_policy ON fichiers_import
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS fichiers_import_delete_policy ON fichiers_import;
CREATE POLICY fichiers_import_delete_policy ON fichiers_import
    FOR DELETE USING (user_id = auth.uid());

-- 8. Leads RLS
DROP POLICY IF EXISTS leads_select_policy ON leads;
CREATE POLICY leads_select_policy ON leads
    FOR SELECT USING (
        agent_id = auth.uid() OR
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE created_by = auth.uid()
        ) OR
        fichier_id IN (
            SELECT id FROM fichiers_import 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS leads_insert_policy ON leads;
CREATE POLICY leads_insert_policy ON leads
    FOR INSERT WITH CHECK (
        agent_id = auth.uid() OR
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE created_by = auth.uid()
        ) OR
        fichier_id IN (
            SELECT id FROM fichiers_import 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS leads_update_policy ON leads;
CREATE POLICY leads_update_policy ON leads
    FOR UPDATE USING (
        agent_id = auth.uid() OR
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE created_by = auth.uid()
        )
    );

-- 9. Lead Actions RLS
DROP POLICY IF EXISTS lead_actions_select_policy ON lead_actions;
CREATE POLICY lead_actions_select_policy ON lead_actions
    FOR SELECT USING (
        agent_id = auth.uid() OR
        lead_id IN (
            SELECT id FROM leads 
            WHERE agent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS lead_actions_insert_policy ON lead_actions;
CREATE POLICY lead_actions_insert_policy ON lead_actions
    FOR INSERT WITH CHECK (
        agent_id = auth.uid() OR
        lead_id IN (
            SELECT id FROM leads 
            WHERE agent_id = auth.uid()
        )
    );

-- 10. Rendezvous RLS
DROP POLICY IF EXISTS rendezvous_select_policy ON rendezvous;
CREATE POLICY rendezvous_select_policy ON rendezvous
    FOR SELECT USING (
        agent_id = auth.uid() OR
        lead_id IN (
            SELECT id FROM leads 
            WHERE agent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS rendezvous_insert_policy ON rendezvous;
CREATE POLICY rendezvous_insert_policy ON rendezvous
    FOR INSERT WITH CHECK (
        agent_id = auth.uid() OR
        lead_id IN (
            SELECT id FROM leads 
            WHERE agent_id = auth.uid()
        )
    );

-- 11. Sync Logs RLS
DROP POLICY IF EXISTS sync_logs_select_policy ON sync_logs;
CREATE POLICY sync_logs_select_policy ON sync_logs
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS sync_logs_insert_policy ON sync_logs;
CREATE POLICY sync_logs_insert_policy ON sync_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 12. Team Campaigns RLS
DROP POLICY IF EXISTS team_campaigns_select_policy ON team_campaigns;
CREATE POLICY team_campaigns_select_policy ON team_campaigns
    FOR SELECT USING (
        team_id IN (
            SELECT id FROM teams 
            WHERE created_by = auth.uid() OR leader_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS team_campaigns_insert_policy ON team_campaigns;
CREATE POLICY team_campaigns_insert_policy ON team_campaigns
    FOR INSERT WITH CHECK (
        team_id IN (
            SELECT id FROM teams 
            WHERE created_by = auth.uid() OR leader_id = auth.uid()
        )
    );

-- 14. User Custom Columns RLS
DROP POLICY IF EXISTS user_custom_columns_select_policy ON user_custom_columns;
CREATE POLICY user_custom_columns_select_policy ON user_custom_columns
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_custom_columns_insert_policy ON user_custom_columns;
CREATE POLICY user_custom_columns_insert_policy ON user_custom_columns
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_custom_columns_update_policy ON user_custom_columns;
CREATE POLICY user_custom_columns_update_policy ON user_custom_columns
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_custom_columns_delete_policy ON user_custom_columns;
CREATE POLICY user_custom_columns_delete_policy ON user_custom_columns
    FOR DELETE USING (user_id = auth.uid());

-- 15. User Table Views RLS
DROP POLICY IF EXISTS user_table_views_select_policy ON user_table_views;
CREATE POLICY user_table_views_select_policy ON user_table_views
    FOR SELECT USING (user_id = auth.uid() OR is_shared = true);

DROP POLICY IF EXISTS user_table_views_insert_policy ON user_table_views;
CREATE POLICY user_table_views_insert_policy ON user_table_views
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_table_views_update_policy ON user_table_views;
CREATE POLICY user_table_views_update_policy ON user_table_views
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_table_views_delete_policy ON user_table_views;
CREATE POLICY user_table_views_delete_policy ON user_table_views
    FOR DELETE USING (user_id = auth.uid());
