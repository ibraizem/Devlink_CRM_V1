-- Activer RLS sur la table leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour la table leads
-- Permettre aux utilisateurs de voir les leads de leurs campagnes (via équipes) ou ceux qu'ils gèrent
CREATE POLICY "Users can view leads from their campaigns or assigned to them" ON leads
    FOR SELECT
    USING (
        -- Via les campagnes assignées à leurs équipes
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

-- Permettre aux utilisateurs de mettre à jour les leads de leurs campagnes ou ceux qu'ils gèrent
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
    );

-- Permettre aux utilisateurs de supprimer les leads de leurs campagnes ou ceux qu'ils gèrent
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

-- Permettre l'insertion de leads via le trigger (sécurisé)
CREATE POLICY "Enable trigger-based lead insertion" ON leads
    FOR INSERT
    WITH CHECK (
        -- Le trigger est SECURITY DEFINER, donc pas de restriction ici
        -- Mais on peut ajouter une validation basique
        (campaign_id IS NOT NULL AND fichier_id IS NOT NULL)
        OR agent_id = auth.uid()
    );

-- Créer une fonction RPC pour compter les leads par campagne selon vos statuts
CREATE OR REPLACE FUNCTION count_campaign_leads(p_campaign_id UUID)
RETURNS TABLE (
    total_leads BIGINT,
    contacted_leads BIGINT,
    rdv_leads BIGINT,
    recrute_leads BIGINT,
    nouveau_leads BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_leads,
        COUNT(CASE WHEN statut IN ('rdv_planifie', 'rdv_ok', 'a_replanifier') THEN 1 END)::BIGINT as contacted_leads,
        COUNT(CASE WHEN statut = 'rdv_planifie' THEN 1 END)::BIGINT as rdv_leads,
        COUNT(CASE WHEN statut = 'rdv_ok' THEN 1 END)::BIGINT as recrute_leads,
        COUNT(CASE WHEN statut = 'nouveau' THEN 1 END)::BIGINT as nouveau_leads
    FROM leads 
    WHERE campaign_id = p_campaign_id
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
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer une fonction RPC pour obtenir la progression d'une campagne
CREATE OR REPLACE FUNCTION get_campaign_progress(p_campaign_id UUID)
RETURNS TABLE (
    total_leads BIGINT,
    contacted_leads BIGINT,
    progress_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_leads,
        COUNT(CASE WHEN statut IN ('rdv_planifie', 'rdv_ok', 'a_replanifier') THEN 1 END)::BIGINT as contacted_leads,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN statut IN ('rdv_planifie', 'rdv_ok', 'a_replanifier') THEN 1 END)::FLOAT / COUNT(*)::FLOAT) * 100)
            ELSE 0 
        END as progress_percentage
    FROM leads 
    WHERE campaign_id = p_campaign_id
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
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer un index pour optimiser les performances sur campaign_id
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);

-- Donner les permissions sur les fonctions RPC
GRANT EXECUTE ON FUNCTION count_campaign_leads TO authenticated;
GRANT EXECUTE ON FUNCTION get_campaign_progress TO authenticated;
