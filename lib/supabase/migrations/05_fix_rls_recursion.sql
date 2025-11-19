-- Correction de la récursion infinie dans les politiques RLS
-- Cette migration corrige le problème de récursion dans users_profile

-- 1. Supprimer les anciennes politiques avec récursion
DROP POLICY IF EXISTS users_profile_select_policy ON users_profile;
DROP POLICY IF EXISTS users_profile_update_policy ON users_profile;

-- 2. Recréer les politiques sans récursion en utilisant auth.jwt()
CREATE POLICY users_profile_select_policy ON users_profile
    FOR SELECT USING (
        auth.uid() = id OR  -- Voir son propre profil
        auth.jwt()->>'role' = 'admin'  -- Admin voit tout
    );

CREATE POLICY users_profile_update_policy ON users_profile
    FOR UPDATE USING (
        auth.uid() = id OR  -- Modifier son propre profil
        auth.jwt()->>'role' = 'admin'  -- Admin modifie tout
    );

-- 3. S'assurer que RLS est activé
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

-- 4. Vérifier que les politiques sont bien appliquées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users_profile';
