-- ====================================================================
-- TEST D'IMPORTATION DE DONNÉES DE FICHIER
-- ====================================================================

-- 1. Créer des données de test pour un fichier existant
DO $$
DECLARE
    file_id UUID;
    test_data JSONB;
BEGIN
    -- Récupérer un fichier existant
    SELECT id INTO file_id
    FROM fichiers_import 
    WHERE statut = 'actif'
    LIMIT 1;
    
    IF file_id IS NOT NULL THEN
        RAISE NOTICE 'Test avec fichier: %', file_id;
        
        -- Créer des données de test
        test_data := '[
            {
                "nom": "Dupont",
                "prenom": "Jean",
                "email": "jean.dupont@email.com",
                "telephone": "0612345678"
            },
            {
                "nom": "Martin",
                "prenom": "Marie",
                "email": "marie.martin@email.com",
                "telephone": "0623456789"
            },
            {
                "nom": "Bernard",
                "prenom": "Pierre",
                "telephone": "0634567890"
            }
        ]'::JSONB;
        
        -- Mettre à jour le fichier avec les données de test
        UPDATE fichiers_import
        SET 
            donnees = test_data,
            nb_lignes = jsonb_array_length(test_data),
            updated_at = NOW()
        WHERE id = file_id;
        
        RAISE NOTICE 'Fichier mis à jour avec % leads de test', jsonb_array_length(test_data);
        
        -- Tester la synchronisation
        PERFORM manual_sync_file_leads(file_id);
        
        -- Vérifier les résultats
        RAISE NOTICE 'Leads créés: %', (
            SELECT COUNT(*) 
            FROM leads 
            WHERE fichier_id = file_id
        );
        
    ELSE
        RAISE NOTICE 'Aucun fichier actif trouvé pour le test';
    END IF;
END $$;

-- 2. Vérifier les résultats
SELECT 'Résultats après test:' as info;
SELECT 
    f.id,
    f.nom,
    f.statut,
    f.nb_lignes,
    CASE WHEN f.donnees IS NOT NULL THEN jsonb_array_length(f.donnees) ELSE 0 END as nb_donnees,
    COUNT(l.id) as nb_leads_created
FROM fichiers_import f
LEFT JOIN leads l ON l.fichier_id = f.id
WHERE f.donnees IS NOT NULL
GROUP BY f.id, f.nom, f.statut, f.nb_lignes
ORDER BY f.created_at DESC;

-- 3. Vérifier les leads créés
SELECT 'Leads créés:' as info;
SELECT 
    id,
    nom,
    prenom,
    email,
    telephone,
    statut,
    fichier_id,
    source_import,
    created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;
