-- ====================================================================
-- APPLICATION DES CORRECTIONS POUR LA SYNCHRONISATION
-- ====================================================================

-- 1. Désactiver temporairement les triggers
DROP TRIGGER IF EXISTS sync_leads_on_file_change ON fichiers_import;
DROP TRIGGER IF EXISTS sync_leads_on_campaign_file_link_change ON campaign_file_links;

-- 2. Mettre à jour les fonctions et triggers
-- (Le contenu sera copié depuis sync_leads_trigger.sql)

-- 3. Recréer les triggers
CREATE TRIGGER sync_leads_on_file_change
    AFTER INSERT OR UPDATE OR DELETE ON fichiers_import
    FOR EACH ROW EXECUTE FUNCTION sync_leads_from_files();

CREATE TRIGGER sync_leads_on_campaign_file_link_change
    AFTER INSERT OR UPDATE OR DELETE ON campaign_file_links
    FOR EACH ROW EXECUTE FUNCTION sync_leads_from_campaign_file_links();

-- 4. Test simple
SELECT 'Test de synchronisation après correction:' as info;

-- Trouver un fichier avec des données
DO $$
DECLARE
    file_id UUID;
    leads_before INTEGER;
    leads_after INTEGER;
BEGIN
    SELECT id INTO file_id
    FROM fichiers_import 
    WHERE donnees IS NOT NULL 
    AND jsonb_array_length(donnees) > 0
    AND statut = 'actif'
    LIMIT 1;
    
    IF file_id IS NOT NULL THEN
        RAISE NOTICE 'Fichier trouvé pour test: %', file_id;
        
        -- Compter les leads avant
        SELECT COUNT(*) INTO leads_before
        FROM leads
        WHERE fichier_id = file_id;
        
        RAISE NOTICE 'Leads avant sync: %', leads_before;
        
        -- Déclencher la synchronisation
        PERFORM manual_sync_file_leads(file_id);
        
        -- Compter les leads après
        SELECT COUNT(*) INTO leads_after
        FROM leads
        WHERE fichier_id = file_id;
        
        RAISE NOTICE 'Leads après sync: %', leads_after;
        RAISE NOTICE 'Différence: % leads créés', leads_after - leads_before;
    ELSE
        RAISE NOTICE 'Aucun fichier actif avec des données trouvé pour le test';
    END IF;
END $$;

-- 5. Vérifier les résultats
SELECT 'Résultats finaux:' as info;
SELECT 
    f.id,
    f.nom,
    f.statut,
    CASE WHEN f.donnees IS NOT NULL THEN jsonb_array_length(f.donnees) ELSE 0 END as nb_donnees,
    f.nb_lignes_importees,
    COUNT(l.id) as nb_leads_reels
FROM fichiers_import f
LEFT JOIN leads l ON l.fichier_id = f.id
WHERE f.donnees IS NOT NULL
GROUP BY f.id, f.nom, f.statut, f.nb_lignes_importees
ORDER BY f.created_at DESC
LIMIT 5;
