# Clerk Authentication Migration Summary

## Overview
This document summarizes the migration from Supabase Auth to Clerk authentication across the DevLink CRM application.

## Core Changes

### 1. Authentication Hooks

#### `hooks/useAuth.ts`
- **Before**: Used Supabase `auth.getSession()` and `onAuthStateChange()`
- **After**: Uses Clerk's `useUser()` and `useClerk()` hooks
- Returns `user.id` as Clerk user ID
- `signOut()` uses `clerkSignOut()`

#### `hooks/useUser.ts`
- **Before**: Used Supabase `auth.getSession()`
- **After**: Uses Clerk's `useUser()` hook
- Returns Clerk user object with `id` as Clerk user ID

### 2. Authentication Functions (`lib/types/auth.ts`)

- **signIn/signUp/signOut**: Now throw errors directing to use Clerk flows
- **getCurrentUser()**: Uses `currentUser()` from `@clerk/nextjs/server`
- **getUserProfile()**: Updated to query by `clerk_user_id` instead of Supabase auth ID

### 3. Database Schema Changes Required

The `users_profile` table must have a `clerk_user_id` field:

```sql
ALTER TABLE users_profile ADD COLUMN clerk_user_id TEXT UNIQUE;
CREATE INDEX idx_users_profile_clerk_user_id ON users_profile(clerk_user_id);
```

The `fichiers_import` table must have a `clerk_user_id` field:

```sql
ALTER TABLE fichiers_import ADD COLUMN clerk_user_id TEXT;
CREATE INDEX idx_fichiers_import_clerk_user_id ON fichiers_import(clerk_user_id);
```

Other tables that reference users should continue using `users_profile.id` (UUID) as foreign keys.

### 4. Lead Management (`lib/types/leads.ts`)

All functions updated to:
1. Use `auth()` from `@clerk/nextjs/server`
2. Query `users_profile` by `clerk_user_id` to get internal profile ID
3. Use profile ID for database operations

Updated functions:
- `createLead()` - Resolves Clerk user to profile ID
- `updateLead()` - Resolves Clerk user to profile ID
- `createNote()` - Resolves Clerk user to profile ID
- `assignLeadToAgent()` - Resolves Clerk user to profile ID
- `uploadAttachment()` - Resolves Clerk user to profile ID
- `logCommunication()` - Resolves Clerk user to profile ID

### 5. Services

#### `lib/services/fileService.ts`
- `getFiles()`: Parameter changed from `userId` to `clerkUserId`, queries by `clerk_user_id`
- `uploadFile()`: Uses `clerkUserId` instead of Supabase user ID
- `createFileRecord()`: Stores `clerk_user_id` in database
- `getCustomColumns()`: Queries by `clerk_user_id`

#### `lib/services/webhookService.ts`
- `createWebhook()`: Takes `clerkUserId` parameter, resolves to profile ID for created_by field

### 6. Hooks

#### `hooks/useCrmData2.ts`
- `loadActiveFiles()`: Queries `fichiers_import` by `clerk_user_id`

#### `hooks/useFileList.ts`
- Uses `useAuth()` hook which now returns Clerk user
- All file operations use Clerk user ID

#### `hooks/useFileManager.ts`
- `handleFileUpload()`: Takes `clerkUserId` in options
- `loadFiles()`: Parameter changed to `clerkUserId`
- Inserts use `clerk_user_id` field

#### `hooks/useFileData.ts`
- Removed Supabase auth check (no longer needed)

### 7. Pages

All protected pages updated to use Clerk's `useUser()` hook:

- `app/dashboard/page.tsx`
- `app/settings/page.tsx`
- `app/compte/page.tsx`
- `app/rapports/page.tsx`
- `app/rendezvous/page.tsx`
- `app/webhooks/page.tsx`
- `app/analytics/page.tsx`

Pattern:
```typescript
import { useUser } from '@clerk/nextjs';

const { user, isLoaded } = useUser();

useEffect(() => {
  if (!isLoaded) return;
  if (!user) router.push('/auth/login');
}, [user, isLoaded, router]);
```

### 8. API Routes

#### Pattern Used:
```typescript
import { auth } from '@clerk/nextjs/server';
import { getUserProfileId } from '@/lib/utils/supabase/server';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const profileId = await getUserProfileId();
  if (!profileId) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }
  // Use profileId for database operations
}
```

#### Updated Routes:
- `app/api/webhooks/route.ts` (GET, POST)

#### Remaining Routes to Update:
- `lib/api/sms/route.ts`
- `lib/api/rendezvous/route.ts`
- `lib/api/leads/userColumns.ts` (4 occurrences)
- `lib/api/emails/route.ts`
- `lib/api/calls/route.ts`
- `app/api/webhooks/[id]/test/route.ts`
- `app/api/webhooks/[id]/route.ts` (3 occurrences)
- `app/api/webhooks/[id]/deliveries/route.ts`
- `app/api/webhooks/trigger/route.ts`
- `app/webhooks/[id]/deliveries/page.tsx`

### 9. Utility Functions

#### `lib/utils/supabase/server.ts`
Added helper function:
```typescript
export async function getUserProfileId(): Promise<string | null>
```
- Gets Clerk user ID via `auth()`
- Queries `users_profile` by `clerk_user_id`
- Returns internal profile UUID for foreign key relationships

#### `lib/utils/supabase/client.ts`
Added helper function:
```typescript
export async function getUserProfileIdClient(clerkUserId: string): Promise<string | null>
```
- Client-side version of profile lookup
- Takes Clerk user ID as parameter
- Returns users_profile.id UUID

