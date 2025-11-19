-- ====================================================================
-- CONFIGURATION COMPLÈTE DE LA TABLE LEAD_ACTIONS
-- ====================================================================

-- 1. VÉRIFIER/CÉER LA TABLE LEAD_ACTIONS AVEC LA BONNE STRUCTURE
CREATE TABLE IF NOT EXISTS lead_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type_action VARCHAR(50) NOT NULL CHECK (type_action IN ('appel', 'email', 'rdv', 'tache', 'note', 'autre')),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'terminee', 'annulee')),
    priorite VARCHAR(20) DEFAULT 'moyenne' CHECK (priorite IN ('basse', 'moyenne', 'haute', 'urgente')),
    date_echeance TIMESTAMP WITH TIME ZONE,
    date_realisation TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Contrainte pour éviter les doublons d'actions identiques
    CONSTRAINT unique_pending_action UNIQUE (lead_id, type_action, titre, statut) 
        DEFERRABLE INITIALLY DEFERRED
);

-- 2. TRIGGER POUR METTRE À JOUR UPDATED_AT
CREATE OR REPLACE FUNCTION update_lead_actions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lead_actions_timestamp ON lead_actions;
CREATE TRIGGER trigger_update_lead_actions_timestamp
    BEFORE UPDATE ON lead_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_actions_timestamp();

-- 3. TRIGGER POUR CRÉER AUTOMATIQUEMENT DES ACTIONS SUR NOUVEAUX LEADS
CREATE OR REPLACE FUNCTION create_default_lead_actions()
RETURNS TRIGGER AS $$
DECLARE
    default_action_id UUID;
BEGIN
    -- Créer une action de suivi par défaut pour les nouveaux leads
    INSERT INTO lead_actions (
        lead_id, 
        type_action, 
        titre, 
        description, 
        statut, 
        priorite,
        date_echeance,
        created_by,
        assigned_to
    ) VALUES (
        NEW.id,
        'tache',
        'Premier contact',
        'Prendre contact avec le lead pour qualifier son intérêt',
        'en_attente',
        'moyenne',
        NOW() + INTERVAL '2 days',
        COALESCE(NEW.agent_id, auth.uid()),
        COALESCE(NEW.agent_id, auth.uid())
    ) RETURNING id INTO default_action_id;
    
    -- Mettre à jour les métadonnées du lead avec l'action par défaut
    UPDATE leads 
    SET metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{default_action_id}',
        to_jsonb(default_action_id)
    )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur INSERT de leads (uniquement pour les leads importés)
DROP TRIGGER IF EXISTS trigger_create_default_actions ON leads;
CREATE TRIGGER trigger_create_default_actions
    AFTER INSERT ON leads
    FOR EACH ROW
    WHEN (NEW.source_import = 'fichier_import')
    EXECUTE FUNCTION create_default_lead_actions();

-- 4. FONCTIONS RPC POUR LA GESTION DES ACTIONS
CREATE OR REPLACE FUNCTION create_lead_action(
    p_lead_id UUID,
    p_type_action VARCHAR(50),
    p_titre VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_priorite VARCHAR(20) DEFAULT 'moyenne',
    p_date_echeance TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_assigned_to UUID DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    action_id UUID,
    message TEXT
) AS $$
DECLARE
    lead_accessible BOOLEAN;
    new_action_id UUID;
