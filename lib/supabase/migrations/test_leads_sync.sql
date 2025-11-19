-- ====================================================================
-- SCRIPT DE TEST POUR LA SYNCHRONISATION DES LEADS
-- ====================================================================

-- 1. Vérifier que les tables existent
DO $$
BEGIN
    -- Vérifier la table leads
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'leads') THEN
        RAISE EXCEPTION 'La table leads n''existe pas';
    END IF;
    
    -- Vérifier la table fichiers_import
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'fichiers_import') THEN
        RAISE EXCEPTION 'La table fichiers_import n''existe pas';
    END IF;
    
    -- Vérifier la table campaign_files
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'campaign_files') THEN
        RAISE EXCEPTION 'La table campaign_files n''existe pas';
    END IF;
    
    RAISE NOTICE '✅ Tables vérifiées avec succès';
END $$;

-- 2. Vérifier que les triggers existent
DO $$
BEGIN
    -- Vérifier les triggers sur fichiers_import
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_sync_leads_on_insert') THEN
        RAISE EXCEPTION 'Le trigger trigger_sync_leads_on_insert n''existe pas';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_sync_leads_on_update') THEN
        RAISE EXCEPTION 'Le trigger trigger_sync_leads_on_update n''existe pas';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_sync_leads_on_delete') THEN
        RAISE EXCEPTION 'Le trigger trigger_sync_leads_on_delete n''existe pas';
    END IF;
    
    RAISE NOTICE '✅ Triggers vérifiés avec succès';
END $$;

-- 3. Vérifier que les fonctions RPC existent
DO $$
BEGIN
    -- Vérifier la fonction count_campaign_leads
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'count_campaign_leads') THEN
        RAISE EXCEPTION 'La fonction count_campaign_leads n''existe pas';
    END IF;
    
    -- Vérifier la fonction get_campaign_progress
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'get_campaign_progress') THEN
        RAISE EXCEPTION 'La fonction get_campaign_progress n''existe pas';
    END IF;
    
    -- Vérifier la fonction manual_sync_all_leads
    IF NOT EXISTS (SELECT FROM pg_proc WHERE proname = 'manual_sync_all_leads') THEN
        RAISE EXCEPTION 'La fonction manual_sync_all_leads n''existe pas';
    END IF;
    
    RAISE NOTICE '✅ Fonctions RPC vérifiées avec succès';
END $$;

-- 4. Créer des données de test si elles n'existent pas
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_campaign_id UUID := gen_random_uuid();
    test_file_id UUID := gen_random_uuid();
    test_team_id UUID := gen_random_uuid();
