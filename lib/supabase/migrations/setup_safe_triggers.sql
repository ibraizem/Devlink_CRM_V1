-- ====================================================================
-- TRIGGERS SÉCURISÉS SANS RÉCURSION INFINIE
-- ====================================================================

-- 1. TABLE DE LIAISON FICHIERS-CAMPAGNES (si n'existe pas)
CREATE TABLE IF NOT EXISTS campaign_file_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    fichier_id UUID NOT NULL REFERENCES fichiers_import(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, fichier_id)
);

-- 2. TABLE DE LOGS DE SYNCHRONISATION
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL, -- 'file_import', 'file_update', 'manual_sync'
    fichier_id UUID REFERENCES fichiers_import(id),
    leads_before INTEGER DEFAULT 0,
    leads_after INTEGER DEFAULT 0,
    sync_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. VARIABLE DE SESSION POUR ÉVITER LA RÉCURSION
CREATE OR REPLACE FUNCTION check_recursion_protection()
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérifier si nous sommes déjà dans un trigger
    IF current_setting('myapp.is_in_trigger', true) = 'true' THEN
        RETURN true; -- On est déjà dans un trigger, ne pas exécuter
    END IF;
    RETURN false; -- Pas de récursion, on peut exécuter
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. FONCTION PRINCIPALE DE SYNCHRONISATION (SÉCURISÉE)
CREATE OR REPLACE FUNCTION sync_leads_from_file_safe()
RETURNS TRIGGER AS $$
DECLARE
    file_record RECORD;
    campaign_ids UUID[];
    current_campaign_id UUID;
    leads_inserted INTEGER := 0;
    leads_updated INTEGER := 0;
    lead_record RECORD;
    lead_data JSONB;
    existing_lead_id UUID;
BEGIN
    -- Protection contre la récursion
    IF check_recursion_protection() THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Activer la protection
    PERFORM set_config('myapp.is_in_trigger', 'true', true);
    
    -- Récupérer les données du fichier
    IF TG_OP = 'DELETE' THEN
        file_record := OLD;
    ELSE
        file_record := NEW;
    END IF;
    
    -- Si suppression, nettoyer les leads
    IF TG_OP = 'DELETE' THEN
        DELETE FROM leads WHERE fichier_id = file_record.id;
        
        -- Logger la suppression
        INSERT INTO sync_logs (sync_type, fichier_id, leads_before, leads_after, sync_date)
        VALUES ('file_delete', file_record.id, 0, 0, NOW());
        
        PERFORM set_config('myapp.is_in_trigger', 'false', true);
        RETURN OLD;
    END IF;
    
    -- Vérifier si le fichier a des données
    IF file_record.donnees IS NULL OR jsonb_array_length(file_record.donnees) = 0 THEN
        -- Nettoyer les leads existants si plus de données
        DELETE FROM leads WHERE fichier_id = file_record.id;
        
        -- Mettre à jour le compteur
        UPDATE fichiers_import SET nb_lignes_importees = 0 WHERE id = file_record.id;
        
        PERFORM set_config('myapp.is_in_trigger', 'false', true);
        RETURN NEW;
    END IF;
    
    -- Récupérer les campagnes associées
    SELECT ARRAY_AGG(DISTINCT campaign_id) INTO campaign_ids
    FROM campaign_file_links 
    WHERE fichier_id = file_record.id;
    
    -- Si aucune campagne, utiliser une campagne par défaut ou NULL
    IF campaign_ids IS NULL OR array_length(campaign_ids, 1) = 0 THEN
        campaign_ids := ARRAY[NULL::UUID];
    END IF;
    
    -- Parcourir les données du fichier
    FOR i IN 0..jsonb_array_length(file_record.donnees) - 1 LOOP
        lead_data := file_record.donnees -> i;
        
        -- Validation basique des données
        IF lead_data IS NULL OR jsonb_typeof(lead_data) != 'object' THEN
            CONTINUE;
        END IF;
        
        -- Vérifier si le lead existe déjà (basé sur email ou téléphone)
        SELECT id INTO existing_lead_id
        FROM leads 
        WHERE fichier_id = file_record.id
        AND (
            (lead_data->>'email' IS NOT NULL AND TRIM(lead_data->>'email') != '' AND email = TRIM(lead_data->>'email'))
            OR (lead_data->>'telephone' IS NOT NULL AND TRIM(lead_data->>'telephone') != '' AND telephone = TRIM(lead_data->>'telephone'))
        )
        LIMIT 1;
        
        -- Créer ou mettre à jour le lead pour chaque campagne associée
        FOREACH current_campaign_id IN ARRAY campaign_ids LOOP
            IF existing_lead_id IS NULL THEN
                -- Insertion
                INSERT INTO leads (
                    nom, prenom, email, telephone, 
                    campaign_id, fichier_id, source_import, 
                    statut, agent_id, created_at, updated_at
                ) VALUES (
                    COALESCE(TRIM(NULLIF(lead_data->>'nom', '')), 'Inconnu'),
                    TRIM(NULLIF(lead_data->>'prenom', '')),
                    TRIM(NULLIF(lead_data->>'email', '')),
                    TRIM(NULLIF(lead_data->>'telephone', '')),
                    current_campaign_id,
                    file_record.id,
                    'fichier_import',
                    'nouveau',
                    file_record.user_id,
                    NOW(),
                    NOW()
                );
                
                leads_inserted := leads_inserted + 1;
            ELSE
                -- Mise à jour
                UPDATE leads SET
                    nom = COALESCE(TRIM(NULLIF(lead_data->>'nom', '')), leads.nom),
                    prenom = COALESCE(TRIM(NULLIF(lead_data->>'prenom', '')), leads.prenom),
                    email = COALESCE(TRIM(NULLIF(lead_data->>'email', '')), leads.email),
                    telephone = COALESCE(TRIM(NULLIF(lead_data->>'telephone', '')), leads.telephone),
                    campaign_id = COALESCE(current_campaign_id, leads.campaign_id),
                    updated_at = NOW()
                WHERE id = existing_lead_id AND fichier_id = file_record.id;
                
                leads_updated := leads_updated + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    -- Mettre à jour le compteur de leads importés
    UPDATE fichiers_import 
    SET nb_lignes_importees = (
        SELECT COUNT(*) 
        FROM leads 
        WHERE fichier_id = file_record.id
    )
    WHERE id = file_record.id;
    
    -- Logger la synchronisation
    INSERT INTO sync_logs (sync_type, fichier_id, leads_before, leads_after, sync_date, metadata)
    VALUES (
        TG_OP, 
        file_record.id, 
        0, 
        leads_inserted + leads_updated, 
        NOW(),
        jsonb_build_object(
            'leads_inserted', leads_inserted,
            'leads_updated', leads_updated,
            'campaigns_count', array_length(campaign_ids, 1)
        )
    );
    
    -- Désactiver la protection
    PERFORM set_config('myapp.is_in_trigger', 'false', true);
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Désactiver la protection en cas d'erreur
        PERFORM set_config('myapp.is_in_trigger', 'false', true);
        
        -- Logger l'erreur
        INSERT INTO sync_logs (sync_type, fichier_id, sync_date, error_message)
        VALUES (TG_OP, file_record.id, NOW(), SQLERRM);
        
        -- Relancer l'erreur
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CRÉER LES TRIGGERS SÉCURISÉS
DROP TRIGGER IF EXISTS trigger_safe_sync_leads_on_insert ON fichiers_import;
CREATE TRIGGER trigger_safe_sync_leads_on_insert
    AFTER INSERT ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_file_safe();

