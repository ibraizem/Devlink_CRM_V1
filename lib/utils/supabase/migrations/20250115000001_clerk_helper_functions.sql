/*
  # Migration: Clerk Helper Functions

  This migration creates SQL helper functions for Clerk authentication:
  1. Function to get current user ID from Clerk
  2. Function to check if user is authenticated via Clerk
  3. Function to get user profile by Clerk ID
  4. Function to sync Clerk user with profile
  
  ## Functions Created
  - get_clerk_user_id(): Returns clerk_user_id from JWT claims
  - is_clerk_authenticated(): Checks if request has valid Clerk auth
  - get_user_profile_by_clerk_id(text): Gets profile by Clerk ID
  - sync_clerk_user(text, jsonb): Creates or updates user profile from Clerk
*/

-- Function to extract clerk_user_id from JWT claims
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$;

COMMENT ON FUNCTION get_clerk_user_id() IS 'Returns the Clerk user ID from JWT claims (sub claim)';

-- Function to check if current request is authenticated via Clerk
CREATE OR REPLACE FUNCTION is_clerk_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT get_clerk_user_id() IS NOT NULL;
$$;

COMMENT ON FUNCTION is_clerk_authenticated() IS 'Returns true if request has valid Clerk authentication';

-- Function to get user profile by Clerk user ID
CREATE OR REPLACE FUNCTION get_user_profile_by_clerk_id(p_clerk_user_id text)
RETURNS TABLE (
  id uuid,
  clerk_user_id text,
  nom text,
  prenom text,
  role text,
  actif boolean,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    clerk_user_id,
    nom,
    prenom,
    role,
    actif,
    avatar_url,
    created_at,
    updated_at
  FROM users_profile
  WHERE users_profile.clerk_user_id = p_clerk_user_id;
$$;

COMMENT ON FUNCTION get_user_profile_by_clerk_id(text) IS 'Returns user profile for given Clerk user ID';

-- Function to sync Clerk user with user profile
CREATE OR REPLACE FUNCTION sync_clerk_user(
  p_clerk_user_id text,
  p_user_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_nom text;
  v_prenom text;
  v_email text;
  v_avatar_url text;
BEGIN
  -- Extract data from jsonb parameter
  v_nom := COALESCE(p_user_data->>'nom', p_user_data->>'lastName', 'User');
  v_prenom := COALESCE(p_user_data->>'prenom', p_user_data->>'firstName', '');
  v_email := p_user_data->>'email';
  v_avatar_url := p_user_data->>'avatar_url';

  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM users_profile
  WHERE clerk_user_id = p_clerk_user_id;

  IF v_user_id IS NULL THEN
    -- Create new user profile
    INSERT INTO users_profile (
      id,
      clerk_user_id,
      nom,
      prenom,
      role,
      actif,
      avatar_url,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      p_clerk_user_id,
      v_nom,
      v_prenom,
      COALESCE(p_user_data->>'role', 'telepro'),
      true,
      v_avatar_url,
      now(),
      now()
    )
    RETURNING id INTO v_user_id;
  ELSE
    -- Update existing user profile
    UPDATE users_profile
    SET
      nom = COALESCE(v_nom, nom),
      prenom = COALESCE(v_prenom, prenom),
      avatar_url = COALESCE(v_avatar_url, avatar_url),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION sync_clerk_user(text, jsonb) IS 'Creates or updates user profile from Clerk user data. Returns user profile ID.';

-- Function to get current user profile (works with both Supabase Auth and Clerk)
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
  id uuid,
  clerk_user_id text,
  nom text,
  prenom text,
  role text,
  actif boolean,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    id,
    clerk_user_id,
    nom,
    prenom,
    role,
    actif,
    avatar_url,
    created_at,
    updated_at
  FROM users_profile
  WHERE 
    users_profile.id = auth.uid() OR
    users_profile.clerk_user_id = get_clerk_user_id()
  LIMIT 1;
$$;

COMMENT ON FUNCTION get_current_user_profile() IS 'Returns current user profile, works with both Supabase Auth and Clerk';

-- Function to check if current user has role
CREATE OR REPLACE FUNCTION current_user_has_role(required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users_profile
    WHERE 
      (users_profile.id = auth.uid() OR users_profile.clerk_user_id = get_clerk_user_id())
      AND users_profile.role = required_role
      AND users_profile.actif = true
  );
$$;

COMMENT ON FUNCTION current_user_has_role(text) IS 'Returns true if current user has the specified role';

-- Function to check if current user has any of the specified roles
CREATE OR REPLACE FUNCTION current_user_has_any_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users_profile
    WHERE 
      (users_profile.id = auth.uid() OR users_profile.clerk_user_id = get_clerk_user_id())
      AND users_profile.role = ANY(required_roles)
      AND users_profile.actif = true
  );
$$;

COMMENT ON FUNCTION current_user_has_any_role(text[]) IS 'Returns true if current user has any of the specified roles';
