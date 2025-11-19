-- DÉSACTIVER LES RLS SUR FICHIERS_IMPORT AUSSI
-- Complément du emergency_disable_rls.sql

-- Désactiver RLS sur les tables problématiques
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers_import DISABLE ROW LEVEL SECURITY;

-- Vérifier l'état
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('teams', 'team_members', 'fichiers_import') AND schemaname = 'public';
