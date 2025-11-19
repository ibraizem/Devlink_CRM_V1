-- ====================================================================
-- SCRIPT DE DIAGNOSTIC POUR LA SYNCHRONISATION
-- ====================================================================

-- 1. Vérifier les tables existent
SELECT 'Tables existantes:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('leads', 'fichiers_import', 'sync_logs', 'campaign_file_links')
AND table_schema = 'public'
ORDER BY table_name;

-- 2. Vérifier les fichiers avec données
SELECT 'Fichiers avec donnees:' as info;
SELECT id, nom, statut, 
       CASE WHEN donnees IS NOT NULL THEN jsonb_array_length(donnees) ELSE 0 END as nb_donnees,
       nb_lignes_importees,
       user_id
FROM fichiers_import 
WHERE donnees IS NOT NULL 
ORDER BY created_at DESC;

-- 3. Vérifier les associations fichier-campagne
SELECT 'Associations fichier-campagne:' as info;
SELECT * FROM campaign_file_links ORDER BY created_at DESC LIMIT 10;

-- 4. Vérifier les leads existants
SELECT 'Leads existants:' as info;
SELECT COUNT(*) as total_leads,
       COUNT(CASE WHEN fichier_id IS NOT NULL THEN 1 END) as leads_avec_fichier,
       COUNT(CASE WHEN source_import = 'fichier_import' THEN 1 END) as leads_importes
FROM leads;

-- 5. Vérifier les fonctions RPC
SELECT 'Fonctions RPC disponibles:' as info;
SELECT proname FROM pg_proc WHERE proname LIKE '%sync%' ORDER BY proname;

-- 6. Tester manuellement la synchronisation d'un fichier
SELECT 'Test synchronisation manuelle:' as info;
DO $$
DECLARE
    file_record RECORD;
    campaign_ids UUID[];
BEGIN
    -- Récupérer un fichier avec des données
    SELECT * INTO file_record
    FROM fichiers_import 
    WHERE donnees IS NOT NULL 
    AND jsonb_array_length(donnees) > 0
    LIMIT 1;
    
    IF file_record IS NOT NULL THEN
        RAISE NOTICE 'Fichier trouvé: % (ID: %)', file_record.nom, file_record.id;
        RAISE NOTICE 'Nombre de données: %', jsonb_array_length(file_record.donnees);
        
        -- Récupérer les campagnes associées
        SELECT ARRAY_AGG(DISTINCT campaign_id) INTO campaign_ids
        FROM campaign_file_links
        WHERE fichier_id = file_record.id;
        
        IF campaign_ids IS NOT NULL THEN
            RAISE NOTICE 'Campagnes associées: %', array_length(campaign_ids, 1);
        ELSE
            RAISE NOTICE 'Aucune campagne associée - création de leads sans campagne';
        END IF;
    ELSE
        RAISE NOTICE 'Aucun fichier avec des données trouvé';
    END IF;
END $$;

-- 7. Vérifier les logs de synchronisation
SELECT 'Logs de synchronisation:' as info;
SELECT sync_type, fichier_id, leads_before, leads_after, sync_date, error_message
FROM sync_logs 
ORDER BY sync_date DESC 
LIMIT 5;
