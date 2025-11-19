-- ====================================================================
-- TRIGGER POUR SYNCHRONISER LES LEADS DEPUIS LES FICHIERS IMPORTÉS
-- ====================================================================

-- 1. Ajouter la colonne manquante à la table leads (déjà existante selon le schéma)
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS fichier_id UUID REFERENCES fichiers_import(id);

-- 2. Ajouter la colonne source_import si elle n'existe pas (déjà existante selon le schéma)
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_import TEXT DEFAULT 'manuel';

-- 3. Créer la table de liaison entre fichiers et campagnes si elle n'existe pas
CREATE TABLE IF NOT EXISTS campaign_file_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    fichier_id UUID NOT NULL REFERENCES fichiers_import(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, fichier_id)
);

-- 4. Ajouter les colonnes manquantes à la table fichiers_import si nécessaire (déjà existantes selon le schéma)
-- ALTER TABLE fichiers_import ADD COLUMN IF NOT EXISTS nb_lignes_importees INTEGER DEFAULT 0;
-- ALTER TABLE fichiers_import ADD COLUMN IF NOT EXISTS donnees JSONB;

-- 2. Fonction pour créer/mettre à jour les leads depuis les fichiers
CREATE OR REPLACE FUNCTION sync_leads_from_files()
RETURNS TRIGGER AS $$
DECLARE
    file_record RECORD;
    campaign_ids UUID[];
    current_campaign_id UUID;
    leads_inserted INTEGER;
BEGIN
    -- Éviter la récursion infinie
    IF pg_trigger_depth() > 1 THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Récupérer les informations du fichier modifié
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        file_record := NEW;
    ELSIF TG_OP = 'DELETE' THEN
        file_record := OLD;
    END IF;

    -- Récupérer les campagnes associées à ce fichier
    SELECT ARRAY_AGG(DISTINCT campaign_id) INTO campaign_ids
    FROM campaign_file_links
    WHERE fichier_id = file_record.id;

    -- Si le fichier a des données (avec ou sans campagne)
    IF file_record.donnees IS NOT NULL AND jsonb_array_length(file_record.donnees) > 0 THEN
        -- Si le fichier est associé à des campagnes
        IF campaign_ids IS NOT NULL AND array_length(campaign_ids, 1) > 0 THEN
            -- Pour chaque campagne associée
            FOREACH current_campaign_id IN ARRAY campaign_ids LOOP
                -- Supprimer les anciens leads pour ce fichier/campagne
                DELETE FROM leads 
                WHERE fichier_id = file_record.id 
                AND campaign_id = current_campaign_id;

                -- Insérer les nouveaux leads si le fichier est actif
                IF file_record.statut = 'actif' THEN
                    INSERT INTO leads (
                        id,
                        nom,
                        prenom,
                        email,
                        telephone,
                        statut,
                        campaign_id,
                        agent_id,
                        fichier_id,
                        created_at,
                        updated_at,
                        source_import
                    )
                    SELECT 
                        gen_random_uuid(),
                        COALESCE(TRIM((donnees->>'nom')::TEXT), 'Inconnu'),
                        COALESCE(TRIM((donnees->>'prenom')::TEXT), ''),
                        COALESCE(TRIM((donnees->>'email')::TEXT), NULL),
                        COALESCE(TRIM((donnees->>'telephone')::TEXT), ''),
                        'nouveau', -- Statut par défaut pour les leads importés
                        current_campaign_id,
                        file_record.user_id, -- L'utilisateur qui a importé devient l'agent par défaut
                        file_record.id,
                        file_record.created_at,
                        file_record.updated_at,
                        'fichier_import'
                    FROM jsonb_array_elements(file_record.donnees) AS donnees
                    WHERE (
                        (donnees->>'nom') IS NOT NULL AND TRIM((donnees->>'nom')::TEXT) != ''
                        OR (donnees->>'email') IS NOT NULL AND TRIM((donnees->>'email')::TEXT) != ''
                        OR (donnees->>'telephone') IS NOT NULL AND TRIM((donnees->>'telephone')::TEXT) != ''
                    );
                END IF;
            END LOOP;
        ELSE
            -- Aucune campagne associée - créer les leads sans campagne
            -- Supprimer les anciens leads pour ce fichier (sans campagne)
            DELETE FROM leads 
            WHERE fichier_id = file_record.id 
            AND campaign_id IS NULL;

            -- Insérer les nouveaux leads si le fichier est actif
            IF file_record.statut = 'actif' THEN
                INSERT INTO leads (
                    id,
                    nom,
                    prenom,
                    email,
                    telephone,
                    statut,
                    campaign_id,
                    agent_id,
                    fichier_id,
                    created_at,
                    updated_at,
                    source_import
                )
                SELECT 
                    gen_random_uuid(),
                    COALESCE(TRIM((donnees->>'nom')::TEXT), 'Inconnu'),
                    COALESCE(TRIM((donnees->>'prenom')::TEXT), ''),
                    COALESCE(TRIM((donnees->>'email')::TEXT), NULL),
                    COALESCE(TRIM((donnees->>'telephone')::TEXT), ''),
                    'nouveau', -- Statut par défaut pour les leads importés
                    NULL, -- Pas de campagne
                    file_record.user_id, -- L'utilisateur qui a importé devient l'agent par défaut
                    file_record.id,
                    file_record.created_at,
                    file_record.updated_at,
                    'fichier_import'
                FROM jsonb_array_elements(file_record.donnees) AS donnees
                WHERE (
                    (donnees->>'nom') IS NOT NULL AND TRIM((donnees->>'nom')::TEXT) != ''
                    OR (donnees->>'email') IS NOT NULL AND TRIM((donnees->>'email')::TEXT) != ''
                    OR (donnees->>'telephone') IS NOT NULL AND TRIM((donnees->>'telephone')::TEXT) != ''
                );
            END IF;
        END IF;
    END IF;

    -- Mettre à jour le compteur de leads importés pour le fichier
    UPDATE fichiers_import
    SET nb_lignes_importees = (
        SELECT COUNT(*) 
        FROM leads 
        WHERE fichier_id = file_record.id
    )
    WHERE id = file_record.id;

    -- Si c'est une suppression, nettoyer aussi les leads orphelins
    IF TG_OP = 'DELETE' THEN
        DELETE FROM leads WHERE fichier_id = file_record.id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer les triggers sur la table fichiers_import
