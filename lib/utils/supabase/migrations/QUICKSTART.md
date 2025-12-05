# Clerk Authentication - Quick Start Guide

Get Clerk authentication working with your Supabase database in 5 steps.

## Prerequisites

- Supabase project set up
- Clerk account created
- Next.js application running

## Step 0: Install Required Packages (2 minutes)

**IMPORTANT:** Install these packages before proceeding:

```bash
yarn add @clerk/nextjs svix
```

Or with npm:
```bash
npm install @clerk/nextjs svix
```

These packages are required for:
- `@clerk/nextjs` - Clerk authentication SDK
- `svix` - Webhook signature verification

## Step 1: Run Database Migrations (5 minutes)

Open Supabase SQL Editor and run these files in order:

```bash
# Copy each file content and run in SQL Editor
1. 20250115000000_add_clerk_user_id.sql
2. 20250115000001_clerk_helper_functions.sql
3. 20250115000002_update_rls_policies_for_clerk.sql
4. 20250115000003_update_other_tables_rls.sql
5. 20250115000004_clerk_webhook_handler.sql
6. 20250115000005_map_existing_users.sql
7. 20250115000006_storage_policies_clerk.sql
```

**Or use Supabase CLI:**
```bash
supabase db reset  # Runs all migrations
```

## Step 2: Configure Clerk JWT Template (3 minutes)

1. Go to Clerk Dashboard → JWT Templates
2. Click "New template" → Select "Supabase"
3. Name it: `supabase`
4. Set these claims:

```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated"
}
```

5. Save the template

## Step 3: Set Up Environment Variables (2 minutes)

Add to `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx  # From step 4
```

## Step 4: Configure Clerk Webhook (3 minutes)

1. Go to Clerk Dashboard → Webhooks
2. Click "Add Endpoint"
3. Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
4. Subscribe to events:
   - ✅ user.created
   - ✅ user.updated
   - ✅ user.deleted
5. Copy the "Signing Secret" → Add to `.env.local` as `CLERK_WEBHOOK_SECRET`

## Step 5: Test It! (2 minutes)

### Test 1: Server Component

Create `app/test/page.tsx`:

```typescript
import { auth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'

export default async function TestPage() {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })
  
  if (!token) return <div>Not authenticated</div>

  const supabase = createClerkSupabaseClient(
    token,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: profile } = await supabase.rpc('get_current_user_profile')
  
  return (
    <div>
      <h1>Profile Test</h1>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  )
}
```

### Test 2: Check Database

In Supabase SQL Editor:

```sql
-- Should see your Clerk user
SELECT * FROM users_profile WHERE clerk_user_id IS NOT NULL;

-- Test auth functions
SELECT get_clerk_user_id();
SELECT is_clerk_authenticated();
```

## Done! 🎉

You're now using Clerk with Supabase!

## Common Usage Patterns

### Get Current User Profile

```typescript
import { createClerkSupabaseClient, getCurrentUserProfile } from '@/lib/utils/clerk-supabase-helpers'

const profile = await getCurrentUserProfile(supabase)
console.log(profile.role) // 'admin', 'manager', or 'telepro'
```

### Check User Role

```typescript
import { hasRole } from '@/lib/utils/clerk-supabase-helpers'

if (await hasRole(supabase, 'admin')) {
  // Show admin features
}
```

### Fetch User's Data

```typescript
// RLS policies automatically filter to user's data
const { data: leads } = await supabase
  .from('leads')
  .select('*')

// Only returns leads assigned to current user (unless admin/manager)
```

### Server Action

```typescript
'use server'

import { auth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'

export async function updateLead(leadId: string, data: any) {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })
  
  const supabase = createClerkSupabaseClient(token!, url, key)
  
  return await supabase
    .from('leads')
    .update(data)
    .eq('id', leadId)
}
```

## Troubleshooting

### "auth.uid() returns null"
- Check JWT template is named correctly in Clerk Dashboard
- Verify token is being passed: `await getToken({ template: 'supabase' })`

### "User not found in database"
- Check webhook is receiving events (Clerk Dashboard → Webhooks → Logs)
- Manually trigger sync: Sign out and sign in again

### "RLS policy denying access"
- Check user profile exists: `SELECT * FROM users_profile WHERE clerk_user_id = 'user_xxx'`
- Test SQL function: `SELECT get_clerk_user_id()` (should return your Clerk user ID)

### "Webhook not working"
- Verify endpoint is accessible from internet
- Check webhook secret matches in `.env.local`
- View logs at Clerk Dashboard → Webhooks → [Your Endpoint] → Attempts

## Next Steps

1. **Protect Routes**: Add middleware to protect your app routes
2. **Role Management**: Set user roles in Clerk metadata or database
3. **Migrate Users**: Use `map_user_to_clerk()` for existing Supabase Auth users
4. **Customize**: Add custom claims to JWT template as needed

## More Help

- 📖 Full Guide: `README_CLERK_MIGRATION.md`
- 💡 Examples: `EXAMPLES.md`
- 📊 Summary: `MIGRATION_SUMMARY.md`
- 🔧 Helpers: `lib/utils/clerk-supabase-helpers.ts`

## Quick Reference

### Important Functions

```typescript
// SQL Functions (use with supabase.rpc())
get_clerk_user_id()                    // Get current Clerk user ID
is_clerk_authenticated()               // Check if authenticated
get_current_user_profile()             // Get user profile
current_user_has_role('admin')         // Check role
current_user_has_any_role(['admin', 'manager'])  // Check multiple roles

// TypeScript Helpers
createClerkSupabaseClient(token, url, key)  // Create authenticated client
getCurrentUserProfile(supabase)             // Get profile
hasRole(supabase, 'admin')                  // Check role
hasAnyRole(supabase, ['admin', 'manager'])  // Check multiple roles
syncClerkUserToSupabase(supabase, user)     // Sync user manually
```

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL              # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY         # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY             # Supabase service role (webhooks)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY     # Clerk publishable key
CLERK_SECRET_KEY                      # Clerk secret key
CLERK_WEBHOOK_SECRET                  # Clerk webhook signing secret
```

### Clerk JWT Template

Name: `supabase`
```json
{
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address}}",
  "role": "authenticated"
}
```