BEGIN
    -- Vérifier que le lead est accessible
    SELECT EXISTS(
        SELECT 1 FROM leads 
        WHERE id = p_lead_id
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
    ) INTO lead_accessible;
    
    IF NOT lead_accessible THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Lead non accessible';
        RETURN;
    END IF;
    
    -- Créer l'action
    INSERT INTO lead_actions (
        lead_id, type_action, titre, description, priorite,
        date_echeance, created_by, assigned_to
    ) VALUES (
        p_lead_id, p_type_action, p_titre, p_description, p_priorite,
        p_date_echeance, auth.uid(), COALESCE(p_assigned_to, auth.uid())
    ) RETURNING id INTO new_action_id;
    
    RETURN QUERY SELECT true, new_action_id, 'Action créée avec succès';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_lead_action(
    p_action_id UUID,
    p_statut VARCHAR(50) DEFAULT NULL,
    p_titre VARCHAR(255) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_priorite VARCHAR(20) DEFAULT NULL,
    p_date_echeance TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_date_realisation TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_assigned_to UUID DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    action_exists BOOLEAN;
    action_accessible BOOLEAN;
BEGIN
    -- Vérifier que l'action existe et est accessible
    SELECT EXISTS(
        SELECT 1 FROM lead_actions la
        JOIN leads l ON la.lead_id = l.id
        WHERE la.id = p_action_id
        AND (
            l.campaign_id IN (
                SELECT campaign_id FROM team_campaigns 
                WHERE team_id IN (
                    SELECT team_id FROM team_members 
                    WHERE user_id = auth.uid()
                )
            )
            OR l.agent_id = auth.uid()
            OR la.created_by = auth.uid()
            OR l.fichier_id IN (
                SELECT id FROM fichiers_import 
                WHERE user_id = auth.uid()
            )
        )
    ) INTO action_accessible;
    
    IF NOT action_accessible THEN
        RETURN QUERY SELECT false, 'Action non accessible';
        RETURN;
    END IF;
    
    -- Mettre à jour l'action
    UPDATE lead_actions SET
        statut = COALESCE(p_statut, lead_actions.statut),
        titre = COALESCE(p_titre, lead_actions.titre),
        description = COALESCE(p_description, lead_actions.description),
        priorite = COALESCE(p_priorite, lead_actions.priorite),
        date_echeance = COALESCE(p_date_echeance, lead_actions.date_echeance),
        date_realisation = COALESCE(p_date_realisation, lead_actions.date_realisation),
        assigned_to = COALESCE(p_assigned_to, lead_actions.assigned_to),
        updated_at = NOW()
    WHERE id = p_action_id;
    
    RETURN QUERY SELECT true, 'Action mise à jour avec succès';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_lead_actions(p_lead_id UUID)
RETURNS TABLE (
    id UUID,
    type_action VARCHAR(50),
    titre VARCHAR(255),
    description TEXT,
    statut VARCHAR(50),
    priorite VARCHAR(20),
    date_echeance TIMESTAMP WITH TIME ZONE,
    date_realisation TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.id,
        la.type_action,
        la.titre,
        la.description,
        la.statut,
        la.priorite,
        la.date_echeance,
        la.date_realisation,
        la.created_by,
        la.assigned_to,
        la.created_at,
        la.updated_at,
        la.metadata
    FROM lead_actions la
    JOIN leads l ON la.lead_id = l.id
    WHERE la.lead_id = p_lead_id
    AND (
        l.campaign_id IN (
            SELECT campaign_id FROM team_campaigns 
            WHERE team_id IN (
                SELECT team_id FROM team_members 
                WHERE user_id = auth.uid()
            )
        )
        OR l.agent_id = auth.uid()
        OR la.created_by = auth.uid()
        OR l.fichier_id IN (
            SELECT id FROM fichiers_import 
            WHERE user_id = auth.uid()
        )
    )
    ORDER BY 
        CASE la.priorite 
            WHEN 'urgente' THEN 1
            WHEN 'haute' THEN 2
            WHEN 'moyenne' THEN 3
            WHEN 'basse' THEN 4
        END,
        la.date_echeance ASC NULLS LAST,
        la.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_lead_action(p_action_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    action_exists BOOLEAN;
    action_owner BOOLEAN;
BEGIN
    -- Vérifier que l'action existe et appartient à l'utilisateur
    SELECT EXISTS(
        SELECT 1 FROM lead_actions 
        WHERE id = p_action_id AND created_by = auth.uid()
    ) INTO action_owner;
    
    IF NOT action_owner THEN
        RETURN QUERY SELECT false, 'Action non trouvée ou permission refusée';
        RETURN;
    END IF;
    
    -- Supprimer l'action
    DELETE FROM lead_actions WHERE id = p_action_id;
    
    RETURN QUERY SELECT true, 'Action supprimée avec succès';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. INDEX OPTIMISÉS
CREATE INDEX IF NOT EXISTS idx_lead_actions_lead_id ON lead_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_actions_created_by ON lead_actions(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_actions_assigned_to ON lead_actions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_lead_actions_statut ON lead_actions(statut);
CREATE INDEX IF NOT EXISTS idx_lead_actions_type_action ON lead_actions(type_action);
CREATE INDEX IF NOT EXISTS idx_lead_actions_priorite ON lead_actions(priorite);
CREATE INDEX IF NOT EXISTS idx_lead_actions_date_echeance ON lead_actions(date_echeance);
CREATE INDEX IF NOT EXISTS idx_lead_actions_created_at ON lead_actions(created_at);

-- 6. ACCORDER LES PERMISSIONS
GRANT ALL ON lead_actions TO authenticated;
GRANT EXECUTE ON FUNCTION create_lead_action TO authenticated;
GRANT EXECUTE ON FUNCTION update_lead_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_lead_actions TO authenticated;
GRANT EXECUTE ON FUNCTION delete_lead_action TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_lead_actions TO authenticated;
GRANT EXECUTE ON FUNCTION update_lead_actions_timestamp TO authenticated;
