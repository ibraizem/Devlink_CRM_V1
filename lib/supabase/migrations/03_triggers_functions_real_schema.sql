-- ====================================================================
-- SCRIPT DE TRIGGERS ET FONCTIONS (SCHÉMAS RÉELS)
-- ====================================================================
-- Adapté aux schémas exacts des tables
-- Exécuter en dernier (après tables et RLS)

-- 1. Configuration du namespace pour éviter les récursions infinies
CREATE SCHEMA IF NOT EXISTS myapp;

-- Créer ou mettre à jour la variable de session pour détecter les triggers
DROP FUNCTION IF EXISTS myapp.set_trigger_state() CASCADE;
CREATE FUNCTION myapp.set_trigger_state()
RETURNS void AS $$
BEGIN
    PERFORM set_config('myapp.is_in_trigger', 'true', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si on est dans un trigger
DROP FUNCTION IF EXISTS myapp.is_in_trigger() CASCADE;
CREATE FUNCTION myapp.is_in_trigger()
RETURNS boolean AS $$
BEGIN
    RETURN current_setting('myapp.is_in_trigger', true) = 'true';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour réinitialiser l'état du trigger
DROP FUNCTION IF EXISTS myapp.reset_trigger_state() CASCADE;
CREATE FUNCTION myapp.reset_trigger_state()
RETURNS void AS $$
BEGIN
    PERFORM set_config('myapp.is_in_trigger', 'false', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction de synchronisation automatique des fichiers vers leads
DROP FUNCTION IF EXISTS sync_file_to_leads() CASCADE;
CREATE FUNCTION sync_file_to_leads()
RETURNS TRIGGER AS $$
DECLARE
    file_record RECORD;
    lead_data JSONB;
    current_campaign_id UUID;
    leads_inserted INTEGER := 0;
    leads_updated INTEGER := 0;
    campaign_ids UUID[] := '{}';
BEGIN
    -- Éviter les récursions infinies
    IF myapp.is_in_trigger() THEN
        RETURN NEW;
    END IF;
    
    -- Marquer le début du trigger
    PERFORM myapp.set_trigger_state();
    
    -- Récupérer les données du fichier
    SELECT * INTO file_record FROM fichiers_import WHERE id = NEW.id;
    
    -- Vérifier si le fichier a des données à traiter
    IF file_record.donnees IS NULL OR jsonb_array_length(file_record.donnees) = 0 THEN
        PERFORM myapp.reset_trigger_state();
        RETURN NEW;
    END IF;
    
    -- Traiter chaque ligne de données
    FOR lead_data IN SELECT * FROM jsonb_array_elements(file_record.donnees)
    LOOP
        -- Vérifier si c'est un lead existant ou nouveau
        IF lead_data ? 'id' AND lead_data->>'id' IS NOT NULL THEN
            -- Mise à jour d'un lead existant
            UPDATE leads SET
                nom = COALESCE(TRIM(NULLIF(lead_data->>'nom', '')), leads.nom),
                prenom = COALESCE(TRIM(NULLIF(lead_data->>'prenom', '')), leads.prenom),
                email = COALESCE(TRIM(NULLIF(lead_data->>'email', '')), leads.email),
                telephone = COALESCE(TRIM(NULLIF(lead_data->>'telephone', '')), leads.telephone),
                entreprise = COALESCE(TRIM(NULLIF(lead_data->>'entreprise', '')), leads.entreprise),
                updated_at = NOW()
            WHERE id = lead_data->>'id'::UUID
            AND (
                agent_id = file_record.user_id OR
                fichier_id = file_record.id
            );
            
            GET DIAGNOSTICS leads_updated = ROW_COUNT;
        ELSE
            -- Insertion d'un nouveau lead
            -- Déterminer la campagne associée si possible
            current_campaign_id := NULL;
            
            -- Chercher une campagne associée au fichier
            SELECT campaign_id INTO current_campaign_id 
            FROM campaign_file_links 
            WHERE fichier_id = file_record.id 
            LIMIT 1;
            
            -- Insérer le nouveau lead
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
                'import_fichier',
                'nouveau',
                file_record.user_id,
                NOW(),
                NOW()
            );
            
            GET DIAGNOSTICS leads_inserted = ROW_COUNT;
            
            -- Collecter les IDs de campagne pour les logs
            IF current_campaign_id IS NOT NULL THEN
                campaign_ids := array_append(campaign_ids, current_campaign_id);
            END IF;
        END IF;
    END LOOP;
    
    -- Mettre à jour les statistiques du fichier
    UPDATE fichiers_import SET
        nb_lignes_importees = (
            SELECT COUNT(*) FROM leads 
            WHERE fichier_id = file_record.id
        ),
        updated_at = NOW()
    WHERE id = file_record.id;
    
    -- Logger la synchronisation
    INSERT INTO sync_logs (sync_type, fichier_id, leads_before, leads_after, sync_date, metadata, user_id)
    VALUES (
        TG_OP, file_record.id, 0, leads_inserted + leads_updated, NOW(),
        jsonb_build_object(
            'leads_inserted', leads_inserted,
            'leads_updated', leads_updated,
            'campaigns_count', array_length(campaign_ids, 1)
        ),
        file_record.user_id
    );
    
    PERFORM myapp.reset_trigger_state();
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    -- Logger l'erreur
    INSERT INTO sync_logs (sync_type, fichier_id, sync_date, error_message, user_id)
    VALUES (TG_OP, file_record.id, NOW(), SQLERRM, file_record.user_id);
    
    PERFORM myapp.reset_trigger_state();
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger de synchronisation pour les fichiers
DROP TRIGGER IF EXISTS trigger_sync_file_to_leads ON fichiers_import;
CREATE TRIGGER trigger_sync_file_to_leads
    AFTER INSERT OR UPDATE ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION sync_file_to_leads();

-- 4. Fonction pour logger les suppressions de fichiers
DROP FUNCTION IF EXISTS log_file_deletion() CASCADE;
CREATE FUNCTION log_file_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Logger la suppression du fichier
    INSERT INTO sync_logs (sync_type, fichier_id, leads_before, leads_after, sync_date, user_id)
    VALUES ('file_delete', OLD.id, 0, 0, NOW(), OLD.user_id);
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger pour logger les suppressions de fichiers
DROP TRIGGER IF EXISTS trigger_log_file_deletion ON fichiers_import;
CREATE TRIGGER trigger_log_file_deletion
    BEFORE DELETE ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION log_file_deletion();

-- 6. Fonction RPC pour synchronisation manuelle
DROP FUNCTION IF EXISTS manual_sync_file(UUID, UUID) CASCADE;
CREATE OR REPLACE FUNCTION manual_sync_file(p_file_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    success BOOLEAN,
    leads_processed INTEGER,
    message TEXT
) AS $$
DECLARE
    file_exists BOOLEAN;
    actual_user_id UUID;
BEGIN
    -- Utiliser p_user_id si fourni, sinon auth.uid()
    actual_user_id := COALESCE(p_user_id, auth.uid());
    
    SELECT EXISTS(
        SELECT 1 FROM fichiers_import 
        WHERE id = p_file_id AND user_id = actual_user_id
    ) INTO file_exists;
    
    IF NOT file_exists THEN
        RETURN QUERY SELECT false, 0, 'Fichier non trouvé ou accès non autorisé';
        RETURN;
    END IF;
    
    UPDATE fichiers_import 
    SET updated_at = NOW() 
    WHERE id = p_file_id AND user_id = actual_user_id;
    
    -- Logger la synchronisation manuelle
    INSERT INTO sync_logs (sync_type, fichier_id, sync_date, user_id, metadata)
    VALUES ('manual_sync', p_file_id, NOW(), actual_user_id, 
            jsonb_build_object('triggered_by', 'manual_rpc'));
    
    RETURN QUERY 
    SELECT true, COALESCE(nb_lignes_importees, 0), 'Synchronisation terminée avec succès'
    FROM fichiers_import 
    WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fonction RPC pour obtenir les statistiques des fichiers
DROP FUNCTION IF EXISTS get_file_statistics(UUID) CASCADE;
CREATE OR REPLACE FUNCTION get_file_statistics(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_files INTEGER,
    total_leads INTEGER,
    files_by_status JSONB,
    recent_syncs JSONB
) AS $$
DECLARE
    actual_user_id UUID;
BEGIN
    actual_user_id := COALESCE(p_user_id, auth.uid());
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_files,
        COALESCE(SUM(nb_lignes_importees), 0)::INTEGER as total_leads,
        jsonb_object_agg(statut, count) as files_by_status,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'sync_type', sync_type,
                    'sync_date', sync_date,
                    'leads_processed', leads_after - leads_before,
                    'error_message', error_message
                ) ORDER BY sync_date DESC
            )
            FROM sync_logs 
            WHERE user_id = actual_user_id 
            AND sync_date >= NOW() - INTERVAL '7 days'
            LIMIT 10
        ) as recent_syncs
    FROM (
        SELECT 
            statut,
            COUNT(*) as count
        FROM fichiers_import 
        WHERE user_id = actual_user_id
        GROUP BY statut
    ) status_counts
    CROSS JOIN (
        SELECT COUNT(*) as total_count, SUM(nb_lignes_importees) as total_leads_sum
        FROM fichiers_import 
        WHERE user_id = actual_user_id
    ) totals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger pour mettre à jour les timestamps updated_at