DROP TRIGGER IF EXISTS trigger_safe_sync_leads_on_update ON fichiers_import;
CREATE TRIGGER trigger_safe_sync_leads_on_update
    AFTER UPDATE ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_file_safe();

DROP TRIGGER IF EXISTS trigger_safe_sync_leads_on_delete ON fichiers_import;
CREATE TRIGGER trigger_safe_sync_leads_on_delete
    AFTER DELETE ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION sync_leads_from_file_safe();

-- 6. FONCTIONS RPC POUR LES OPÉRATIONS MANUELLES
CREATE OR REPLACE FUNCTION manual_sync_file(p_file_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    leads_processed INTEGER,
    message TEXT
) AS $$
DECLARE
    file_exists BOOLEAN;
BEGIN
    -- Vérifier que le fichier existe et appartient à l'utilisateur
    SELECT EXISTS(
        SELECT 1 FROM fichiers_import 
        WHERE id = p_file_id AND user_id = auth.uid()
    ) INTO file_exists;
    
    IF NOT file_exists THEN
        RETURN QUERY SELECT false, 0, 'Fichier non trouvé ou accès non autorisé';
        RETURN;
    END IF;
    
    -- Déclencher la synchronisation
    UPDATE fichiers_import 
    SET updated_at = NOW() 
    WHERE id = p_file_id AND user_id = auth.uid();
    
    -- Retourner le résultat
    RETURN QUERY 
    SELECT true, 
           COALESCE(nb_lignes_importees, 0) as leads_processed,
           'Synchronisation terminée avec succès'
    FROM fichiers_import 
    WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_file_statistics(p_file_id UUID)
RETURNS TABLE (
    total_rows INTEGER,
    imported_leads INTEGER,
    sync_logs_count INTEGER,
    last_sync_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(nb_lignes, 0) as total_rows,
        COALESCE(nb_lignes_importees, 0) as imported_leads,
        (SELECT COUNT(*) FROM sync_logs WHERE fichier_id = p_file_id) as sync_logs_count,
        (SELECT MAX(sync_date) FROM sync_logs WHERE fichier_id = p_file_id) as last_sync_date
    FROM fichiers_import 
    WHERE id = p_file_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. INDEX POUR LES NOUVELLES TABLES
CREATE INDEX IF NOT EXISTS idx_campaign_file_links_campaign_id ON campaign_file_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_file_links_fichier_id ON campaign_file_links(fichier_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_fichier_id ON sync_logs(fichier_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_date ON sync_logs(sync_date);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_type ON sync_logs(sync_type);

-- 8. ACCORDER LES PERMISSIONS
GRANT ALL ON campaign_file_links TO authenticated;
GRANT ALL ON sync_logs TO authenticated;
GRANT EXECUTE ON FUNCTION manual_sync_file TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION check_recursion_protection TO authenticated;
