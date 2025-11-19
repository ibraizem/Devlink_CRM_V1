-- ====================================================================
-- SCRIPT D'INSTALLATION COMPLÈTE ET CORRIGÉ - CRM DATABASE
-- ====================================================================
-- Ce script combine tous les éléments nécessaires dans le bon ordre
-- Résout l'erreur "stack depth limit exceeded" et configure RLS sécurisé

-- ====================================================================
-- ÉTAPE 1: CRÉATION DES TABLES DE SUPPORT
-- ====================================================================

-- Table de liaison fichiers-campagnes
CREATE TABLE IF NOT EXISTS campaign_file_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    fichier_id UUID NOT NULL REFERENCES fichiers_import(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, fichier_id)
);

-- Table de logs de synchronisation
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL,
    fichier_id UUID REFERENCES fichiers_import(id),
    leads_before INTEGER DEFAULT 0,
    leads_after INTEGER DEFAULT 0,
    sync_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Table des actions sur les leads (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS lead_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- ÉTAPE 2: FONCTIONS UTILITAIRES
-- ====================================================================

-- Variable de session pour éviter la récursion
CREATE OR REPLACE FUNCTION check_recursion_protection()
RETURNS BOOLEAN AS $$
BEGIN
    IF current_setting('myapp.is_in_trigger', true) = 'true' THEN
        RETURN true;
    END IF;
    RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ====================================================================
-- ÉTAPE 3: TRIGGERS SÉCURISÉS
-- ====================================================================

-- Fonction principale de synchronisation
CREATE OR REPLACE FUNCTION sync_leads_from_file_safe()
RETURNS TRIGGER AS $$
DECLARE
    file_record RECORD;
    campaign_ids UUID[];
    current_campaign_id UUID;
    leads_inserted INTEGER := 0;
    leads_updated INTEGER := 0;
    lead_data JSONB;
    existing_lead_id UUID;
BEGIN
    -- Protection contre la récursion
    IF check_recursion_protection() THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Activer la protection
    PERFORM set_config('myapp.is_in_trigger', 'true', true);
    
    -- Récupérer les données du fichier
    IF TG_OP = 'DELETE' THEN
        file_record := OLD;
    ELSE
        file_record := NEW;
    END IF;
    
    -- Si suppression, nettoyer les leads
    IF TG_OP = 'DELETE' THEN
        DELETE FROM leads WHERE fichier_id = file_record.id;
        INSERT INTO sync_logs (sync_type, fichier_id, leads_before, leads_after, sync_date, user_id)
        VALUES ('file_delete', file_record.id, 0, 0, NOW(), auth.uid());
        PERFORM set_config('myapp.is_in_trigger', 'false', true);
        RETURN OLD;
    END IF;
    
    -- Vérifier si le fichier a des données
    IF file_record.donnees IS NULL OR jsonb_array_length(file_record.donnees) = 0 THEN
        DELETE FROM leads WHERE fichier_id = file_record.id;
        UPDATE fichiers_import SET nb_lignes_importees = 0 WHERE id = file_record.id;
        PERFORM set_config('myapp.is_in_trigger', 'false', true);
        RETURN NEW;
    END IF;
    
    -- Récupérer les campagnes associées
    SELECT ARRAY_AGG(DISTINCT campaign_id) INTO campaign_ids
    FROM campaign_file_links 
    WHERE fichier_id = file_record.id;
    
    -- Si aucune campagne, utiliser NULL
    IF campaign_ids IS NULL OR array_length(campaign_ids, 1) = 0 THEN
        campaign_ids := ARRAY[NULL::UUID];
    END IF;
    
    -- Parcourir les données du fichier
    FOR i IN 0..jsonb_array_length(file_record.donnees) - 1 LOOP
        lead_data := file_record.donnees -> i;
        
        IF lead_data IS NULL OR jsonb_typeof(lead_data) != 'object' THEN
            CONTINUE;
        END IF;
        
        -- Vérifier si le lead existe déjà
        SELECT id INTO existing_lead_id
        FROM leads 
        WHERE fichier_id = file_record.id
        AND (
            (lead_data->>'email' IS NOT NULL AND TRIM(lead_data->>'email') != '' AND email = TRIM(lead_data->>'email'))
            OR (lead_data->>'telephone' IS NOT NULL AND TRIM(lead_data->>'telephone') != '' AND telephone = TRIM(lead_data->>'telephone'))
        )
        LIMIT 1;
        
        -- Créer ou mettre à jour le lead pour chaque campagne
        FOREACH current_campaign_id IN ARRAY campaign_ids LOOP
            IF existing_lead_id IS NULL THEN
                INSERT INTO leads (
                    nom, prenom, email, telephone, 
                    campaign_id, fichier_id, source_import, 
                    statut, agent_id, created_at, updated_at
                ) VALUES (
                    COALESCE(TRIM(NULLIF(lead_data->>'nom', '')), 'Inconnu'),
                    TRIM(NULLIF(lead_data->>'prenom', '')),
                    TRIM(NULLIF(lead_data->>'email', '')),
                    TRIM(NULLIF(lead_data->>'telephone', '')),
                    current_campaign_id,
                    file_record.id,
                    'import_fichier',
                    'nouveau',
                    file_record.user_id,
                    NOW(),
                    NOW()
                );
                leads_inserted := leads_inserted + 1;
            ELSE
                UPDATE leads SET
                    nom = COALESCE(TRIM(NULLIF(lead_data->>'nom', '')), leads.nom),
                    prenom = COALESCE(TRIM(NULLIF(lead_data->>'prenom', '')), leads.prenom),
                    email = COALESCE(TRIM(NULLIF(lead_data->>'email', '')), leads.email),
                    telephone = COALESCE(TRIM(NULLIF(lead_data->>'telephone', '')), leads.telephone),
                    campaign_id = COALESCE(current_campaign_id, leads.campaign_id),
                    updated_at = NOW()
                WHERE id = existing_lead_id AND fichier_id = file_record.id;
                leads_updated := leads_updated + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    -- Mettre à jour le compteur
    UPDATE fichiers_import 
    SET nb_lignes_importees = (
        SELECT COUNT(*) FROM leads WHERE fichier_id = file_record.id
    )
    WHERE id = file_record.id;
    
    -- Logger la synchronisation
    INSERT INTO sync_logs (sync_type, fichier_id, leads_before, leads_after, sync_date, metadata, user_id)
    VALUES (
        TG_OP, file_record.id, 0, leads_inserted + leads_updated, NOW(),
        jsonb_build_object(
            'leads_inserted', leads_inserted,
            'leads_updated', leads_updated,
            'campaigns_count', array_length(campaign_ids, 1)
        ),
        auth.uid()
    );
    
    PERFORM set_config('myapp.is_in_trigger', 'false', true);
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('myapp.is_in_trigger', 'false', true);
        INSERT INTO sync_logs (sync_type, fichier_id, sync_date, error_message, user_id)
        VALUES (TG_OP, file_record.id, NOW(), SQLERRM, auth.uid());
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_safe_sync_leads_on_insert ON fichiers_import;
CREATE TRIGGER trigger_safe_sync_leads_on_insert
    AFTER INSERT ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_file_safe();

DROP TRIGGER IF EXISTS trigger_safe_sync_leads_on_update ON fichiers_import;
CREATE TRIGGER trigger_safe_sync_leads_on_update
    AFTER UPDATE ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_file_safe();

DROP TRIGGER IF EXISTS trigger_safe_sync_leads_on_delete ON fichiers_import;
CREATE TRIGGER trigger_safe_sync_leads_on_delete
    AFTER DELETE ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_file_safe();

-- ====================================================================
-- ÉTAPE 4: FONCTIONS RPC
-- ====================================================================

-- Synchronisation manuelle
CREATE OR REPLACE FUNCTION manual_sync_file(p_file_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    success BOOLEAN,
    leads_processed INTEGER,
    message TEXT
) AS $$
DECLARE
    file_exists BOOLEAN;
    actual_user_id UUID;
BEGIN
    -- Utiliser p_user_id si fourni, sinon auth.uid()
    actual_user_id := COALESCE(p_user_id, auth.uid());
    
    SELECT EXISTS(
        SELECT 1 FROM fichiers_import 
        WHERE id = p_file_id AND user_id = actual_user_id
    ) INTO file_exists;
    
    IF NOT file_exists THEN
        RETURN QUERY SELECT false, 0, 'Fichier non trouvé ou accès non autorisé';
        RETURN;
    END IF;
    
    UPDATE fichiers_import 
    SET updated_at = NOW() 
    WHERE id = p_file_id AND user_id = actual_user_id;
    
    -- Logger la synchronisation manuelle
    INSERT INTO sync_logs (sync_type, fichier_id, sync_date, user_id, metadata)
    VALUES ('manual_sync', p_file_id, NOW(), actual_user_id, 
            jsonb_build_object('triggered_by', 'manual_rpc'));
    
    RETURN QUERY 
    SELECT true, COALESCE(nb_lignes_importees, 0), 'Synchronisation terminée avec succès'
    FROM fichiers_import 
    WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Statistiques de fichier
CREATE OR REPLACE FUNCTION get_file_statistics(p_file_id UUID)
RETURNS TABLE (
    total_rows INTEGER,
    imported_leads INTEGER,
    sync_logs_count INTEGER,
    last_sync_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(nb_lignes, 0),
        COALESCE(nb_lignes_importees, 0),
        (SELECT COUNT(*) FROM sync_logs WHERE fichier_id = p_file_id),
        (SELECT MAX(sync_date) FROM sync_logs WHERE fichier_id = p_file_id)
    FROM fichiers_import 
    WHERE id = p_file_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- ÉTAPE 5: ACTIVATION RLS ET POLITIQUES
-- ====================================================================

-- Activer RLS
ALTER TABLE fichiers_import ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_actions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour fichiers_import
CREATE POLICY "Users can view their own files" ON fichiers_import
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own files" ON fichiers_import
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own files" ON fichiers_import
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own files" ON fichiers_import
    FOR DELETE USING (user_id = auth.uid());

-- Politiques RLS pour leads
CREATE POLICY "Users can view leads from their campaigns or assigned to them" ON leads
    FOR SELECT
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

CREATE POLICY "Enable secure lead insertion" ON leads
    FOR INSERT
    WITH CHECK (
        (nom IS NOT NULL AND TRIM(nom) != '') OR
        (email IS NOT NULL AND TRIM(email) != '') OR
        (telephone IS NOT NULL AND TRIM(telephone) != '')
    );

-- Politiques RLS pour lead_actions
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
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own actions" ON lead_actions
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own actions" ON lead_actions
    FOR DELETE USING (user_id = auth.uid());

-- ====================================================================
-- ÉTAPE 6: INDEX OPTIMISÉS
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_fichiers_import_user_id ON fichiers_import(user_id);
CREATE INDEX IF NOT EXISTS idx_fichiers_import_statut ON fichiers_import(statut);
CREATE INDEX IF NOT EXISTS idx_fichiers_import_created_at ON fichiers_import(created_at);

CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_fichier_id ON leads(fichier_id);
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_source_import ON leads(source_import);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

CREATE INDEX IF NOT EXISTS idx_lead_actions_lead_id ON lead_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_actions_user_id ON lead_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_actions_created_at ON lead_actions(created_at);

CREATE INDEX IF NOT EXISTS idx_campaign_file_links_campaign_id ON campaign_file_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_file_links_fichier_id ON campaign_file_links(fichier_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_fichier_id ON sync_logs(fichier_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_date ON sync_logs(sync_date);

-- ====================================================================
-- ÉTAPE 7: PERMISSIONS
-- ====================================================================

GRANT ALL ON fichiers_import TO authenticated;
GRANT ALL ON leads TO authenticated;
GRANT ALL ON lead_actions TO authenticated;
GRANT ALL ON campaign_file_links TO authenticated;
GRANT ALL ON sync_logs TO authenticated;
GRANT EXECUTE ON FUNCTION manual_sync_file TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION check_recursion_protection TO authenticated;

-- ====================================================================
-- ÉTAPE 8: VALIDATION
-- ====================================================================

DO $$
DECLARE
    step_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 VALIDATION DE L''INSTALLATION CRM';
    
    -- Vérifier les tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fichiers_import') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Table fichiers_import vérifiée';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Table leads vérifiée';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_actions') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Table lead_actions vérifiée';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaign_file_links') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Table campaign_file_links vérifiée';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_logs') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Table sync_logs vérifiée';
    END IF;
    
    -- Vérifier RLS
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'fichiers_import' AND rowsecurity = true) THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ RLS activé sur fichiers_import';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'leads' AND rowsecurity = true) THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ RLS activé sur leads';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'lead_actions' AND rowsecurity = true) THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ RLS activé sur lead_actions';
    END IF;
    
    -- Vérifier les triggers
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_safe_sync_leads_on_insert') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Trigger insert vérifié';
    END IF;
    
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_safe_sync_leads_on_update') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Trigger update vérifié';
    END IF;
    
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_safe_sync_leads_on_delete') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Trigger delete vérifié';
    END IF;
    
    -- Vérifier les fonctions
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'manual_sync_file') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Fonction manual_sync_file vérifiée';
    END IF;
    
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'get_file_statistics') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Fonction get_file_statistics vérifiée';
    END IF;
    
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'check_recursion_protection') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Fonction anti-récursion vérifiée';
    END IF;
    
    -- Résultat
    RAISE NOTICE '';
    RAISE NOTICE '📊 RÉSULTAT: %/15 étapes réussies', step_count;
    
    IF step_count = 15 THEN
        RAISE NOTICE '🎉 INSTALLATION COMPLÈTE RÉUSSIE !';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 L''erreur "stack depth limit exceeded" est résolue';
        RAISE NOTICE '📝 Les RLS sont activés et sécurisés';
        RAISE NOTICE '⚡ Les triggers sont protégés contre la récursion';
        RAISE NOTICE '🔧 Les fonctions RPC sont disponibles';
        RAISE NOTICE '';
        RAISE NOTICE '📋 Vous pouvez maintenant tester l''import de fichiers';
    ELSE
        RAISE NOTICE '⚠️  INSTALLATION INCOMPLÈTE - Vérifiez les erreurs';
    END IF;
END $$;

-- ====================================================================
-- ÉTAPE 9: ÉTAT ACTUEL
-- ====================================================================

DO $$
DECLARE
    record_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 ÉTAT ACTUEL DES TABLES:';
    
    SELECT COUNT(*) INTO record_count FROM fichiers_import;
    RAISE NOTICE 'fichiers_import: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM leads;
    RAISE NOTICE 'leads: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM lead_actions;
    RAISE NOTICE 'lead_actions: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM campaign_file_links;
    RAISE NOTICE 'campaign_file_links: % enregistrements', record_count;
    
    SELECT COUNT(*) INTO record_count FROM sync_logs;
    RAISE NOTICE 'sync_logs: % enregistrements', record_count;
END $$;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 INSTALLATION TERMINÉE !';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Prochaines étapes:';
    RAISE NOTICE '1. Testez l''import d''un fichier via l''interface';
    RAISE NOTICE '2. Vérifiez que les leads sont créés automatiquement';
    RAISE NOTICE '3. Testez la création d''actions sur les leads';
    RAISE NOTICE '4. Vérifiez les permissions RLS';
END $$;
