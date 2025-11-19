-- Script pour mettre à jour les métadonnées JWT avec les rôles corrects
-- Ce script met à jour les métadonnées d'authentification pour inclure le rôle

-- 1. Mettre à jour les métadonnées des utilisateurs existants
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}') || jsonb_build_object('role', 
  COALESCE(
    (SELECT role FROM users_profile WHERE users_profile.id = auth.users.id),
    'commercial'  -- Rôle par défaut si non trouvé
  )
)
WHERE id IN (
  SELECT id FROM users_profile
);

-- 2. Créer une fonction pour maintenir les métadonnées à jour
CREATE OR REPLACE FUNCTION public.update_user_role_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les métadonnées JWT quand le rôle change
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}') || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer un trigger pour maintenir les métadonnées synchronisées
DROP TRIGGER IF EXISTS on_user_role_change ON users_profile;
CREATE TRIGGER on_user_role_change
  AFTER UPDATE OF role ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_role_metadata();

-- 4. Créer une fonction pour l'inscription qui définit le rôle par défaut
CREATE OR REPLACE FUNCTION public.set_default_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Définir le rôle par défaut pour les nouveaux utilisateurs
  INSERT INTO users_profile (id, email, nom, prenom, role, actif, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Nom'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', 'Prénom'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),  -- Rôle par défaut 'admin'
    true,
    NOW(),
    NOW()
  );
  
  -- Mettre à jour les métadonnées JWT
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}') || jsonb_build_object('role', 
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Créer un trigger pour l'inscription
DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
CREATE TRIGGER on_auth_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_role_on_signup();

-- 6. Vérifier l'état actuel
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as jwt_role,
  up.role as profile_role,
  CASE 
    WHEN u.raw_user_meta_data->>'role' = up.role THEN 'OK'
    ELSE 'MISMATCH'
  END as status
FROM auth.users u
LEFT JOIN users_profile up ON u.id = up.id
ORDER BY u.created_at DESC;
