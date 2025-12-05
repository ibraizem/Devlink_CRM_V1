# Clerk Migration Guide: From Supabase Auth

This guide helps you migrate from Supabase authentication to Clerk while maintaining backward compatibility.

## Migration Strategy

### Phase 1: Parallel Systems (Recommended)

Run both Supabase and Clerk authentication in parallel:

1. **Existing users** continue using Supabase Auth (`/auth/login`)
2. **New users** can use either system
3. **Gradually migrate** users to Clerk
4. **Eventually deprecate** Supabase Auth

### Phase 2: Full Migration (Optional)

Once all users are on Clerk, remove Supabase Auth completely.

## Step-by-Step Migration

### Step 1: Keep Both Systems Active

The current setup already supports both:

```typescript
// Supabase routes (existing)
/auth/login
/auth/register
/auth/forgot-password

// Clerk routes (new)
/auth/clerk-login
/auth/clerk-register
/auth/profile
```

### Step 2: Update Middleware for Dual Auth

Modify `middleware.ts` to check both auth systems:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { createClient } from '@/lib/utils/supabase/middleware'

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return
  }

  const { userId: clerkUserId } = auth()
  
  if (clerkUserId) {
    return
  }

  const response = createClient(request)
  const supabase = createServerClient(/* ... */)
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()

  if (!supabaseUser) {
    auth().protect()
  }
})
```

### Step 3: Create User Migration Utility

Create a utility to migrate users from Supabase to Clerk:

```typescript
// lib/migrations/migrateUserToClerk.ts
import { clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@/lib/utils/supabase/server'

export async function migrateUserToClerk(supabaseUserId: string) {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('users_profile')
    .select('*')
    .eq('user_id', supabaseUserId)
    .single()

  if (!profile) {
    throw new Error('User profile not found')
  }

  const clerkUser = await clerkClient.users.createUser({
    emailAddress: [profile.email],
    firstName: profile.prenom,
    lastName: profile.nom,
    publicMetadata: {
      supabaseUserId: supabaseUserId,
      role: profile.role,
      migratedAt: new Date().toISOString(),
    },
  })

  await supabase
    .from('users_profile')
    .update({ clerk_user_id: clerkUser.id })
    .eq('user_id', supabaseUserId)

  return clerkUser
}
```

### Step 4: Add Migration Table Column

Add a column to track Clerk migration:

```sql
ALTER TABLE users_profile 
ADD COLUMN clerk_user_id TEXT UNIQUE;

CREATE INDEX idx_users_profile_clerk_user_id 
ON users_profile(clerk_user_id);
```

### Step 5: Create Migration API Endpoint

```typescript
// app/api/migrate-to-clerk/route.ts
import { createClient } from '@/lib/utils/supabase/server'
import { migrateUserToClerk } from '@/lib/migrations/migrateUserToClerk'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const clerkUser = await migrateUserToClerk(user.id)
    
    return NextResponse.json({
      success: true,
      clerkUserId: clerkUser.id,
      message: 'Successfully migrated to Clerk',
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    )
  }
}
```

### Step 6: Add Migration UI

Create a component to prompt users to migrate:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function MigrationPrompt() {
  const [loading, setLoading] = useState(false)
  const [migrated, setMigrated] = useState(false)

  const handleMigrate = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/migrate-to-clerk', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMigrated(true)
        alert('Migration successful! Please log in again with your email.')
        window.location.href = '/auth/clerk-login'
      } else {
        alert('Migration failed. Please try again.')
      }
    } catch (error) {
      console.error('Migration error:', error)
      alert('Migration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (migrated) {
    return null
  }

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold mb-2">
        Migrate to Enhanced Authentication
      </h3>
      <p className="text-gray-600 mb-4">
        We're upgrading our authentication system. Click below to migrate your account
        and gain access to new features like social login and enhanced security.
      </p>
      <Button onClick={handleMigrate} disabled={loading}>
        {loading ? 'Migrating...' : 'Migrate Now'}
      </Button>
    </Card>
  )
}
```

### Step 7: Sync Data Between Systems

Use Clerk webhooks to keep data in sync:

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createClient } from '@/lib/utils/supabase/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!
  
  const headerPayload = headers()
  const body = await req.json()
  
  const wh = new Webhook(WEBHOOK_SECRET)
  const evt = wh.verify(JSON.stringify(body), {
    'svix-id': headerPayload.get('svix-id')!,
    'svix-timestamp': headerPayload.get('svix-timestamp')!,
    'svix-signature': headerPayload.get('svix-signature')!,
  })

  const supabase = createClient()

  switch (evt.type) {
    case 'user.created':
      await supabase.from('users_profile').insert({
        clerk_user_id: evt.data.id,
        email: evt.data.email_addresses[0]?.email_address,
        prenom: evt.data.first_name,
        nom: evt.data.last_name,
        role: 'user',
      })
      break

    case 'user.updated':
      await supabase
        .from('users_profile')
        .update({
          email: evt.data.email_addresses[0]?.email_address,
          prenom: evt.data.first_name,
          nom: evt.data.last_name,
        })
        .eq('clerk_user_id', evt.data.id)
      break

    case 'user.deleted':
      await supabase
        .from('users_profile')
        .delete()
        .eq('clerk_user_id', evt.data.id)
      break
  }

  return new Response('', { status: 200 })
}
```

## Code Comparison

### Authentication Check

**Before (Supabase):**
```typescript
import { createClient } from '@/lib/utils/supabase/client'

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  router.push('/auth/login')
}
```

**After (Clerk):**
```typescript
import { useAuthUser } from '@/lib/clerk'

const { isSignedIn, user } = useAuthUser()

if (!isSignedIn) {
  router.push('/auth/clerk-login')
}
```

### Getting User Data

**Before (Supabase):**
```typescript
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('users_profile')
  .select('*')
  .eq('user_id', user.id)
  .single()
```

**After (Clerk):**
```typescript
const metadata = await getUserMetadata()
// All data in one place
```

### Server-Side Protection

**Before (Supabase):**
```typescript
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  redirect('/auth/login')
}
```

**After (Clerk):**
```typescript
import { requireAuth } from '@/lib/clerk'

await requireAuth() // One line!
```

## Benefits of Migration

### For Users
- ✅ Social login (Google, Microsoft, GitHub, etc.)
- ✅ Better security (MFA, passkeys)
- ✅ Faster authentication
- ✅ Better UX with pre-built components

### For Developers
- ✅ Less code to maintain
- ✅ Better TypeScript support
- ✅ Built-in user management UI
- ✅ Comprehensive webhooks
- ✅ Better documentation

## Testing Migration

1. **Create test accounts** in both systems
2. **Test migration flow** with test accounts
3. **Verify data sync** between systems
4. **Test edge cases** (duplicate emails, etc.)
5. **Monitor logs** in Clerk Dashboard

## Rollback Plan

If you need to rollback:

1. **Keep Supabase routes active**
2. **Disable Clerk middleware** temporarily
3. **Revert to Supabase-only auth**
4. **Investigate issues** before retry

## Timeline Recommendation

- **Week 1**: Setup and testing
- **Week 2-3**: Parallel operation
- **Week 4-8**: User migration
- **Week 9+**: Supabase deprecation

## Support

For migration issues:
- Check migration logs in Supabase
- Review Clerk Dashboard for errors
- Test with curl/Postman before UI
- Contact support if needed

## Cleanup After Migration

Once all users are migrated:

1. Remove Supabase auth code
2. Remove migration endpoints
3. Update middleware to Clerk-only
4. Remove old auth routes
5. Update documentation
