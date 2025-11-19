-- ====================================================================
-- ARCHITECTURE COMPLÈTE RLS - FICHIERS_IMPORT, LEADS, LEAD_ACTIONS
-- ====================================================================

-- 1. ACTIVER RLS SUR LES TABLES
ALTER TABLE fichiers_import ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_actions ENABLE ROW LEVEL SECURITY;

-- 2. POLITIQUES RLS POUR FICHIERS_IMPORT
-- Les utilisateurs ne voient que leurs propres fichiers
CREATE POLICY "Users can view their own files" ON fichiers_import
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own files" ON fichiers_import
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own files" ON fichiers_import
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own files" ON fichiers_import
    FOR DELETE
    USING (user_id = auth.uid());

-- 3. POLITIQUES RLS POUR LEADS
-- Les utilisateurs voient les leads de leurs campagnes, ceux qu'ils gèrent, ou ceux de leurs fichiers
CREATE POLICY "Users can view leads from their campaigns or assigned to them" ON leads
    FOR SELECT
    USING (
        -- Leads des campagnes de l'utilisateur
        campaign_id IN (
            SELECT campaign_id FROM team_campaigns 
            WHERE team_id IN (
                SELECT team_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
        -- OU leads dont ils sont l'agent
        OR agent_id = auth.uid()
        -- OU leads des fichiers qu'ils ont importés
        OR fichier_id IN (
            SELECT id FROM fichiers_import 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update leads from their campaigns or assigned to them" ON leads
    FOR UPDATE
    USING (
        campaign_id IN (
            SELECT campaign_id FROM team_campaigns 
            WHERE team_id IN (
                SELECT team_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
        OR agent_id = auth.uid()
        OR fichier_id IN (
            SELECT id FROM fichiers_import 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        campaign_id IN (
            SELECT campaign_id FROM team_campaigns 
            WHERE team_id IN (
                SELECT team_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
        OR agent_id = auth.uid()
        OR fichier_id IN (
            SELECT id FROM fichiers_import 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete leads from their campaigns or assigned to them" ON leads
    FOR DELETE
    USING (
        campaign_id IN (
            SELECT campaign_id FROM team_campaigns 
            WHERE team_id IN (
                SELECT team_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
        OR agent_id = auth.uid()
        OR fichier_id IN (
            SELECT id FROM fichiers_import 
            WHERE user_id = auth.uid()
        )
    );

-- Politique pour insertion via triggers (sécurisée)
CREATE POLICY "Enable secure lead insertion" ON leads
    FOR INSERT
    WITH CHECK (
        -- Validation basique pour les insertions automatiques
        (nom IS NOT NULL AND TRIM(nom) != '') OR
        (email IS NOT NULL AND TRIM(email) != '') OR
        (telephone IS NOT NULL AND TRIM(telephone) != '')
    );

-- 4. POLITIQUES RLS POUR LEAD_ACTIONS
-- Les utilisateurs voient les actions des leads qu'ils peuvent voir
CREATE POLICY "Users can view actions for accessible leads" ON lead_actions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_actions.lead_id
            AND (
                campaign_id IN (
                    SELECT campaign_id FROM team_campaigns 
                    WHERE team_id IN (
                        SELECT team_id FROM team_members 
                        WHERE user_id = auth.uid()
                    )
                )
                OR agent_id = auth.uid()
                OR fichier_id IN (
                    SELECT id FROM fichiers_import 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create actions for accessible leads" ON lead_actions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = lead_actions.lead_id
            AND (
                campaign_id IN (
                    SELECT campaign_id FROM team_campaigns 
                    WHERE team_id IN (
                        SELECT team_id FROM team_members 
                        WHERE user_id = auth.uid()
                    )
                )
                OR agent_id = auth.uid()
                OR fichier_id IN (
                    SELECT id FROM fichiers_import 
                    WHERE user_id = auth.uid()
                )
            )
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own actions" ON lead_actions
    FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own actions" ON lead_actions
    FOR DELETE
    USING (created_by = auth.uid());

-- 5. INDEX POUR OPTIMISER LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_fichiers_import_user_id ON fichiers_import(user_id);
CREATE INDEX IF NOT EXISTS idx_fichiers_import_statut ON fichiers_import(statut);
CREATE INDEX IF NOT EXISTS idx_fichiers_import_created_at ON fichiers_import(created_at);

CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_fichier_id ON leads(fichier_id);
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_source_import ON leads(source_import);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

CREATE INDEX IF NOT EXISTS idx_lead_actions_lead_id ON lead_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_actions_created_by ON lead_actions(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_actions_created_at ON lead_actions(created_at);

-- 6. ACCORDER LES PERMISSIONS NÉCESSAIRES
GRANT ALL ON fichiers_import TO authenticated;
GRANT ALL ON leads TO authenticated;
GRANT ALL ON lead_actions TO authenticated;
