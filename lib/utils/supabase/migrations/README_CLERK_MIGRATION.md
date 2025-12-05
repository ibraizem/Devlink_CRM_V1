# Clerk Authentication Migration Guide

This directory contains SQL migrations to integrate Clerk authentication with the existing Supabase database.

## Overview

The migration adds Clerk authentication support while maintaining backward compatibility with existing Supabase Auth users. The system can handle both authentication methods simultaneously during the transition period.

## Migration Files

### 1. `20250115000000_add_clerk_user_id.sql`
**Purpose**: Add Clerk user ID column to users_profile table

**Changes**:
- Adds `clerk_user_id` column (text, nullable)
- Creates unique index on `clerk_user_id`
- Adds check constraint to ensure either Supabase Auth ID or Clerk ID exists
- Makes `id` column nullable to support Clerk-only users

**Run First**: Yes

### 2. `20250115000001_clerk_helper_functions.sql`
**Purpose**: Create SQL helper functions for Clerk authentication

**Functions Created**:
- `get_clerk_user_id()`: Extracts Clerk user ID from JWT claims
- `is_clerk_authenticated()`: Checks if request has valid Clerk auth
- `get_user_profile_by_clerk_id(text)`: Gets profile by Clerk ID
- `sync_clerk_user(text, jsonb)`: Creates or updates user from Clerk data
- `get_current_user_profile()`: Gets current user (works with both auth methods)
- `current_user_has_role(text)`: Role checking that works with both auth methods
- `current_user_has_any_role(text[])`: Multi-role checking

**Dependencies**: Migration 1

### 3. `20250115000002_update_rls_policies_for_clerk.sql`
**Purpose**: Update RLS policies for main tables to support Clerk

**Tables Updated**:
- `users_profile`
- `leads`
- `rendezvous`
- `notes`
- `historique_actions`
- `documents`

**Helper Function**:
- `is_current_user(uuid)`: Checks if user ID matches current user (Supabase or Clerk)

**Dependencies**: Migrations 1 and 2

### 4. `20250115000003_update_other_tables_rls.sql`
**Purpose**: Update RLS policies for file management tables

**Tables Updated** (if they exist):
- `fichiers_import`
- `fichier_donnees`
- `user_custom_columns`
- `fichiers_metadata`

**Dependencies**: Migrations 1 and 2

### 5. `20250115000004_clerk_webhook_handler.sql`
**Purpose**: Create webhook handler for Clerk events

**Function**:
- `handle_clerk_webhook(text, jsonb)`: Handles user.created, user.updated, user.deleted events

**Events Supported**:
- `user.created`: Creates new user profile
- `user.updated`: Updates existing user profile
- `user.deleted`: Soft deletes user (sets actif = false)

**Dependencies**: Migration 1

### 6. `20250115000005_map_existing_users.sql`
**Purpose**: Migration helper functions for mapping existing users

**Functions**:
- `map_user_to_clerk(uuid, text)`: Maps single Supabase Auth user to Clerk
- `bulk_map_users_to_clerk(jsonb)`: Bulk maps multiple users

**Use Case**: One-time migration of existing users to Clerk

**Dependencies**: Migration 1

### 7. `20250115000006_storage_policies_clerk.sql`
**Purpose**: Update storage bucket policies for Clerk support

**Helper Function**:
- `is_storage_authenticated()`: Checks authentication for storage operations

**Buckets Updated**:
- `lead-attachments`
- `avatars` (if exists)

**Dependencies**: Migration 2

## Running the Migrations

### Option 1: Supabase Dashboard
1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste each migration file in order
3. Execute each migration
4. Verify success before proceeding to the next

### Option 2: Supabase CLI
```bash
# Run all migrations
supabase db reset

# Or run individually
supabase db execute --file lib/utils/supabase/migrations/20250115000000_add_clerk_user_id.sql
supabase db execute --file lib/utils/supabase/migrations/20250115000001_clerk_helper_functions.sql
supabase db execute --file lib/utils/supabase/migrations/20250115000002_update_rls_policies_for_clerk.sql
supabase db execute --file lib/utils/supabase/migrations/20250115000003_update_other_tables_rls.sql
supabase db execute --file lib/utils/supabase/migrations/20250115000004_clerk_webhook_handler.sql
supabase db execute --file lib/utils/supabase/migrations/20250115000005_map_existing_users.sql
supabase db execute --file lib/utils/supabase/migrations/20250115000006_storage_policies_clerk.sql
```

### Option 3: psql
```bash
psql "your-connection-string" -f lib/utils/supabase/migrations/20250115000000_add_clerk_user_id.sql
psql "your-connection-string" -f lib/utils/supabase/migrations/20250115000001_clerk_helper_functions.sql
# ... continue for all migrations
```

