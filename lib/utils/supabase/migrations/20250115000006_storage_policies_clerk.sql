/*
  # Migration: Update Storage Policies for Clerk

  This migration updates storage bucket policies to support Clerk authentication.
  
  ## Buckets Updated
  - lead-attachments
  - avatars (if exists)
  - Any other custom buckets
  
  The policies will check for both Supabase Auth (auth.uid()) and Clerk authentication.
*/

-- ========================================
-- Helper function for storage policies
-- ========================================

-- Function to check if request is authenticated (Supabase or Clerk)
CREATE OR REPLACE FUNCTION is_storage_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL OR is_clerk_authenticated();
$$;

COMMENT ON FUNCTION is_storage_authenticated() IS 'Returns true if request is authenticated via Supabase Auth or Clerk';

-- ========================================
-- lead-attachments bucket policies
-- ========================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated downloads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Recreate with Clerk support
CREATE POLICY "Authenticated users can upload to lead-attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lead-attachments' AND
    is_storage_authenticated()
  );

CREATE POLICY "Authenticated users can view lead-attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'lead-attachments' AND
    is_storage_authenticated()
  );

CREATE POLICY "Authenticated users can update lead-attachments"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'lead-attachments' AND
    is_storage_authenticated()
  )
  WITH CHECK (
    bucket_id = 'lead-attachments' AND
    is_storage_authenticated()
  );

CREATE POLICY "Authenticated users can delete lead-attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'lead-attachments' AND
    is_storage_authenticated()
  );

-- ========================================
-- avatars bucket policies (if exists)
-- ========================================

-- Check if avatars bucket exists and create policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) THEN
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects';

    -- Recreate with Clerk support
    EXECUTE '
      CREATE POLICY "Users can upload avatars"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
          bucket_id = ''avatars'' AND
          is_storage_authenticated()
        )
    ';

    EXECUTE '
      CREATE POLICY "Public can view avatars"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = ''avatars'')
    ';

    EXECUTE '
      CREATE POLICY "Users can update own avatars"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
          bucket_id = ''avatars'' AND
          is_storage_authenticated()
        )
        WITH CHECK (
          bucket_id = ''avatars'' AND
          is_storage_authenticated()
        )
    ';

    EXECUTE '
      CREATE POLICY "Users can delete own avatars"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
          bucket_id = ''avatars'' AND
          is_storage_authenticated()
        )
    ';
  END IF;
END $$;

-- ========================================
-- Generic storage bucket policies template
-- ========================================

/*
  For additional buckets, use this template:

  CREATE POLICY "policy_name"
    ON storage.objects FOR [SELECT|INSERT|UPDATE|DELETE]
    TO authenticated
    USING (
      bucket_id = 'your-bucket-name' AND
      is_storage_authenticated()
    )
    WITH CHECK (
      bucket_id = 'your-bucket-name' AND
      is_storage_authenticated()
    );
*/
