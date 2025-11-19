-- DÉPANNAGE IMMÉDIAT : Désactiver RLS temporairement sur teams et team_members
-- À exécuter immédiatement pour stopper l'erreur 500

-- Désactiver RLS sur les tables problématiques
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Vérifier l'état
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('teams', 'team_members') AND schemaname = 'public';

-- Pour réactiver plus tard avec les nouvelles politiques :
-- ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
