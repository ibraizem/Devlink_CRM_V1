/*
  # Migration: Update RLS Policies for Other Tables (Clerk Support)

  This migration updates RLS policies for additional tables:
  - fichiers_import
  - fichier_donnees
  - user_custom_columns
  - fichiers_metadata
  
  These tables may have existing policies that reference auth.uid()
  and need to be updated to support Clerk authentication.
*/

-- ========================================
-- fichiers_import POLICIES
-- ========================================

-- Check if table exists and has RLS enabled
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fichiers_import') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own files" ON fichiers_import;
    DROP POLICY IF EXISTS "Users can insert files" ON fichiers_import;
    DROP POLICY IF EXISTS "Users can update their own files" ON fichiers_import;
    DROP POLICY IF EXISTS "Users can delete their own files" ON fichiers_import;
    
    -- Recreate with Clerk support
    CREATE POLICY "Users can view their own files"
      ON fichiers_import FOR SELECT
      TO authenticated
      USING (
        is_current_user(user_id) OR
        current_user_has_any_role(ARRAY['admin', 'manager'])
      );

    CREATE POLICY "Users can insert files"
      ON fichiers_import FOR INSERT
      TO authenticated
      WITH CHECK (
        is_current_user(user_id) AND
        EXISTS (
          SELECT 1 FROM users_profile
          WHERE (users_profile.id = auth.uid() OR users_profile.clerk_user_id = get_clerk_user_id())
          AND actif = true
        )
      );

    CREATE POLICY "Users can update their own files"
      ON fichiers_import FOR UPDATE
      TO authenticated
      USING (
        is_current_user(user_id) OR
        current_user_has_role('admin')
      )
      WITH CHECK (
        is_current_user(user_id) OR
        current_user_has_role('admin')
      );

    CREATE POLICY "Users can delete their own files"
      ON fichiers_import FOR DELETE
      TO authenticated
      USING (
        is_current_user(user_id) OR
        current_user_has_role('admin')
      );
  END IF;
END $$;

-- ========================================
-- fichier_donnees POLICIES
-- ========================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fichier_donnees') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view data from their files" ON fichier_donnees;
    DROP POLICY IF EXISTS "Users can insert data" ON fichier_donnees;
    DROP POLICY IF EXISTS "Users can update their data" ON fichier_donnees;
    DROP POLICY IF EXISTS "Users can delete their data" ON fichier_donnees;
    
    -- Recreate with Clerk support
    CREATE POLICY "Users can view data from their files"
      ON fichier_donnees FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM fichiers_import
          WHERE fichiers_import.id = fichier_donnees.fichier_id
          AND (
            is_current_user(fichiers_import.user_id) OR
            current_user_has_any_role(ARRAY['admin', 'manager'])
          )
        )
      );

    CREATE POLICY "Users can insert data"
      ON fichier_donnees FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM fichiers_import
          WHERE fichiers_import.id = fichier_donnees.fichier_id
          AND is_current_user(fichiers_import.user_id)
        )
      );

    CREATE POLICY "Users can update their data"
      ON fichier_donnees FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM fichiers_import
          WHERE fichiers_import.id = fichier_donnees.fichier_id
          AND (
            is_current_user(fichiers_import.user_id) OR
            current_user_has_role('admin')
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM fichiers_import
          WHERE fichiers_import.id = fichier_donnees.fichier_id
          AND (
            is_current_user(fichiers_import.user_id) OR
            current_user_has_role('admin')
          )
        )
      );

    CREATE POLICY "Users can delete their data"
      ON fichier_donnees FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM fichiers_import
          WHERE fichiers_import.id = fichier_donnees.fichier_id
          AND (
            is_current_user(fichiers_import.user_id) OR
            current_user_has_role('admin')
          )
        )
      );
  END IF;
END $$;

-- ========================================
-- user_custom_columns POLICIES
-- ========================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_custom_columns') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their custom columns" ON user_custom_columns;
    DROP POLICY IF EXISTS "Users can insert custom columns" ON user_custom_columns;
    DROP POLICY IF EXISTS "Users can update their custom columns" ON user_custom_columns;
    DROP POLICY IF EXISTS "Users can delete their custom columns" ON user_custom_columns;
    
    -- Recreate with Clerk support
    CREATE POLICY "Users can view their custom columns"
      ON user_custom_columns FOR SELECT
      TO authenticated
      USING (
        is_current_user(user_id) OR
        current_user_has_role('admin')
      );

    CREATE POLICY "Users can insert custom columns"
      ON user_custom_columns FOR INSERT
      TO authenticated
      WITH CHECK (
        is_current_user(user_id) AND
        EXISTS (
          SELECT 1 FROM users_profile
          WHERE (users_profile.id = auth.uid() OR users_profile.clerk_user_id = get_clerk_user_id())
          AND actif = true
        )
      );

    CREATE POLICY "Users can update their custom columns"
      ON user_custom_columns FOR UPDATE
      TO authenticated
      USING (
        is_current_user(user_id) OR
        current_user_has_role('admin')
      )
      WITH CHECK (
        is_current_user(user_id) OR
        current_user_has_role('admin')
      );

    CREATE POLICY "Users can delete their custom columns"
      ON user_custom_columns FOR DELETE
      TO authenticated
      USING (
        is_current_user(user_id) OR
        current_user_has_role('admin')
      );
  END IF;
END $$;

-- ========================================
-- fichiers_metadata POLICIES
-- ========================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'fichiers_metadata') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view metadata for their files" ON fichiers_metadata;
    DROP POLICY IF EXISTS "Users can insert metadata" ON fichiers_metadata;
    DROP POLICY IF EXISTS "Users can update metadata for their files" ON fichiers_metadata;
    DROP POLICY IF EXISTS "Users can delete metadata for their files" ON fichiers_metadata;
    
    -- Recreate with Clerk support
    CREATE POLICY "Users can view metadata for their files"
      ON fichiers_metadata FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM fichiers_import
          WHERE fichiers_import.id = fichiers_metadata.fichier_id
          AND (
            is_current_user(fichiers_import.user_id) OR
            current_user_has_any_role(ARRAY['admin', 'manager'])
          )
        )
      );

    CREATE POLICY "Users can insert metadata"
      ON fichiers_metadata FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM fichiers_import
          WHERE fichiers_import.id = fichiers_metadata.fichier_id
          AND is_current_user(fichiers_import.user_id)
        )
      );

    CREATE POLICY "Users can update metadata for their files"
      ON fichiers_metadata FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM fichiers_import
          WHERE fichiers_import.id = fichiers_metadata.fichier_id
          AND (
            is_current_user(fichiers_import.user_id) OR
            current_user_has_role('admin')
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM fichiers_import
          WHERE fichiers_import.id = fichiers_metadata.fichier_id
          AND (
            is_current_user(fichiers_import.user_id) OR
            current_user_has_role('admin')
          )
        )
      );

    CREATE POLICY "Users can delete metadata for their files"
      ON fichiers_metadata FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM fichiers_import
          WHERE fichiers_import.id = fichiers_metadata.fichier_id
          AND (
            is_current_user(fichiers_import.user_id) OR
            current_user_has_role('admin')
          )
        )
      );
  END IF;
END $$;
