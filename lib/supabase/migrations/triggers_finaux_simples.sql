-- ====================================================================
-- TRIGGERS ET FONCTIONS (SCHÉMAS RÉELS FOURNIS PAR L'UTILISATEUR)
-- ====================================================================

-- Fonction pour logger l'activité utilisateur
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_entity_id UUID;
    v_action TEXT;
    v_entity_type TEXT;
BEGIN
    -- Déterminer l'action
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_entity_id := NEW.id;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_entity_id := NEW.id;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_entity_id := OLD.id;
    END IF;

    -- Déterminer le type d'entité (valeurs autorisées par la contrainte)
    IF TG_TABLE_NAME = 'fichiers_import' THEN
        v_entity_type := 'fichier';
    ELSIF TG_TABLE_NAME = 'campaigns' THEN
        v_entity_type := 'campaign';
    ELSIF TG_TABLE_NAME = 'teams' THEN
        v_entity_type := 'team';
    ELSIF TG_TABLE_NAME = 'leads' THEN
        v_entity_type := 'lead';
    ELSIF TG_TABLE_NAME = 'campaign_files' THEN
        v_entity_type := 'campaign_file';
    ELSE
        v_entity_type := 'other';
    END IF;

    -- Déterminer l'utilisateur selon la table
    IF TG_TABLE_NAME = 'fichiers_import' THEN
        v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    ELSIF TG_TABLE_NAME = 'campaigns' THEN
        v_user_id := COALESCE(NEW.created_by, OLD.created_by);
    ELSIF TG_TABLE_NAME = 'teams' THEN
        v_user_id := COALESCE(NEW.created_by, OLD.created_by);
    ELSIF TG_TABLE_NAME = 'leads' THEN
        v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    ELSIF TG_TABLE_NAME = 'campaign_files' THEN
        v_user_id := COALESCE(NEW.uploaded_by, OLD.uploaded_by);
    ELSE
        v_user_id := auth.uid();
    END IF;

    -- Insérer dans user_activities seulement si on a un user_id
    IF v_user_id IS NOT NULL THEN
        INSERT INTO user_activities (user_id, entity_type, entity_id, action, metadata)
        VALUES (
            v_user_id,
            v_entity_type,
            v_entity_id,
            v_action,
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'operation', TG_OP,
                'timestamp', NOW()
            )
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour fichiers_import
DROP TRIGGER IF EXISTS log_fichiers_import_activity ON fichiers_import;
CREATE TRIGGER log_fichiers_import_activity
    AFTER INSERT OR UPDATE OR DELETE ON fichiers_import
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

-- Trigger pour campaigns
DROP TRIGGER IF EXISTS log_campaigns_activity ON campaigns;
CREATE TRIGGER log_campaigns_activity
    AFTER INSERT OR UPDATE OR DELETE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

-- Trigger pour teams
DROP TRIGGER IF EXISTS log_teams_activity ON teams;
CREATE TRIGGER log_teams_activity
    AFTER INSERT OR UPDATE OR DELETE ON teams
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

-- Trigger pour leads
DROP TRIGGER IF EXISTS log_leads_activity ON leads;
CREATE TRIGGER log_leads_activity
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();

-- Trigger pour campaign_files
DROP TRIGGER IF EXISTS log_campaign_files_activity ON campaign_files;
CREATE TRIGGER log_campaign_files_activity
    AFTER INSERT OR UPDATE OR DELETE ON campaign_files
    FOR EACH ROW EXECUTE FUNCTION log_user_activity();