DROP TRIGGER IF EXISTS trigger_sync_leads_on_insert ON fichiers_import;
CREATE TRIGGER trigger_sync_leads_on_insert
    AFTER INSERT ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_files();

DROP TRIGGER IF EXISTS trigger_sync_leads_on_update ON fichiers_import;
CREATE TRIGGER trigger_sync_leads_on_update
    AFTER UPDATE ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_files();

DROP TRIGGER IF EXISTS trigger_sync_leads_on_delete ON fichiers_import;
CREATE TRIGGER trigger_sync_leads_on_delete
    AFTER DELETE ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_files();

-- 4. Trigger pour la table campaign_file_links (quand un fichier est associé/dissocié d'une campagne)
CREATE OR REPLACE FUNCTION sync_leads_from_campaign_file_links()
RETURNS TRIGGER AS $$
DECLARE
    file_record RECORD;
BEGIN
    -- Éviter la récursion infinie
    IF pg_trigger_depth() > 1 THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Récupérer les informations du fichier
    SELECT * INTO file_record
    FROM fichiers_import
    WHERE id = COALESCE(NEW.fichier_id, OLD.fichier_id);

    IF file_record IS NOT NULL THEN
        -- Déclencher la synchronisation pour ce fichier
        PERFORM sync_leads_from_files();
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers sur campaign_file_links
DROP TRIGGER IF EXISTS trigger_sync_leads_on_campaign_file_insert ON campaign_file_links;
CREATE TRIGGER trigger_sync_leads_on_campaign_file_insert
    AFTER INSERT ON campaign_file_links
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_campaign_file_links();

DROP TRIGGER IF EXISTS trigger_sync_leads_on_campaign_file_delete ON campaign_file_links;
CREATE TRIGGER trigger_sync_leads_on_campaign_file_delete
    AFTER DELETE ON campaign_file_links
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_campaign_file_links();

-- 5. Fonction de synchronisation manuelle (pour les données existantes) - AMÉLIORÉE
CREATE OR REPLACE FUNCTION manual_sync_all_leads()
RETURNS INTEGER AS $$
DECLARE
    synced_count INTEGER := 0;
    file_record RECORD;
    total_leads_before INTEGER;
    total_leads_after INTEGER;
BEGIN
    -- Compter les leads avant la synchronisation
    SELECT COUNT(*) INTO total_leads_before FROM leads;
    
    -- Parcourir tous les fichiers actifs
    FOR file_record IN 
        SELECT * FROM fichiers_import 
        WHERE statut = 'actif' 
        AND donnees IS NOT NULL
        AND jsonb_array_length(donnees) > 0
    LOOP
        -- Synchroniser ce fichier
        UPDATE fichiers_import 
        SET updated_at = NOW()
        WHERE id = file_record.id;
        
        synced_count := synced_count + 1;
    END LOOP;
    
    -- Compter les leads après la synchronisation
    SELECT COUNT(*) INTO total_leads_after FROM leads;
    
    -- Journaliser la synchronisation
    INSERT INTO sync_logs (sync_type, files_processed, leads_before, leads_after, sync_date)
    VALUES ('manual_sync', synced_count, total_leads_before, total_leads_after, NOW());
    
    RETURN synced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction de synchronisation pour un fichier spécifique - NOUVEAU
CREATE OR REPLACE FUNCTION manual_sync_file_leads(p_file_id UUID)
RETURNS INTEGER AS $$
DECLARE
    file_record RECORD;
    leads_before INTEGER;
    leads_after INTEGER;
BEGIN
    -- Vérifier que le fichier existe
    SELECT * INTO file_record
    FROM fichiers_import
    WHERE id = p_file_id;
    
    IF file_record IS NULL THEN
        RAISE EXCEPTION 'Fichier non trouvé: %', p_file_id;
    END IF;
    
    -- Compter les leads avant
    SELECT COUNT(*) INTO leads_before
    FROM leads
    WHERE fichier_id = p_file_id;
    
    -- Déclencher la synchronisation
    UPDATE fichiers_import
    SET updated_at = NOW()
    WHERE id = p_file_id;
    
    -- Compter les leads après
    SELECT COUNT(*) INTO leads_after
    FROM leads
    WHERE fichier_id = p_file_id;
    
    -- Journaliser
    INSERT INTO sync_logs (sync_type, fichier_id, leads_before, leads_after, sync_date)
    VALUES ('file_sync', p_file_id, leads_before, leads_after, NOW());
    
    RETURN leads_after - leads_before;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Mise à jour du service d'importation pour utiliser les données structurées
CREATE OR REPLACE FUNCTION update_file_with_leads_data(
    p_file_id UUID,
    p_leads_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
    leads_count INTEGER;
BEGIN
    -- Valider les données
    IF p_leads_data IS NULL OR jsonb_array_length(p_leads_data) = 0 THEN
        RAISE EXCEPTION 'Aucune donnée de leads fournie';
    END IF;
    
    -- Mettre à jour le fichier avec les données des leads
    UPDATE fichiers_import 
    SET 
        donnees = p_leads_data,
        nb_lignes = jsonb_array_length(p_leads_data),
        updated_at = NOW(),
        statut = 'actif'
    WHERE id = p_file_id;
    
    -- Compter les leads valides
    SELECT COUNT(*) INTO leads_count
    FROM jsonb_array_elements(p_leads_data) AS donnees
    WHERE (
        (donnees->>'nom') IS NOT NULL AND TRIM((donnees->>'nom')::TEXT) != ''
        OR (donnees->>'email') IS NOT NULL AND TRIM((donnees->>'email')::TEXT) != ''
        OR (donnees->>'telephone') IS NOT NULL AND TRIM((donnees->>'telephone')::TEXT) != ''
    );
    
    -- Mettre à jour le compteur de leads valides
    UPDATE fichiers_import
    SET nb_lignes_importees = leads_count
    WHERE id = p_file_id;
    
    -- Le trigger se déclenchera automatiquement pour créer les leads
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Table pour journaliser les synchronisations - NOUVEAU
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL, -- 'manual_sync', 'file_sync', 'auto_sync'
    fichier_id UUID REFERENCES fichiers_import(id),
    files_processed INTEGER DEFAULT 0,
    leads_before INTEGER DEFAULT 0,
    leads_after INTEGER DEFAULT 0,
    sync_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id)
);

