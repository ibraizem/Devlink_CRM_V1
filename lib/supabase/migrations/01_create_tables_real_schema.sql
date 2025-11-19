-- ====================================================================
-- SCRIPT DE CRÉATION DES TABLES (SCHÉMAS RÉELS)
-- ====================================================================
-- Basé sur les schémas exacts récupérés depuis votre base Supabase
-- Exécuter ce script en premier

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table users_profile
CREATE TABLE IF NOT EXISTS users_profile (
    id UUID NOT NULL,
    email TEXT NOT NULL,
    nom TEXT,
    prenom TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    actif BOOLEAN NOT NULL DEFAULT true,
    telephone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    organization TEXT,
    industry TEXT
);

-- 2. Table teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    leader_id UUID
);

-- 3. Table team_members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Table campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    budget NUMERIC(10,2),
    target_audience JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID NOT NULL,
    team_id UUID,
    associated_file_id UUID,
    total_leads INTEGER DEFAULT 0,
    channels TEXT[] DEFAULT '{}'::text[],
    converted_leads INTEGER DEFAULT 0,
    progress NUMERIC(10,2) DEFAULT 0,
    file_name TEXT,
    files JSONB DEFAULT '[]'::jsonb
);

-- 5. Table campaign_files
CREATE TABLE IF NOT EXISTS campaign_files (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    campaign_id UUID,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Table campaign_file_links
CREATE TABLE IF NOT EXISTS campaign_file_links (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL,
    fichier_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Table fichiers_import
CREATE TABLE IF NOT EXISTS fichiers_import (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    chemin TEXT NOT NULL,
    statut TEXT NOT NULL,
    date_import TIMESTAMP WITH TIME ZONE DEFAULT now(),
    nb_lignes INTEGER DEFAULT 0,
    nb_lignes_importees INTEGER DEFAULT 0,
    mapping_colonnes JSONB NOT NULL DEFAULT '{}'::jsonb,
    separateur TEXT DEFAULT ',',
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    original_filename TEXT,
    taille INTEGER,
    type TEXT,
    metadata JSONB,
    mime_type TEXT,
    donnees JSONB
);

-- 8. Table leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT,
    telephone TEXT NOT NULL,
    telephone_2 TEXT,
    entreprise TEXT,
    statut TEXT NOT NULL DEFAULT 'nouveau',
    source TEXT,
    agent_id UUID,
    priorite TEXT DEFAULT 'moyenne',
    dernier_contact TIMESTAMP WITH TIME ZONE,
    prochain_rappel TIMESTAMP WITH TIME ZONE,
    notes_rapides TEXT,
    siret TEXT,
    departement TEXT,
    territoire TEXT,
    metier TEXT,
    commentaires TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    origine TEXT,
    canal TEXT,
    date_rdv TIMESTAMP WITH TIME ZONE,
    campaign_id UUID,
    fichier_id UUID,
    source_import TEXT DEFAULT 'manuel'
);

-- 9. Table lead_actions
CREATE TABLE IF NOT EXISTS lead_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL,
    agent_id UUID,
    type TEXT NOT NULL,
    description TEXT,
    contenu TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    bulk_operation BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Table rendezvous
CREATE TABLE IF NOT EXISTS rendezvous (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL,
    agent_id UUID,
    date_heure TIMESTAMP WITH TIME ZONE NOT NULL,
    duree_minutes INTEGER DEFAULT 30,
    statut TEXT DEFAULT 'planifie',
    canal TEXT,
    lien_calendly TEXT,
    lien_visio TEXT,
    notes TEXT,
    rappel_envoye BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. Table sync_logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50) NOT NULL,
    fichier_id UUID,
    files_processed INTEGER DEFAULT 0,
    leads_before INTEGER DEFAULT 0,
    leads_after INTEGER DEFAULT 0,
    sync_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    error_message TEXT,
    user_id UUID
);

-- 12. Table team_campaigns
CREATE TABLE IF NOT EXISTS team_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    team_id UUID,
    campaign_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. Table user_activities
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 14. Table user_custom_columns
CREATE TABLE IF NOT EXISTS user_custom_columns (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    column_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 15. Table user_table_views
CREATE TABLE IF NOT EXISTS user_table_views (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    view_name TEXT NOT NULL,
    column_visibility JSONB NOT NULL,
    column_order TEXT[] NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    is_shared BOOLEAN DEFAULT false
);

-- Créer les indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_fichier_id ON leads(fichier_id);
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_fichiers_import_user_id ON fichiers_import(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_team_id ON campaigns(team_id);
CREATE INDEX IF NOT EXISTS idx_lead_actions_lead_id ON lead_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_fichier_id ON sync_logs(fichier_id);
CREATE INDEX IF NOT EXISTS idx_campaign_file_links_campaign_id ON campaign_file_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_file_links_fichier_id ON campaign_file_links(fichier_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_campaigns_team_id ON team_campaigns(team_id);
CREATE INDEX IF NOT EXISTS idx_team_campaigns_campaign_id ON team_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_columns_user_id ON user_custom_columns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_table_views_user_id ON user_table_views(user_id);