-- Fonction générique pour updated_at
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers updated_at pour les tables pertinentes
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fichiers_import_updated_at ON fichiers_import;
CREATE TRIGGER update_fichiers_import_updated_at
    BEFORE UPDATE ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_actions_updated_at ON lead_actions;
CREATE TRIGGER update_lead_actions_updated_at
    BEFORE UPDATE ON lead_actions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rendezvous_updated_at ON rendezvous;
CREATE TRIGGER update_rendezvous_updated_at
    BEFORE UPDATE ON rendezvous
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_campaigns_updated_at ON team_campaigns;
CREATE TRIGGER update_team_campaigns_updated_at
    BEFORE UPDATE ON team_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_custom_columns_updated_at ON user_custom_columns;
CREATE TRIGGER update_user_custom_columns_updated_at
    BEFORE UPDATE ON user_custom_columns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_table_views_updated_at ON user_table_views;
CREATE TRIGGER update_user_table_views_updated_at
    BEFORE UPDATE ON user_table_views
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Fonction pour logger les activités utilisateur
DROP FUNCTION IF EXISTS log_user_activity() CASCADE;
CREATE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
DECLARE
    entity_type TEXT;
    entity_id UUID;
    action TEXT;
    mapped_entity_type TEXT;
BEGIN
    -- Déterminer le type d'entité et l'action
    entity_type := TG_TABLE_NAME;
    entity_id := COALESCE(NEW.id, OLD.id);
    
    -- Mapper les noms de tables vers des valeurs entity_type valides
    mapped_entity_type := CASE
        WHEN entity_type = 'fichiers_import' THEN 'fichier'
        WHEN entity_type = 'campaigns' THEN 'campaign'
        WHEN entity_type = 'leads' THEN 'lead'
        WHEN entity_type = 'lead_actions' THEN 'lead_action'
        WHEN entity_type = 'campaign_files' THEN 'campaign_file'
        WHEN entity_type = 'campaign_file_links' THEN 'campaign_file_link'
        WHEN entity_type = 'teams' THEN 'team'
        WHEN entity_type = 'team_members' THEN 'team_member'
        WHEN entity_type = 'team_campaigns' THEN 'team_campaign'
        WHEN entity_type = 'rendezvous' THEN 'rendezvous'
        WHEN entity_type = 'sync_logs' THEN 'sync_log'
        WHEN entity_type = 'user_custom_columns' THEN 'user_custom_column'
        WHEN entity_type = 'user_table_views' THEN 'user_table_view'
        ELSE 'unknown'
    END;
    
    IF TG_OP = 'INSERT' THEN
        action := 'create';
    ELSIF TG_OP = 'UPDATE' THEN
        action := 'update';
    ELSIF TG_OP = 'DELETE' THEN
        action := 'delete';
    END IF;
    
    -- Logger l'activité
    INSERT INTO user_activities (user_id, entity_type, entity_id, action, metadata)
    VALUES (
        COALESCE(
            -- Pour tables avec user_id
            CASE 
                WHEN entity_type IN ('fichiers_import', 'leads', 'lead_actions', 'rendezvous', 'sync_logs', 'user_custom_columns', 'user_table_views') 
                THEN COALESCE(NEW.user_id, OLD.user_id)
                ELSE NULL
            END,
            -- Pour tables avec created_by
            CASE 
                WHEN entity_type IN ('campaigns', 'teams') 
                THEN COALESCE(NEW.created_by, OLD.created_by)
                ELSE NULL
            END,
            -- Pour tables avec uploaded_by
            CASE 
                WHEN entity_type = 'campaign_files' 
                THEN COALESCE(NEW.uploaded_by, OLD.uploaded_by)
                ELSE NULL
            END,
            -- Fallback par défaut
            auth.uid()
        ),
        mapped_entity_type,
        entity_id,
        action,
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'timestamp', NOW()
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Créer les triggers d'activité sur les tables principales
DROP TRIGGER IF EXISTS log_campaigns_activity ON campaigns;
CREATE TRIGGER log_campaigns_activity
    AFTER INSERT OR UPDATE OR DELETE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION log_user_activity();

DROP TRIGGER IF EXISTS log_fichiers_import_activity ON fichiers_import;
CREATE TRIGGER log_fichiers_import_activity
    AFTER INSERT OR UPDATE OR DELETE ON fichiers_import
    FOR EACH ROW
    EXECUTE FUNCTION log_user_activity();

DROP TRIGGER IF EXISTS log_leads_activity ON leads;
CREATE TRIGGER log_leads_activity
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_user_activity();
