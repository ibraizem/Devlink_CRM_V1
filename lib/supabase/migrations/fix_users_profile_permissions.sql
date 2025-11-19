        -- Script pour corriger les permissions de la table users_profile

        -- 1. Activer RLS sur la table users_profile
        ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

        -- 2. Supprimer les politiques existantes (si elles existent)
        DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
        DROP POLICY IF EXISTS "Users can update own profile" ON users_profile;
        DROP POLICY IF EXISTS "Users can insert own profile" ON users_profile;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON users_profile;
        DROP POLICY IF EXISTS "Admins can update all profiles" ON users_profile;
        DROP POLICY IF EXISTS "Admins can insert profiles" ON users_profile;

        -- 3. Créer les politiques RLS simplifiées
        -- Politique pour permettre aux utilisateurs de voir leur propre profil
        CREATE POLICY "Users can view own profile" ON users_profile
            FOR SELECT USING (auth.uid() = id);

        -- Politique pour permettre aux utilisateurs de mettre à jour leur propre profil
        CREATE POLICY "Users can update own profile" ON users_profile
            FOR UPDATE USING (auth.uid() = id);

        -- Politique pour permettre aux utilisateurs d'insérer leur propre profil
        CREATE POLICY "Users can insert own profile" ON users_profile
            FOR INSERT WITH CHECK (id = auth.uid());

        -- Politique pour permettre aux admins de gérer tous les profils (basé sur les métadonnées d'auth)
        CREATE POLICY "Admins can manage all profiles" ON users_profile
            FOR ALL USING (
                auth.jwt() ->> 'role' = 'admin'
            );
