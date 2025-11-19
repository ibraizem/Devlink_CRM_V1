-- ====================================================================
-- SCRIPT POUR RÉCUPÉRER TOUS LES SCHÉMAS DE TABLES SUPABASE
-- ====================================================================
-- Exécuter ce script dans l'éditeur SQL Supabase pour obtenir
-- la structure complète de toutes les tables existantes

-- 1. Liste de toutes les tables du schéma public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Structure détaillée de chaque table
SELECT 
    t.table_name,
    c.column_name,
    c.ordinal_position,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.numeric_precision,
    c.numeric_scale
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND c.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 3. Clés primaires
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. Clés étrangères
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 5. Index
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
ORDER BY tablename, indexname;

-- 6. Contraintes CHECK
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 7. Politiques RLS (Row Level Security)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. Triggers
SELECT 
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS event_type,
    action_timing AS timing,
    action_condition AS condition,
    action_statement AS definition
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 9. Fonctions (utiles pour les RPC)
SELECT 
    p.proname AS function_name,
    pg_get_function_result(p.oid) AS return_type,
    pg_get_function_arguments(p.oid) AS arguments,
    p.prosrc AS source_code,
    CASE WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
         WHEN p.provolatile = 's' THEN 'STABLE'
         WHEN p.provolatile = 'v' THEN 'VOLATILE'
    END AS volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'  -- 'f' pour les fonctions normales
ORDER BY p.proname;

-- 10. Génération automatique des CREATE TABLE
-- Copiez-collez ce résultat pour reconstruire vos tables
SELECT 
    'CREATE TABLE ' || table_name || ' (' || 
    STRING_AGG(
        column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || COALESCE(character_maximum_length::text, '255') || ')'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
            WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMP WITH TIME ZONE'
            WHEN data_type = 'uuid' THEN 'UUID'
            WHEN data_type = 'jsonb' THEN 'JSONB'
            WHEN data_type = 'boolean' THEN 'BOOLEAN'
            WHEN data_type = 'integer' THEN 'INTEGER'
            WHEN data_type = 'bigint' THEN 'BIGINT'
            WHEN data_type = 'numeric' THEN 'NUMERIC(' || COALESCE(numeric_precision::text, '10') || ',' || COALESCE(numeric_scale::text, '2') || ')'
            WHEN data_type = 'text' THEN 'TEXT'
            ELSE data_type
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        E',\n    '
        ORDER BY ordinal_position
    ) || E');' AS create_statement
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
    AND c.table_name IN (
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    )
GROUP BY table_name
ORDER BY table_name;
