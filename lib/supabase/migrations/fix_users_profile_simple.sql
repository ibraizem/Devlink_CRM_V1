-- Solution simple : désactiver RLS pour les insertions ou utiliser des politiques plus larges

-- Option 1: Désactiver complètement RLS sur users_profile (temporaire)
ALTER TABLE users_profile DISABLE ROW LEVEL SECURITY;

-- Option 2: Si vous voulez garder RLS, utilisez ces politiques plus permissives :
/*
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profile;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON users_profile;

-- Politique très permissive pour l'insertion (résout le problème d'inscription)
CREATE POLICY "Allow insertions during signup" ON users_profile
    FOR INSERT WITH CHECK (true);

-- Politiques pour les autres opérations
CREATE POLICY "Users can view own profile" ON users_profile
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users_profile
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON users_profile
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
    );
*/