-- 9. Index pour optimiser les performances - NOUVEAU
CREATE INDEX IF NOT EXISTS idx_leads_fichier_id ON leads(fichier_id);
CREATE INDEX IF NOT EXISTS idx_leads_source_import ON leads(source_import);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_fichiers_import_statut ON fichiers_import(statut);
CREATE INDEX IF NOT EXISTS idx_campaign_file_links_campaign_id ON campaign_file_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_file_links_fichier_id ON campaign_file_links(fichier_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_fichier_id ON sync_logs(fichier_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_date ON sync_logs(sync_date);

-- 10. Fonction pour nettoyer les leads orphelins - NOUVEAU
CREATE OR REPLACE FUNCTION cleanup_orphaned_leads()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Supprimer les leads sans fichier associé
    DELETE FROM leads 
    WHERE fichier_id NOT IN (SELECT id FROM fichiers_import);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Journaliser le nettoyage
    INSERT INTO sync_logs (sync_type, files_processed, sync_date, error_message)
    VALUES ('cleanup', deleted_count, NOW(), 'Nettoyage des leads orphelins');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- UTILISATION
-- ====================================================================

-- Pour synchroniser manuellement toutes les données existantes:
-- SELECT manual_sync_all_leads();

-- Pour synchroniser un fichier spécifique:
-- SELECT manual_sync_file_leads('votre-file-id');

-- Pour mettre à jour un fichier avec des données de leads:
-- SELECT update_file_with_leads_data('votre-file-id', '[{"nom": "Doe", "prenom": "John", ...}]');

-- Pour nettoyer les leads orphelins:
-- SELECT cleanup_orphaned_leads();

-- Pour voir l'historique des synchronisations:
-- SELECT * FROM sync_logs ORDER BY sync_date DESC LIMIT 10;

COMMIT;
