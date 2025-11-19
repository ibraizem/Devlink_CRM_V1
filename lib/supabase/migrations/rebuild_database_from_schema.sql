-- ====================================================================
-- SCRIPT DE RECONSTRUCTION COMPLÈTE DE BASE DE DONNÉES
-- ====================================================================
-- À exécuter APRÈS avoir récupéré les schémas avec le script précédent
-- Ce script reconstruit proprement toute la base de données

-- Instructions :
-- 1. D'abord exécuter get_all_table_schemas.sql dans Supabase
-- 2. Copier les résultats CREATE TABLE générés ici
-- 3. Exécuter ce script de reconstruction

-- ====================================================================
-- ÉTAPE 1: DÉSACTIVER TEMPORAIREMENT LES TRIGGERS ET RLS
-- ====================================================================

-- Désactiver RLS sur toutes les tables
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || table_rec.tablename || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Supprimer tous les triggers
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT event_object_table, trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.trigger_name || 
                ' ON ' || trigger_rec.event_object_table;
    END LOOP;
END $$;

-- ====================================================================
-- ÉTAPE 2: SAUVEGARDER LES DONNÉES EXISTANTES
-- ====================================================================

-- Créer des tables de sauvegarde temporaires
DO $$
DECLARE
    table_rec RECORD;
    backup_table_name TEXT;
BEGIN
    FOR table_rec IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'backup_%'
    LOOP
        backup_table_name := 'backup_' || table_rec.tablename;
        EXECUTE 'DROP TABLE IF EXISTS ' || backup_table_name;
        EXECUTE 'CREATE TABLE ' || backup_table_name || ' AS SELECT * FROM ' || table_rec.tablename;
        RAISE NOTICE 'Backup créé pour la table: %', table_rec.tablename;
    END LOOP;
END $$;

-- ====================================================================
-- ÉTAPE 3: SUPPRIMER LES TABLES EXISTANTES (SAUF BACKUPS)
-- ====================================================================

-- Supprimer les contraintes étrangères d'abord
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || constraint_rec.table_name || 
                ' DROP CONSTRAINT IF EXISTS ' || constraint_rec.constraint_name;
        RAISE NOTICE 'Contrainte supprimée: % sur %', constraint_rec.constraint_name, constraint_rec.table_name;
    END LOOP;
END $$;

-- Supprimer les tables
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'backup_%'
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || table_rec.tablename || ' CASCADE';
        RAISE NOTICE 'Table supprimée: %', table_rec.tablename;
    END LOOP;
END $$;

-- ====================================================================
-- ÉTAPE 4: RECÉER LES TABLES (À COMPLÉTER AVEC LES RÉSULTATS)
-- ====================================================================

-- INSÉRER ICI LES CREATE TABLE obtenus du script précédent
/*
Exemple de ce que vous devriez copier-coller :

CREATE TABLE campaigns (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NULL,
    user_id UUID NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE leads (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT NULL,
    telephone TEXT NOT NULL,
    campaign_id UUID NULL,
    fichier_id UUID NULL,
    source_import TEXT NULL DEFAULT 'manuel',
    statut TEXT NOT NULL DEFAULT 'nouveau',
    agent_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- etc pour toutes vos tables...
*/

-- ====================================================================
-- ÉTAPE 5: RESTAURER LES DONNÉES
-- ====================================================================

DO $$
DECLARE
    table_rec RECORD;
    backup_table_name TEXT;
    column_list TEXT;
BEGIN
    FOR table_rec IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'backup_%'
    LOOP
        backup_table_name := 'backup_' || table_rec.tablename;
        
        -- Vérifier si la table de backup existe et a des données
        EXECUTE 'SELECT COUNT(*) FROM ' || backup_table_name INTO column_list;
        
        IF column_list::INTEGER > 0 THEN
            -- Restaurer les données
            EXECUTE 'INSERT INTO ' || table_rec.tablename || 
                    ' SELECT * FROM ' || backup_table_name;
            RAISE NOTICE 'Données restaurées pour la table: %', table_rec.tablename;
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- ÉTAPE 6: NETTOYER LES BACKUPS
-- ====================================================================

-- Optionnel: supprimer les tables de backup après vérification
/*
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'backup_%'
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || table_rec.tablename;
        RAISE NOTICE 'Backup supprimé: %', table_rec.tablename;
    END LOOP;
END $$;
*/

-- ====================================================================
-- ÉTAPE 7: RÉACTIVER RLS
-- ====================================================================

DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || table_rec.tablename || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- ====================================================================
-- VÉRIFICATION FINALE
-- ====================================================================

-- Afficher le résumé
SELECT 
    'Tables créées: ' || COUNT(*) as summary
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'backup_%';

-- Afficher toutes les tables avec leur nombre de lignes
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = schemaname AND table_name = tablename) as column_count,
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE table_schema = schemaname AND table_name = tablename) as constraint_count
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'backup_%'
ORDER BY tablename;
