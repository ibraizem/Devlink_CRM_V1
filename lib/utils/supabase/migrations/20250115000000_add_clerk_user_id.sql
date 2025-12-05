/*
  # Migration: Add Clerk User ID Support

  This migration adds support for Clerk authentication by:
  1. Adding clerk_user_id column to users_profile table
  2. Creating indexes for performance
  3. Adding constraints to ensure data integrity
  
  ## Changes
  - Add clerk_user_id column (nullable initially for backward compatibility)
  - Add unique constraint on clerk_user_id
  - Add index for fast lookups
  - Add check constraint to ensure either auth.users id or clerk_user_id is present
*/

-- Add clerk_user_id column to users_profile
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS clerk_user_id text;

-- Create unique index on clerk_user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_profile_clerk_user_id 
ON users_profile(clerk_user_id) 
WHERE clerk_user_id IS NOT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_clerk_user_id_lookup 
ON users_profile(clerk_user_id);

-- Add comment to document the column
COMMENT ON COLUMN users_profile.clerk_user_id IS 'Clerk authentication user ID (user_xxxxx format)';

-- Alter foreign key constraint on users_profile.id to be optional
-- This allows users to exist with only clerk_user_id
ALTER TABLE users_profile 
ALTER COLUMN id DROP NOT NULL;

-- Add check constraint to ensure at least one auth method exists
ALTER TABLE users_profile
ADD CONSTRAINT chk_users_profile_auth_method 
CHECK (id IS NOT NULL OR clerk_user_id IS NOT NULL);