## Architecture Notes

### Two-Tier User System

1. **Clerk User ID** (String): External identity, stored as `clerk_user_id` in `users_profile`
2. **Profile UUID**: Internal database ID, used for all foreign key relationships

This approach:
- Maintains existing foreign key relationships
- Allows easy migration from Supabase Auth
- Provides flexibility to change auth providers in future

### Data Flow

```
Clerk Auth → clerk_user_id → Query users_profile → Get profile.id → Use in DB operations
```

Example:
```typescript
const { userId } = await auth(); // Clerk user ID
const profile = await supabase
  .from('users_profile')
  .select('id')
  .eq('clerk_user_id', userId)
  .single();
// Now use profile.id for leads, notes, etc.
```

## Migration Steps

### 1. Add Clerk to Project

```bash
npm install @clerk/nextjs
```

Configure in `app/layout.tsx`:
```typescript
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### 2. Database Migration

```sql
-- Add clerk_user_id to users_profile
ALTER TABLE users_profile 
ADD COLUMN clerk_user_id TEXT UNIQUE;

CREATE INDEX idx_users_profile_clerk_user_id 
ON users_profile(clerk_user_id);

-- Add clerk_user_id to fichiers_import  
ALTER TABLE fichiers_import 
ADD COLUMN clerk_user_id TEXT;

CREATE INDEX idx_fichiers_import_clerk_user_id 
ON fichiers_import(clerk_user_id);

-- Add to custom columns table if exists
ALTER TABLE user_custom_columns 
ADD COLUMN clerk_user_id TEXT;

CREATE INDEX idx_user_custom_columns_clerk_user_id 
ON user_custom_columns(clerk_user_id);
```

### 3. Code Updates

- ✅ Authentication hooks (useAuth, useUser)
- ✅ Authentication functions (auth.ts)
- ✅ Lead management (leads.ts)
- ✅ File services (fileService.ts)
- ✅ Webhook service (webhookService.ts)
- ✅ Hooks (useCrmData2, useFileList, useFileManager, useFileData)
- ✅ Page components (dashboard, settings, compte, rapports, rendezvous, webhooks, analytics)
- ✅ Utility functions (server.ts, client.ts)
- ⚠️ API routes (partially complete, see list above)

### 4. Clerk Webhook Setup

Create `app/api/webhooks/clerk/route.ts`:

```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@/lib/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  const headerPayload = headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  const evt = wh.verify(body, {
    "svix-id": svix_id,
    "svix-timestamp": svix_timestamp,
    "svix-signature": svix_signature,
  }) as WebhookEvent

  const supabase = createClient(cookies())

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data
    
    await supabase.from('users_profile').insert({
      clerk_user_id: id,
      email: email_addresses[0]?.email_address,
      nom: last_name || '',
      prenom: first_name || '',
      role: 'telepro',
      actif: true,
    })
  }

  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data
    
    await supabase
      .from('users_profile')
      .update({
        email: email_addresses[0]?.email_address,
        nom: last_name || '',
        prenom: first_name || '',
      })
      .eq('clerk_user_id', id)
  }

  if (evt.type === 'user.deleted') {
    const { id } = evt.data
    
    await supabase
      .from('users_profile')
      .update({ actif: false })
      .eq('clerk_user_id', id)
  }

  return new Response('', { status: 200 })
}
```

### 5. RLS Policy Updates

Supabase RLS policies need updates. Since Clerk manages auth, you have two options:

#### Option A: Use Service Role Key (Bypass RLS)
For internal API routes, use service role key to bypass RLS. Implement authorization in application code.

#### Option B: Custom JWT Claims
Pass Clerk user ID via custom function:

```sql
-- Create a function to get current Clerk user
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'sub';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policies
CREATE POLICY "Users can view their own files" ON fichiers_import
  FOR SELECT USING (clerk_user_id = get_clerk_user_id());
```

This requires setting up Supabase JWT integration with Clerk.

## Testing Checklist

- [ ] User sign up creates profile in users_profile
- [ ] User sign in works and returns correct user ID
- [ ] Dashboard loads user-specific data
- [ ] File upload stores clerk_user_id
- [ ] Lead creation resolves to profile ID
- [ ] Notes/activities link to correct user
- [ ] API routes check authentication
- [ ] Webhooks create users correctly
- [ ] Protected pages redirect unauthenticated users

## Benefits of Migration

1. **Better Auth UX**: Pre-built, customizable UI components
2. **Multiple Providers**: OAuth (Google, GitHub, etc.) out of the box
3. **User Management**: Built-in admin dashboard
4. **Security**: Industry-standard practices, automatic security updates
5. **Scalability**: Handles authentication infrastructure
6. **Compliance**: GDPR, SOC 2, etc. handled by Clerk
7. **Developer Experience**: Better hooks and TypeScript support

## Rollback Plan

If issues arise:

1. **Code Rollback**: `git revert` to previous commits
2. **Database**: Keep `clerk_user_id` columns (nullable) for future attempts
3. **Dual Mode**: Both Clerk and Supabase Auth can coexist during transition
4. **Data Integrity**: No data loss - all existing relationships maintained via users_profile.id

## Next Steps

1. Complete remaining API route updates
2. Set up Clerk webhook endpoint
3. Configure Clerk dashboard (branding, email templates)
4. Test all authentication flows
5. Update environment variables
6. Deploy and monitor
7. Migrate existing users (if any)
