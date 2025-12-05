/*
  # Migration: Map Existing Users to Clerk (Reference)

  This migration provides a reference function to map existing Supabase Auth users
  to Clerk users. This is typically done during the migration phase.
  
  ## Usage
  This function should be called manually for each user during migration:
  
  SELECT map_user_to_clerk(
    'existing-user-uuid',
    'user_2xxxxxxxxxxxxx'
  );
  
  Or in bulk from a script that fetches users from both systems.
  
  ## Important Notes
  - This is a one-time migration operation
  - Existing user data is preserved
  - The function is idempotent (safe to run multiple times)
  - After migration, users can authenticate via Clerk
*/

-- Function to map existing Supabase Auth user to Clerk
CREATE OR REPLACE FUNCTION map_user_to_clerk(
  p_supabase_user_id uuid,
  p_clerk_user_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_clerk_user_id text;
  v_result jsonb;
BEGIN
  -- Check if user exists
  SELECT clerk_user_id INTO v_existing_clerk_user_id
  FROM users_profile
  WHERE id = p_supabase_user_id;

  IF v_existing_clerk_user_id IS NOT NULL THEN
    -- User already has a Clerk ID
    v_result := jsonb_build_object(
      'success', false,
      'error', 'User already mapped to Clerk',
      'existing_clerk_user_id', v_existing_clerk_user_id,
      'supabase_user_id', p_supabase_user_id
    );
    RETURN v_result;
  END IF;

  -- Check if Clerk ID is already used
  IF EXISTS (SELECT 1 FROM users_profile WHERE clerk_user_id = p_clerk_user_id) THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'Clerk ID already in use',
      'clerk_user_id', p_clerk_user_id
    );
    RETURN v_result;
  END IF;

  -- Update user with Clerk ID
  UPDATE users_profile
  SET 
    clerk_user_id = p_clerk_user_id,
    updated_at = now()
  WHERE id = p_supabase_user_id;

  IF FOUND THEN
    v_result := jsonb_build_object(
      'success', true,
      'supabase_user_id', p_supabase_user_id,
      'clerk_user_id', p_clerk_user_id,
      'message', 'User successfully mapped to Clerk'
    );
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'error', 'User not found',
      'supabase_user_id', p_supabase_user_id
    );
  END IF;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION map_user_to_clerk(uuid, text) IS 'Maps existing Supabase Auth user to Clerk user ID. For migration purposes.';

-- Function to bulk map users (for migration scripts)
CREATE OR REPLACE FUNCTION bulk_map_users_to_clerk(
  p_mappings jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mapping jsonb;
  v_results jsonb := '[]'::jsonb;
  v_result jsonb;
  v_success_count integer := 0;
  v_error_count integer := 0;
BEGIN
  -- Process each mapping
  FOR v_mapping IN SELECT * FROM jsonb_array_elements(p_mappings)
  LOOP
    -- Call map_user_to_clerk for each mapping
    SELECT map_user_to_clerk(
      (v_mapping->>'supabase_user_id')::uuid,
      v_mapping->>'clerk_user_id'
    ) INTO v_result;

    -- Accumulate results
    v_results := v_results || jsonb_build_array(v_result);

    -- Count successes and errors
    IF (v_result->>'success')::boolean THEN
      v_success_count := v_success_count + 1;
    ELSE
      v_error_count := v_error_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'total', jsonb_array_length(p_mappings),
    'mapped', v_success_count,
    'errors', v_error_count,
    'results', v_results
  );
END;
$$;

COMMENT ON FUNCTION bulk_map_users_to_clerk(jsonb) IS 'Bulk maps multiple users from Supabase Auth to Clerk. Expects array of {supabase_user_id, clerk_user_id} objects.';

-- Example usage (commented out):
/*
-- Single user mapping
SELECT map_user_to_clerk(
  '12345678-1234-1234-1234-123456789012'::uuid,
  'user_2xxxxxxxxxxxxx'
);

-- Bulk mapping
SELECT bulk_map_users_to_clerk('[
  {
    "supabase_user_id": "12345678-1234-1234-1234-123456789012",
    "clerk_user_id": "user_2xxxxxxxxxxxxx"
  },
  {
    "supabase_user_id": "87654321-4321-4321-4321-210987654321",
    "clerk_user_id": "user_2yyyyyyyyyyyyy"
  }
]'::jsonb);
*/

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION map_user_to_clerk(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_map_users_to_clerk(jsonb) TO authenticated;
