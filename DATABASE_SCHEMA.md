# Database Schema for Lead Detail Features

This document describes the database tables and storage buckets required for the lead detail view features.

## Authentication

The system supports dual authentication methods:
- **Supabase Auth**: Traditional authentication using `auth.users` and `auth.uid()`
- **Clerk Auth**: Modern authentication using Clerk with JWT tokens

See `lib/utils/supabase/migrations/README_CLERK_MIGRATION.md` for Clerk integration details.

## Required Tables

### 1. users_profile
User profiles that extend authentication data.

**Columns:**
- `id` (uuid, primary key, nullable) - Supabase Auth user ID (nullable for Clerk-only users)
- `clerk_user_id` (text, unique) - Clerk user ID (format: user_xxxxx)
- `nom` (text) - Last name
- `prenom` (text) - First name
- `role` (text) - User role: 'admin', 'manager', 'telepro'
- `actif` (boolean) - Active status
- `avatar_url` (text) - Profile picture URL
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Constraints:**
- Either `id` or `clerk_user_id` must be present
- `clerk_user_id` is unique when not null

### 2. leads
Already exists in the system. Main leads table.

### 3. notes
Already exists. Used for storing lead notes.

**Columns:**
- `id` (uuid, primary key)
- `lead_id` (uuid, foreign key to leads)
- `auteur_id` (uuid, foreign key to users_profile)
- `contenu` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### 3. historique_actions
Already exists. Used for activity timeline and status history.

**Columns:**
- `id` (uuid, primary key)
- `lead_id` (uuid, foreign key to leads)
- `agent_id` (uuid, foreign key to users_profile)
- `type_action` (text) - Values: 'note', 'statut_change', 'lead_assigne', 'appel', 'email', 'whatsapp', 'sms', 'rendezvous'
- `description` (text)
- `metadata` (jsonb) - Stores additional data like call duration, old/new status, etc.
- `created_at` (timestamp)

### 4. lead_attachments (NEW - needs to be created)
Used for storing file attachments for leads.

**SQL to create:**
```sql
CREATE TABLE IF NOT EXISTS lead_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  fichier_nom text NOT NULL,
  fichier_url text NOT NULL,
  fichier_type text,
  fichier_taille bigint,
  uploaded_by uuid REFERENCES users_profile(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_lead_attachments_lead_id ON lead_attachments(lead_id);
CREATE INDEX idx_lead_attachments_uploaded_by ON lead_attachments(uploaded_by);
```

## Required Storage Buckets

### lead-attachments
Storage bucket for lead attachments.

**To create:**
1. Go to Supabase Storage
2. Create new bucket named `lead-attachments`
3. Set policies:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lead-attachments');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated downloads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lead-attachments');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lead-attachments');
```

## Row Level Security (RLS) Policies

### lead_attachments
```sql
-- Enable RLS
ALTER TABLE lead_attachments ENABLE ROW LEVEL SECURITY;

-- Allow users to view attachments for leads they have access to
CREATE POLICY "Users can view lead attachments"
ON lead_attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_attachments.lead_id
  )
);

-- Allow users to insert attachments for leads they have access to
CREATE POLICY "Users can insert lead attachments"
ON lead_attachments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_attachments.lead_id
  )
);

-- Allow users to delete attachments
CREATE POLICY "Users can delete lead attachments"
ON lead_attachments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = lead_attachments.lead_id
  )
);
```

## Migration Steps

1. Run the SQL to create the `lead_attachments` table
2. Create the `lead-attachments` storage bucket
3. Apply the storage policies
4. Apply the RLS policies
5. Test file upload functionality

## Verification

After running the migrations, verify:
- Table `lead_attachments` exists
- Storage bucket `lead-attachments` exists
- Policies are correctly applied
- Test uploading a file from the lead detail view

## Formula Engine Tables

### 5. calculated_columns (NEW - needs to be created)
Stores formula definitions and metadata for calculated columns.

**SQL to create:**
```sql
CREATE TABLE IF NOT EXISTS calculated_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users_profile(user_id) ON DELETE CASCADE,
  column_name text NOT NULL,
  formula text NOT NULL,
  formula_type text NOT NULL DEFAULT 'calculation',
  result_type text NOT NULL DEFAULT 'text',
  is_active boolean NOT NULL DEFAULT true,
  cache_duration integer DEFAULT 3600,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, column_name)
);

CREATE INDEX idx_calculated_columns_user_id ON calculated_columns(user_id);
CREATE INDEX idx_calculated_columns_active ON calculated_columns(is_active);
```

### 6. calculated_results (NEW - needs to be created)
Stores cached results of formula executions.

**SQL to create:**
```sql
CREATE TABLE IF NOT EXISTS calculated_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid NOT NULL REFERENCES calculated_columns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES fichier_donnees(id) ON DELETE CASCADE,
  result_value jsonb,
  computed_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  UNIQUE(column_id, lead_id)
);

CREATE INDEX idx_calculated_results_column_id ON calculated_results(column_id);
CREATE INDEX idx_calculated_results_lead_id ON calculated_results(lead_id);
CREATE INDEX idx_calculated_results_expires_at ON calculated_results(expires_at);
```

### 7. ai_enrichment_cache (NEW - needs to be created)
Caches AI enrichment API responses.

**SQL to create:**
```sql
CREATE TABLE IF NOT EXISTS ai_enrichment_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  enrichment_type text NOT NULL,
  input_data jsonb NOT NULL,
  result_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL
);

CREATE INDEX idx_ai_enrichment_cache_key ON ai_enrichment_cache(cache_key);
CREATE INDEX idx_ai_enrichment_cache_type_expires ON ai_enrichment_cache(enrichment_type, expires_at);
```

### RLS Policies for Formula Engine Tables

```sql
-- calculated_columns
ALTER TABLE calculated_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calculated columns"
ON calculated_columns FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own calculated columns"
ON calculated_columns FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own calculated columns"
ON calculated_columns FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own calculated columns"
ON calculated_columns FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- calculated_results
ALTER TABLE calculated_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calculated results"
ON calculated_results FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calculated_columns
    WHERE calculated_columns.id = calculated_results.column_id
    AND calculated_columns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert calculated results"
ON calculated_results FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM calculated_columns
    WHERE calculated_columns.id = calculated_results.column_id
    AND calculated_columns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update calculated results"
ON calculated_results FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calculated_columns
    WHERE calculated_columns.id = calculated_results.column_id
    AND calculated_columns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete calculated results"
ON calculated_results FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM calculated_columns
    WHERE calculated_columns.id = calculated_results.column_id
    AND calculated_columns.user_id = auth.uid()
  )
);

-- ai_enrichment_cache (global cache, readable by all authenticated users)
ALTER TABLE ai_enrichment_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view cache"
ON ai_enrichment_cache FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can insert cache"
ON ai_enrichment_cache FOR INSERT
TO authenticated
WITH CHECK (true);
```