## Post-Migration Steps

### 1. Configure Clerk JWT Template

In your Clerk Dashboard:
1. Go to JWT Templates
2. Create a new template for Supabase
3. Add the following claims:

```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated"
}
```

### 2. Set up Clerk Webhook

1. In Clerk Dashboard, go to Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/clerk-webhook`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy the signing secret

### 3. Create Supabase Edge Function for Webhook

Create `supabase/functions/clerk-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabase.rpc('handle_clerk_webhook', {
      p_event_type: payload.type,
      p_user_data: payload.data
    })

    if (error) throw error

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

### 4. Update Application Code

Use the provided TypeScript helpers in `lib/utils/clerk-supabase-helpers.ts` to interact with Clerk-authenticated users.

### 5. Migrate Existing Users (Optional)

If you have existing Supabase Auth users to migrate:

```sql
-- Single user
SELECT map_user_to_clerk(
  'supabase-user-uuid'::uuid,
  'user_2xxxxxxxxxxxxx'
);

-- Bulk users
SELECT bulk_map_users_to_clerk('[
  {
    "supabase_user_id": "uuid-1",
    "clerk_user_id": "user_2xxx1"
  },
  {
    "supabase_user_id": "uuid-2",
    "clerk_user_id": "user_2xxx2"
  }
]'::jsonb);
```

## Testing

### Test Authentication
```sql
-- Should return true when authenticated
SELECT is_clerk_authenticated();

-- Should return clerk user ID
SELECT get_clerk_user_id();

-- Should return user profile
SELECT * FROM get_current_user_profile();
```

### Test RLS Policies
```sql
-- Test as Clerk user (set JWT claims in request)
SELECT * FROM leads; -- Should only see assigned leads

-- Test role checking
SELECT current_user_has_role('admin'); -- Should return true/false based on role
```

## Rollback

To rollback the migrations:

```sql
-- Rollback storage policies
DROP POLICY IF EXISTS "Authenticated users can upload to lead-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view lead-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update lead-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete lead-attachments" ON storage.objects;
DROP FUNCTION IF EXISTS is_storage_authenticated();

-- Rollback user mapping functions
DROP FUNCTION IF EXISTS map_user_to_clerk(uuid, text);
DROP FUNCTION IF EXISTS bulk_map_users_to_clerk(jsonb);

-- Rollback webhook handler
DROP FUNCTION IF EXISTS handle_clerk_webhook(text, jsonb);

-- Rollback RLS policies (recreate original policies from 20251008150252_create_crm_tables2.sql)
-- ... (see original migration file)

-- Rollback helper functions
DROP FUNCTION IF EXISTS is_current_user(uuid);
DROP FUNCTION IF EXISTS current_user_has_any_role(text[]);
DROP FUNCTION IF EXISTS current_user_has_role(text);
DROP FUNCTION IF EXISTS get_current_user_profile();
DROP FUNCTION IF EXISTS sync_clerk_user(text, jsonb);
DROP FUNCTION IF EXISTS get_user_profile_by_clerk_id(text);
DROP FUNCTION IF EXISTS is_clerk_authenticated();
DROP FUNCTION IF EXISTS get_clerk_user_id();

-- Rollback schema changes
ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS chk_users_profile_auth_method;
ALTER TABLE users_profile ALTER COLUMN id SET NOT NULL;
DROP INDEX IF EXISTS idx_users_profile_clerk_user_id_lookup;
DROP INDEX IF EXISTS idx_users_profile_clerk_user_id;
ALTER TABLE users_profile DROP COLUMN IF EXISTS clerk_user_id;
```

## Troubleshooting

### Issue: "auth.uid() returns null"
- Ensure JWT is properly configured in Clerk
- Check that the JWT is being sent in the Authorization header
- Verify Supabase JWT secret matches Clerk's JWKS

### Issue: "RLS policies denying access"
- Check `get_clerk_user_id()` returns the correct user ID
- Verify user profile exists in `users_profile` table
- Ensure `clerk_user_id` is correctly set

### Issue: "Webhook not creating users"
- Check webhook endpoint is accessible
- Verify webhook signing secret is correct
- Check Supabase Edge Function logs

## Security Considerations

1. **JWT Secret**: Keep your Clerk JWT signing key secure
2. **Webhook Secret**: Verify webhook signatures in production
3. **RLS Policies**: Always test policies thoroughly before deploying
4. **Service Role Key**: Only use service role key in secure backend environments
5. **CORS**: Configure CORS appropriately for your domains

## Support

For issues or questions:
1. Check Clerk documentation: https://clerk.com/docs
2. Check Supabase documentation: https://supabase.com/docs
3. Review migration logs for errors
4. Test with SQL queries to debug RLS policies
