-- Script pour lister toutes les politiques RLS par table
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
ORDER BY tablename, policyname;

-- Script pour voir les tables avec RLS activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE rowsecurity = true
ORDER BY tablename;