BEGIN
    -- Insérer un utilisateur de test
    INSERT INTO users_profile (id, email, nom, prenom)
    SELECT test_user_id, 'test@example.com', 'Test', 'User'
    WHERE NOT EXISTS (SELECT 1 FROM users_profile WHERE id = test_user_id);
    
    -- Insérer une équipe de test
    INSERT INTO teams (id, name, created_by)
    SELECT test_team_id, 'Test Team', test_user_id
    WHERE NOT EXISTS (SELECT 1 FROM teams WHERE id = test_team_id);
    
    -- Associer l'utilisateur à l'équipe
    INSERT INTO team_members (team_id, user_id, role)
    SELECT test_team_id, test_user_id, 'admin'
    WHERE NOT EXISTS (SELECT 1 FROM team_members WHERE team_id = test_team_id AND user_id = test_user_id);
    
    -- Insérer une campagne de test
    INSERT INTO campaigns (id, name, description, created_by, status)
    SELECT test_campaign_id, 'Test Campaign', 'Campaign for testing leads sync', test_user_id, 'active'
    WHERE NOT EXISTS (SELECT 1 FROM campaigns WHERE id = test_campaign_id);
    
    -- Associer la campagne à l'équipe
    INSERT INTO team_campaigns (team_id, campaign_id, assigned_by)
    SELECT test_team_id, test_campaign_id, test_user_id
    WHERE NOT EXISTS (SELECT 1 FROM team_campaigns WHERE team_id = test_team_id AND campaign_id = test_campaign_id);
    
    -- Insérer un fichier de test avec des données JSON
    INSERT INTO fichiers_import (
        id, 
        nom, 
        chemin, 
        statut, 
        user_id, 
        donnees,
        date_import,
        nb_lignes,
        nb_lignes_importees,
        created_at,
        updated_at
    )
    SELECT 
        test_file_id,
        'test_file.csv',
        '/test/test_file.csv',
        'actif',
        test_user_id,
        '[
            {"nom": "Doe", "prenom": "John", "email": "john@example.com", "telephone": "0123456789"},
            {"nom": "Smith", "prenom": "Jane", "email": "jane@example.com", "telephone": "0987654321"},
            {"nom": "Brown", "prenom": "Bob", "email": "bob@example.com", "telephone": "0612345678"}
        ]'::jsonb,
        NOW(),
        3,
        3,
        NOW(),
        NOW()
    WHERE NOT EXISTS (SELECT 1 FROM fichiers_import WHERE id = test_file_id);
    
    -- Associer le fichier à la campagne
    INSERT INTO campaign_files (campaign_id, file_id, created_at)
    SELECT test_campaign_id, test_file_id, NOW()
    WHERE NOT EXISTS (SELECT 1 FROM campaign_files WHERE campaign_id = test_campaign_id AND file_id = test_file_id);
    
    RAISE NOTICE '✅ Données de test créées avec succès';
    RAISE NOTICE '📊 User ID: %', test_user_id;
    RAISE NOTICE '📊 Team ID: %', test_team_id;
    RAISE NOTICE '📊 Campaign ID: %', test_campaign_id;
    RAISE NOTICE '📊 File ID: %', test_file_id;
END $$;

-- 5. Tester la synchronisation manuelle
DO $$
DECLARE
    sync_result INTEGER;
BEGIN
    -- Exécuter la synchronisation manuelle
    SELECT manual_sync_all_leads() INTO sync_result;
    
    RAISE NOTICE '✅ Synchronisation manuelle exécutée: % fichiers traités', sync_result;
    
    -- Vérifier que les leads ont été créés
    PERFORM FROM leads LIMIT 1;
    IF FOUND THEN
        RAISE NOTICE '✅ Leads créés avec succès dans la table leads';
        
        -- Afficher les statistiques
        RAISE NOTICE '📈 Nombre total de leads: %', (SELECT COUNT(*) FROM leads);
        RAISE NOTICE '📈 Leads avec statut "nouveau": %', (SELECT COUNT(*) FROM leads WHERE statut = 'nouveau');
        
        -- Tester la fonction RPC count_campaign_leads
        PERFORM FROM count_campaign_leads((SELECT id FROM campaigns LIMIT 1)) LIMIT 1;
        RAISE NOTICE '✅ Fonction count_campaign_leads testée avec succès';
        
        -- Tester la fonction RPC get_campaign_progress
        PERFORM FROM get_campaign_progress((SELECT id FROM campaigns LIMIT 1)) LIMIT 1;
        RAISE NOTICE '✅ Fonction get_campaign_progress testée avec succès';
        
    ELSE
        RAISE EXCEPTION '❌ Aucun lead n''a été créé dans la table leads';
    END IF;
END $$;

-- 6. Afficher l'état final
SELECT 
    'leads' as table_name, 
    COUNT(*) as record_count
FROM leads
UNION ALL
SELECT 
    'fichiers_import' as table_name, 
    COUNT(*) as record_count
FROM fichiers_import
UNION ALL
SELECT 
    'campaign_files' as table_name, 
    COUNT(*) as record_count
FROM campaign_files
ORDER BY table_name;

-- 7. Afficher les leads créés
SELECT 
    id,
    nom,
    prenom,
    email,
    telephone,
    statut,
    campaign_id,
    fichier_id,
    created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

RAISE NOTICE '🎉 Tests terminés avec succès!';
RAISE NOTICE '📝 Pour nettoyer les données de test, exécutez: DELETE FROM leads WHERE fichier_id IN (SELECT id FROM fichiers_import WHERE nom LIKE ''test%'');';
