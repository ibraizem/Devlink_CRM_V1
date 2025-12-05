/*
  # Migration: Clerk Webhook Handler Function

  This migration creates a function to handle Clerk webhook events:
  1. user.created - Create new user profile
  2. user.updated - Update existing user profile
  3. user.deleted - Soft delete or mark user as inactive
  
  The function can be called from a Supabase Edge Function or directly
  via RPC from the Clerk webhook endpoint.
*/

-- Function to handle Clerk webhook events
CREATE OR REPLACE FUNCTION handle_clerk_webhook(
  p_event_type text,
  p_user_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clerk_user_id text;
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Extract clerk user ID
  v_clerk_user_id := p_user_data->>'id';
  
  IF v_clerk_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing clerk user ID'
    );
  END IF;

  -- Handle different event types
  CASE p_event_type
    WHEN 'user.created' THEN
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
        v_clerk_user_id,
        COALESCE(p_user_data->>'last_name', 'User'),
        COALESCE(p_user_data->>'first_name', ''),
        COALESCE(
          p_user_data->'public_metadata'->>'role',
          p_user_data->'unsafe_metadata'->>'role',
          'telepro'
        ),
        true,
        COALESCE(p_user_data->>'image_url', p_user_data->>'profile_image_url'),
        now(),
        now()
      )
      ON CONFLICT (clerk_user_id) 
      DO UPDATE SET
        nom = EXCLUDED.nom,
        prenom = EXCLUDED.prenom,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now()
      RETURNING id INTO v_user_id;

      v_result := jsonb_build_object(
        'success', true,
        'action', 'created',
        'user_id', v_user_id,
        'clerk_user_id', v_clerk_user_id
      );

    WHEN 'user.updated' THEN
      -- Update existing user profile
      UPDATE users_profile
      SET
        nom = COALESCE(p_user_data->>'last_name', nom),
        prenom = COALESCE(p_user_data->>'first_name', prenom),
        avatar_url = COALESCE(
          p_user_data->>'image_url',
          p_user_data->>'profile_image_url',
          avatar_url
        ),
        role = COALESCE(
          p_user_data->'public_metadata'->>'role',
          p_user_data->'unsafe_metadata'->>'role',
          role
        ),
        updated_at = now()
      WHERE clerk_user_id = v_clerk_user_id
      RETURNING id INTO v_user_id;

      IF v_user_id IS NULL THEN
        -- User doesn't exist, create it
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
          v_clerk_user_id,
          COALESCE(p_user_data->>'last_name', 'User'),
          COALESCE(p_user_data->>'first_name', ''),
          COALESCE(
            p_user_data->'public_metadata'->>'role',
            p_user_data->'unsafe_metadata'->>'role',
            'telepro'
          ),
          true,
          COALESCE(p_user_data->>'image_url', p_user_data->>'profile_image_url'),
          now(),
          now()
        )
        RETURNING id INTO v_user_id;
      END IF;

      v_result := jsonb_build_object(
        'success', true,
        'action', 'updated',
        'user_id', v_user_id,
        'clerk_user_id', v_clerk_user_id
      );

    WHEN 'user.deleted' THEN
      -- Soft delete - mark user as inactive
      UPDATE users_profile
      SET
        actif = false,
        updated_at = now()
      WHERE clerk_user_id = v_clerk_user_id
      RETURNING id INTO v_user_id;

      v_result := jsonb_build_object(
        'success', true,
        'action', 'deleted',
        'user_id', v_user_id,
        'clerk_user_id', v_clerk_user_id
      );

    ELSE
      v_result := jsonb_build_object(
        'success', false,
        'error', 'Unsupported event type: ' || p_event_type
      );
  END CASE;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION handle_clerk_webhook(text, jsonb) IS 'Handles Clerk webhook events (user.created, user.updated, user.deleted)';

-- Grant execute permission to authenticated users (for webhook endpoint)
GRANT EXECUTE ON FUNCTION handle_clerk_webhook(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_clerk_webhook(text, jsonb) TO anon;
