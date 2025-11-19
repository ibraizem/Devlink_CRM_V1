-- ====================================================================
-- VÉRIFICATION DES DONNÉES DES FICHIERS
-- ====================================================================

-- 1. Vérifier la structure et les données des fichiers
SELECT 'Détails des fichiers:' as info;
SELECT 
    id,
    nom,
    statut,
    nb_lignes,
    nb_lignes_importees,
    donnees IS NOT NULL as has_donnees,
    CASE 
        WHEN donnees IS NOT NULL THEN jsonb_typeof(donnees)
        ELSE 'NULL'
    END as donnees_type,
    CASE 
        WHEN donnees IS NOT NULL THEN jsonb_array_length(donnees)
        ELSE 0
    END as donnees_array_length,
    user_id,
    created_at
FROM fichiers_import
ORDER BY created_at DESC;

-- 2. Vérifier le contenu brut de donnees si présent
SELECT 'Contenu des données (si non null):' as info;
DO $$
DECLARE
    file_record RECORD;
    i INTEGER;
BEGIN
    FOR file_record IN 
        SELECT id, nom, donnees 
        FROM fichiers_import 
        WHERE donnees IS NOT NULL 
        ORDER BY created_at DESC
        LIMIT 3
    LOOP
        RAISE NOTICE 'Fichier: % (%)', file_record.nom, file_record.id;
        
        IF jsonb_typeof(file_record.donnees) = 'array' THEN
            RAISE NOTICE 'Type: array, Longueur: %', jsonb_array_length(file_record.donnees);
            
            -- Afficher les 2 premiers éléments
            FOR i IN 0..LEAST(1, jsonb_array_length(file_record.donnees)-1) LOOP
                RAISE NOTICE 'Élément %: %', i+1, file_record.donnees->>i;
            END LOOP;
        ELSE
            RAISE NOTICE 'Type: %, Contenu: %', jsonb_typeof(file_record.donnees), file_record.donnees;
        END IF;
        
        RAISE NOTICE '---';
    END LOOP;
END $$;

-- 3. Vérifier s'il y a des fichiers avec des données mais non traités
SELECT 'Fichiers avec données potentielles:' as info;
SELECT 
    id,
    nom,
    statut,
    nb_lignes,
    CASE 
        WHEN donnees IS NOT NULL THEN 'Has donnees'
        ELSE 'No donnees'
    END as data_status,
    CASE 
        WHEN nb_lignes > 0 THEN 'Has nb_lignes'
        ELSE 'No nb_lignes'
    END as lignes_status
FROM fichiers_import
WHERE (donnees IS NOT NULL OR nb_lignes > 0)
ORDER BY created_at DESC;

-- 4. Vérifier les colonnes qui pourraient contenir les données
SELECT 'Colonnes de données dans fichiers_import:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fichiers_import' 
AND table_schema = 'public'
AND (column_name LIKE '%data%' OR column_name LIKE '%contenu%' OR column_name LIKE '%donnees%')
ORDER BY column_name;
