-- ====================================================================
-- SCRIPT DE TEST FINAL POUR VÉRIFIER LA SYNCHRONISATION
-- ====================================================================

-- 1. Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('leads', 'fichiers_import', 'sync_logs', 'campaign_file_links')
ORDER BY table_name;

-- 2. Vérifier que les colonnes existent
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('leads', 'fichiers_import', 'sync_logs', 'campaign_file_links') 
AND column_name IN ('fichier_id', 'source_import', 'nb_lignes_importees', 'donnees', 'campaign_id')
ORDER BY table_name, column_name;

-- 3. Vérifier que les index existent
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('leads', 'fichiers_import', 'sync_logs', 'campaign_file_links')
AND (indexname LIKE '%fichier_id%' OR indexname LIKE '%source_import%' OR indexname LIKE '%campaign_file_links%')
ORDER BY tablename, indexname;

-- 4. Vérifier que les fonctions RPC existent
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('manual_sync_all_leads', 'manual_sync_file_leads', 'sync_leads_from_files', 'sync_leads_from_campaign_file_links')
ORDER BY proname;

-- 5. Vérifier que les triggers existent
SELECT tgname, tgrelid::regclass, tgfoid::regproc 
FROM pg_trigger 
WHERE tgname LIKE '%sync%' 
ORDER BY tgname;

-- 6. Compter les enregistrements actuels
SELECT 'leads' as table_name, COUNT(*) as count FROM leads
UNION ALL
SELECT 'fichiers_import', COUNT(*) FROM fichiers_import
UNION ALL
SELECT 'sync_logs', COUNT(*) FROM sync_logs
UNION ALL
SELECT 'campaign_file_links', COUNT(*) FROM campaign_file_links
ORDER BY table_name;

-- 7. Test d'insertion de données de test
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
    test_campaign_id UUID := '00000000-0000-0000-0000-000000000001';
    test_file_id UUID := gen_random_uuid();
BEGIN
    -- Créer un fichier de test
    INSERT INTO fichiers_import (
        id, nom, chemin, statut, user_id, donnees, nb_lignes_importees
    ) VALUES (
        test_file_id,
        'test_fichier_sync.csv',
        '/tmp/test_fichier_sync.csv',
        'actif',
        test_user_id,
        '[
            {"nom": "Test1", "prenom": "User1", "email": "test1@example.com", "telephone": "0123456789"},
            {"nom": "Test2", "prenom": "User2", "email": "test2@example.com", "telephone": "0987654321"}
        ]'::jsonb,
        0
    );
    
    -- Associer le fichier à une campagne
    INSERT INTO campaign_file_links (campaign_id, fichier_id)
    VALUES (test_campaign_id, test_file_id)
    ON CONFLICT (campaign_id, fichier_id) DO NOTHING;
    
    RAISE NOTICE '✅ Données de test créées avec succès';
    RAISE NOTICE '📊 File ID: %', test_file_id;
END $$;

-- 8. Tester la fonction de synchronisation manuelle
SELECT manual_sync_all_leads() as synced_count;

-- 9. Vérifier les résultats
SELECT 
    COUNT(*) as total_leads,
    COUNT(CASE WHEN fichier_id IS NOT NULL THEN 1 END) as leads_with_file,
    COUNT(CASE WHEN source_import = 'fichier_import' THEN 1 END) as leads_from_file,
    COUNT(CASE WHEN campaign_id IS NOT NULL THEN 1 END) as leads_with_campaign
FROM leads;

-- 10. Vérifier les logs de synchronisation
SELECT sync_type, fichier_id, leads_before, leads_after, sync_date
FROM sync_logs
ORDER BY sync_date DESC
LIMIT 5;

-- Nettoyage (optionnel)
-- DELETE FROM campaign_file_links WHERE fichier_id IN (SELECT id FROM fichiers_import WHERE nom LIKE 'test_fichier_sync%');
-- DELETE FROM leads WHERE source_import = 'fichier_import' AND fichier_id IN (SELECT id FROM fichiers_import WHERE nom LIKE 'test_fichier_sync%');
-- DELETE FROM fichiers_import WHERE nom LIKE 'test_fichier_sync%';
