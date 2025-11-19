-- ====================================================================
-- SCRIPT DE TEST POUR VÉRIFIER LA SYNCHRONISATION
-- ====================================================================

-- 1. Vérifier que les colonnes existent
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('leads', 'fichiers_import') 
AND column_name IN ('fichier_id', 'source_import', 'nb_lignes_importees', 'donnees')
ORDER BY table_name, column_name;

-- 2. Vérifier que les index existent
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('leads', 'fichiers_import', 'sync_logs')
AND indexname LIKE '%fichier_id%' OR indexname LIKE '%source_import%'
ORDER BY tablename, indexname;

-- 3. Tester la fonction manual_sync_all_leads
-- D'abord vérifier si elle existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'manual_sync_all_leads';

-- 4. Tester la fonction manual_sync_file_leads
-- D'abord vérifier si elle existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'manual_sync_file_leads';

-- 5. Compter les leads actuels
SELECT COUNT(*) as total_leads, 
       COUNT(CASE WHEN fichier_id IS NOT NULL THEN 1 END) as leads_with_file,
       COUNT(CASE WHEN source_import = 'fichier_import' THEN 1 END) as leads_from_file
FROM leads;

-- 6. Compter les fichiers actuels
SELECT COUNT(*) as total_files,
       COUNT(CASE WHEN donnees IS NOT NULL THEN 1 END) as files_with_data,
       COUNT(CASE WHEN nb_lignes_importees > 0 THEN 1 END) as files_with_imported_leads
FROM fichiers_import;

-- 7. Vérifier les triggers
SELECT tgname, tgrelid::regclass, tgfoid::regproc 
FROM pg_trigger 
WHERE tgname LIKE '%sync%' 
ORDER BY tgname;

-- Test simple d'insertion si nécessaire
-- SELECT manual_sync_all_leads();
