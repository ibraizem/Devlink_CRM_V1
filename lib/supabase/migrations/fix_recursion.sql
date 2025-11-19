-- ====================================================================
-- CORRECTION DE LA RÉCURSION INFINIE DANS LES TRIGGERS
-- ====================================================================

-- 1. Désactiver les triggers existants
DROP TRIGGER IF EXISTS sync_leads_on_file_change ON fichiers_import;
DROP TRIGGER IF EXISTS trigger_sync_leads_on_delete ON fichiers_import;
DROP TRIGGER IF EXISTS sync_leads_on_campaign_file_link_change ON campaign_file_links;
DROP TRIGGER IF EXISTS trigger_sync_leads_on_campaign_file_delete ON campaign_file_links;

-- 2. Recréer les fonctions avec protection contre la récursion
-- (Le contenu sera copié depuis sync_leads_trigger.sql mis à jour)

-- 3. Recréer les triggers
CREATE TRIGGER sync_leads_on_file_change
    AFTER INSERT OR UPDATE ON fichiers_import
    FOR EACH ROW EXECUTE FUNCTION sync_leads_from_files();

CREATE TRIGGER trigger_sync_leads_on_delete
    AFTER DELETE ON fichiers_import
    FOR EACH ROW EXECUTE FUNCTION sync_leads_from_files();

CREATE TRIGGER sync_leads_on_campaign_file_link_change
    AFTER INSERT OR UPDATE ON campaign_file_links
    FOR EACH ROW EXECUTE FUNCTION sync_leads_from_campaign_file_links();

CREATE TRIGGER trigger_sync_leads_on_campaign_file_delete
    AFTER DELETE ON campaign_file_links
    FOR EACH ROW EXECUTE FUNCTION sync_leads_from_campaign_file_links();

-- 4. Test de la fonction manual_sync_file_leads
SELECT 'Test de la fonction manual_sync_file_leads:' as info;

DO $$
DECLARE
    file_id UUID;
    result INTEGER;
BEGIN
    -- Trouver un fichier avec des données
    SELECT id INTO file_id
    FROM fichiers_import 
    WHERE donnees IS NOT NULL 
    AND jsonb_array_length(donnees) > 0
    AND statut = 'actif'
    LIMIT 1;
    
    IF file_id IS NOT NULL THEN
        RAISE NOTICE 'Test avec fichier: %', file_id;
        
        -- Tester la fonction manuelle
        BEGIN
            SELECT manual_sync_file_leads(file_id) INTO result;
            RAISE NOTICE 'Résultat: % leads synchronisés', result;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erreur: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Aucun fichier trouvé pour le test';
    END IF;
END $$;

-- 5. Vérifier l'état des tables après correction
SELECT 'État après correction:' as info;
SELECT 
    'fichiers_import' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN donnees IS NOT NULL THEN 1 END) as with_data,
    COUNT(CASE WHEN statut = 'actif' THEN 1 END) as active
FROM fichiers_import

UNION ALL

SELECT 
    'leads' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN fichier_id IS NOT NULL THEN 1 END) as from_files,
    COUNT(CASE WHEN source_import = 'fichier_import' THEN 1 END) as imported
FROM leads

UNION ALL

SELECT 
    'campaign_file_links' as table_name,
    COUNT(*) as total_records,
    0 as with_data,
    0 as active
FROM campaign_file_links;
