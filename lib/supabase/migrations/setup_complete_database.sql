-- ====================================================================
-- SCRIPT D'INSTALLATION COMPLET - À EXÉCUTER DANS L'ORDRE
-- ====================================================================

-- Ce fichier combine tous les scripts nécessaires pour une installation complète

-- ====================================================================
-- ÉTAPE 1: NETTOYAGE (optionnel - décommenter si nécessaire)
-- ====================================================================

/*
-- Supprimer les anciens triggers et politiques
DROP TRIGGER IF EXISTS trigger_sync_leads_on_insert ON fichiers_import;
DROP TRIGGER IF EXISTS trigger_sync_leads_on_update ON fichiers_import;
DROP TRIGGER IF EXISTS trigger_sync_leads_on_delete ON fichiers_import;

-- Supprimer les anciennes politiques RLS
DROP POLICY IF EXISTS "Users can view their own files" ON fichiers_import;
DROP POLICY IF EXISTS "Users can insert their own files" ON fichiers_import;
DROP POLICY IF EXISTS "Users can update their own files" ON fichiers_import;
DROP POLICY IF EXISTS "Users can delete their own files" ON fichiers_import;

DROP POLICY IF EXISTS "Users can view leads from their campaigns or assigned to them" ON leads;
DROP POLICY IF EXISTS "Users can update leads from their campaigns or assigned to them" ON leads;
DROP POLICY IF EXISTS "Users can delete leads from their campaigns or assigned to them" ON leads;
DROP POLICY IF EXISTS "Enable secure lead insertion" ON leads;

DROP POLICY IF EXISTS "Users can view actions for accessible leads" ON lead_actions;
DROP POLICY IF EXISTS "Users can create actions for accessible leads" ON lead_actions;
DROP POLICY IF EXISTS "Users can update their own actions" ON lead_actions;
DROP POLICY IF EXISTS "Users can delete their own actions" ON lead_actions;
*/

-- ====================================================================
-- ÉTAPE 2: CONTENU COMPLET DES SCRIPTS
-- ====================================================================

-- Contenu de setup_complete_rls.sql
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
DROP POLICY IF EXISTS "Users can update their own files" ON fichiers_import;
DROP POLICY IF EXISTS "Users can delete their own files" ON fichiers_import;

DROP POLICY IF EXISTS "Users can view leads from their campaigns or assigned to them" ON leads;
DROP POLICY IF EXISTS "Users can update leads from their campaigns or assigned to them" ON leads;
DROP POLICY IF EXISTS "Users can delete leads from their campaigns or assigned to them" ON leads;

DROP POLICY IF EXISTS "Users can view actions for accessible leads" ON lead_actions;
DROP POLICY IF EXISTS "Users can create actions for accessible leads" ON lead_actions;
DROP POLICY IF EXISTS "Users can update their own actions" ON lead_actions;
DROP POLICY IF EXISTS "Users can delete their own actions" ON lead_actions;
*/

-- ====================================================================
-- ÉTAPE 2: CRÉATION DES STRUCTURES DE BASE
-- ====================================================================

-- Exécuter setup_complete_rls.sql
-- Exécuter setup_safe_triggers.sql  
-- Exécuter setup_lead_actions.sql

-- ====================================================================
-- ÉTAPE 3: VALIDATION DE L'INSTALLATION
-- ====================================================================

-- Vérifier que tout est correctement installé
DO $$
DECLARE
    step_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🚀 DÉBUT DE LA VALIDATION DE L''INSTALLATION';
    
    -- Vérifier les tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fichiers_import') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Table fichiers_import vérifiée';
    ELSE
        RAISE NOTICE '❌ Table fichiers_import manquante';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Table leads vérifiée';
    ELSE
        RAISE NOTICE '❌ Table leads manquante';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lead_actions') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Table lead_actions vérifiée';
    ELSE
        RAISE NOTICE '❌ Table lead_actions manquante';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'campaign_file_links') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Table campaign_file_links vérifiée';
    ELSE
        RAISE NOTICE '❌ Table campaign_file_links manquante';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_logs') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Table sync_logs vérifiée';
    ELSE
        RAISE NOTICE '❌ Table sync_logs manquante';
    END IF;
    
    -- Vérifier RLS activé
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE tablename = 'fichiers_import' 
        AND rowsecurity = true
    ) THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ RLS activé sur fichiers_import';
    ELSE
        RAISE NOTICE '❌ RLS non activé sur fichiers_import';
    END IF;
    
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE tablename = 'leads' 
        AND rowsecurity = true
    ) THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ RLS activé sur leads';
    ELSE
        RAISE NOTICE '❌ RLS non activé sur leads';
    END IF;
    
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE tablename = 'lead_actions' 
        AND rowsecurity = true
    ) THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ RLS activé sur lead_actions';
    ELSE
        RAISE NOTICE '❌ RLS non activé sur lead_actions';
    END IF;
    
    -- Vérifier les triggers
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_safe_sync_leads_on_insert') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Trigger insert vérifié';
    ELSE
        RAISE NOTICE '❌ Trigger insert manquant';
    END IF;
    
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_safe_sync_leads_on_update') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Trigger update vérifié';
    ELSE
        RAISE NOTICE '❌ Trigger update manquant';
    END IF;
    
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_safe_sync_leads_on_delete') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Trigger delete vérifié';
    ELSE
        RAISE NOTICE '❌ Trigger delete manquant';
    END IF;
    
    -- Vérifier les fonctions RPC
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'manual_sync_file') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Fonction manual_sync_file vérifiée';
    ELSE
        RAISE NOTICE '❌ Fonction manual_sync_file manquante';
    END IF;
    
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'create_lead_action') THEN
        step_count := step_count + 1;
        RAISE NOTICE '✅ Fonction create_lead_action vérifiée';
    ELSE
        RAISE NOTICE '❌ Fonction create_lead_action manquante';
    END IF;
    
    -- Résultat final
    RAISE NOTICE '';
    RAISE NOTICE '📊 RÉSULTAT: %/15 étapes réussies', step_count;
    
    IF step_count = 15 THEN
        RAISE NOTICE '🎉 INSTALLATION COMPLÈTE RÉUSSIE !';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 Vous pouvez maintenant tester l''import de fichiers';
        RAISE NOTICE '📝 Les RLS sont activés et sécurisés';
        RAISE NOTICE '⚡ Les triggers sont protégés contre la récursion';
        RAISE NOTICE '🔧 Les fonctions RPC sont disponibles';
    ELSE
        RAISE NOTICE '⚠️  INSTALLATION INCOMPLÈTE - Vérifiez les erreurs ci-dessus';
    END IF;
    
