-- Script de mise à jour des rôles existants
-- Ce script doit être exécuté après avoir appliqué la migration RLS

-- 1. Mettre à jour les rôles existants vers les nouvelles valeurs
UPDATE users_profile 
SET role = 'admin' 
WHERE role IN ('admin', 'administrator', 'superadmin');

UPDATE users_profile 
SET role = 'manager' 
WHERE role IN ('manager', 'team_leader', 'leader', 'supervisor');

UPDATE users_profile 
SET role = 'commercial' 
WHERE role IN ('commercial', 'agent', 'telepro', 'user', 'member', 'employee');

-- 2. Assurer que tous les utilisateurs ont un rôle valide
UPDATE users_profile 
SET role = 'commercial' 
WHERE role NOT IN ('admin', 'manager', 'commercial');

-- 3. Créer un index sur la colonne role pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);

-- 4. Ajouter une contrainte CHECK pour s'assurer que seuls les rôles valides sont utilisés
ALTER TABLE users_profile 
ADD CONSTRAINT users_profile_role_check 
CHECK (role IN ('admin', 'manager', 'commercial'));

-- 5. Mettre à jour les données de test si nécessaire
-- (Optionnel) Créer des utilisateurs de test si aucun admin n'existe
INSERT INTO users_profile (id, email, nom, prenom, role, actif, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'admin@devlink.crm',
  'Admin',
  'DevLink',
  'admin',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM users_profile WHERE role = 'admin'
);

-- 6. Afficher un résumé des mises à jour
SELECT 
  role,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users_profile), 2) as percentage
FROM users_profile 
GROUP BY role 
ORDER BY count DESC;

-- 7. Vérifier qu'il y a au moins un admin
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users_profile WHERE role = 'admin' AND actif = true) THEN
        RAISE EXCEPTION 'Aucun utilisateur admin actif trouvé. Veuillez créer un utilisateur admin.';
    END IF;
END $$;