END $$;

-- ====================================================================
-- ÉTAPE 4: TEST DE FONCTIONNEMENT
-- ====================================================================

-- Test simple d'insertion (uniquement si les tables sont vides)
DO $$
DECLARE
    test_user_id UUID;
    test_file_id UUID := gen_random_uuid();
    files_count INTEGER;
    users_count INTEGER;
BEGIN
    -- Compter les fichiers existants
    SELECT COUNT(*) INTO files_count FROM fichiers_import;
    
    -- Compter les utilisateurs existants
    SELECT COUNT(*) INTO users_count FROM auth.users;
    
    IF files_count = 0 AND users_count > 0 THEN
        RAISE NOTICE '🧪 CRÉATION D''UN FICHIER DE TEST...';
        
        -- Utiliser le premier utilisateur existant
        SELECT id INTO test_user_id 
        FROM auth.users 
        LIMIT 1;
        
        -- Insérer un fichier de test
        INSERT INTO fichiers_import (
            id, nom, chemin, statut, user_id, 
            donnees, nb_lignes, nb_lignes_importees,
            created_at, updated_at
        ) VALUES (
            test_file_id,
            'test_import.csv',
            'test/test_import.csv',
            'actif',
            test_user_id,
            '[
                {"nom": "Test", "prenom": "User", "email": "test@example.com", "telephone": "0123456789"},
                {"nom": "Demo", "prenom": "Lead", "email": "demo@example.com", "telephone": "0987654321"}
            ]'::jsonb,
            2,
            0,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Fichier de test créé (ID: %)', test_file_id;
        RAISE NOTICE '🔄 Les triggers devraient créer automatiquement les leads';
        RAISE NOTICE '📊 Vérifiez les tables leads et sync_logs';
        
        -- Pause pour laisser les triggers s'exécuter
        PERFORM pg_sleep(1);
        
        -- Vérifier le résultat
        PERFORM manual_sync_file(test_file_id);
        
    ELSIF users_count = 0 THEN
        RAISE NOTICE 'ℹ️  Aucun utilisateur trouvé - test automatique sauté';
        RAISE NOTICE '📝 Créez d''abord un utilisateur, puis relancez le test si nécessaire';
    ELSE
        RAISE NOTICE 'ℹ️  Tables non vides - pas de test automatique';
    END IF;
    
END $$;

-- ====================================================================
-- ÉTAPE 5: RAPPORT D'ÉTAT ACTUEL
-- ====================================================================

DO $$
DECLARE
    record_count INTEGER;
BEGIN
    RAISE NOTICE '📊 ÉTAT ACTUEL DES TABLES:';
    
    -- fichiers_import
    SELECT COUNT(*) INTO record_count FROM fichiers_import;
    RAISE NOTICE 'fichiers_import: % enregistrements', record_count;
    
    -- leads
    SELECT COUNT(*) INTO record_count FROM leads;
    RAISE NOTICE 'leads: % enregistrements', record_count;
    
    -- lead_actions
    SELECT COUNT(*) INTO record_count FROM lead_actions;
    RAISE NOTICE 'lead_actions: % enregistrements', record_count;
    
    -- campaign_file_links
    SELECT COUNT(*) INTO record_count FROM campaign_file_links;
    RAISE NOTICE 'campaign_file_links: % enregistrements', record_count;
    
    -- sync_logs
    SELECT COUNT(*) INTO record_count FROM sync_logs;
    RAISE NOTICE 'sync_logs: % enregistrements', record_count;
    
END $$;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 INSTALLATION TERMINÉE !';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Prochaines étapes recommandées:';
    RAISE NOTICE '1. Testez l''import d''un fichier via l''interface';
    RAISE NOTICE '2. Vérifiez que les leads sont créés automatiquement';
    RAISE NOTICE '3. Testez la création d''actions sur les leads';
    RAISE NOTICE '4. Vérifiez les permissions RLS avec différents utilisateurs';
END $$;
