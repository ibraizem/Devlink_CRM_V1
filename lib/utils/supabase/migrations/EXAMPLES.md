# Clerk + Supabase Integration Examples

This document provides practical examples of using Clerk authentication with Supabase RLS policies.

## Table of Contents
1. [Server Components](#server-components)
2. [Client Components](#client-components)
3. [API Routes](#api-routes)
4. [Server Actions](#server-actions)
5. [Middleware](#middleware)

## Server Components

### Example 1: Fetch User Profile

```typescript
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'

export default async function DashboardPage() {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })
  
  if (!token) {
    return <div>Not authenticated</div>
  }

  const supabase = createClerkSupabaseClient(
    token,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch current user profile
  const { data, error } = await supabase.rpc('get_current_user_profile')
  
  if (error || !data?.[0]) {
    return <div>Error loading profile</div>
  }

  const profile = data[0]

  return (
    <div>
      <h1>Welcome, {profile.prenom} {profile.nom}</h1>
      <p>Role: {profile.role}</p>
    </div>
  )
}
```

### Example 2: Fetch User's Leads

```typescript
// app/leads/page.tsx
import { auth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'
import { LeadsTable } from '@/components/leads/LeadsTable'

export default async function LeadsPage() {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })

  const supabase = createClerkSupabaseClient(
    token,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // RLS policies will automatically filter to user's assigned leads
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
    return <div>Error loading leads</div>
  }

  return <LeadsTable leads={leads} />
}
```

### Example 3: Role-Based Access

```typescript
// app/admin/page.tsx
import { auth, currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { createClerkSupabaseClient, hasRole } from '@/lib/utils/clerk-supabase-helpers'

export default async function AdminPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })

  const supabase = createClerkSupabaseClient(
    token!,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check if user is admin
  const isAdmin = await hasRole(supabase, 'admin')

  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Fetch all users (admin only)
  const { data: users } = await supabase
    .from('users_profile')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1>Admin Panel</h1>
      <UsersList users={users} />
    </div>
  )
}
```

## Client Components

### Example 1: Client-Side Data Fetching

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'

export function LeadsCounter() {
  const { getToken } = useAuth()
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCount() {
      const token = await getToken({ template: 'supabase' })
      
      if (!token) return

      const supabase = createClerkSupabaseClient(
        token,
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })

      setCount(count || 0)
      setLoading(false)
    }

    fetchCount()
  }, [getToken])

  if (loading) return <div>Loading...</div>

  return <div>You have {count} leads</div>
}
```

### Example 2: Real-Time Updates

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'

export function LeadsRealtimeList() {
  const { getToken } = useAuth()
  const [leads, setLeads] = useState<any[]>([])

  useEffect(() => {
    let subscription: any

    async function setupSubscription() {
      const token = await getToken({ template: 'supabase' })
      
      if (!token) return

      const supabase = createClerkSupabaseClient(
        token,
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Initial fetch
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      setLeads(data || [])

      // Setup real-time subscription
      subscription = supabase
        .channel('leads-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'leads' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setLeads(prev => [payload.new, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              setLeads(prev => prev.map(lead => 
                lead.id === payload.new.id ? payload.new : lead
              ))
            } else if (payload.eventType === 'DELETE') {
              setLeads(prev => prev.filter(lead => lead.id !== payload.old.id))
            }
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [getToken])

  return (
    <div>
      {leads.map(lead => (
        <div key={lead.id}>{lead.nom} {lead.prenom}</div>
      ))}
    </div>
  )
}
```

## API Routes

### Example 1: Create Lead

```typescript
// app/api/leads/route.ts
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'

export async function POST(req: Request) {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClerkSupabaseClient(
    token,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const body = await req.json()

    const { data, error } = await supabase
      .from('leads')
      .insert({
        nom: body.nom,
        prenom: body.prenom,
        email: body.email,
        telephone: body.telephone,
        statut: 'nouveau',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Example 2: Admin-Only Endpoint

```typescript
// app/api/admin/users/route.ts
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { createClerkSupabaseClient, hasRole } from '@/lib/utils/clerk-supabase-helpers'

export async function GET(req: Request) {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClerkSupabaseClient(
    token,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check admin role
  const isAdmin = await hasRole(supabase, 'admin')

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: users, error } = await supabase
    .from('users_profile')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(users)
}
```

## Server Actions

### Example 1: Update Lead

```typescript
// app/actions/leads.ts
'use server'

import { auth } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/lib/utils/clerk-supabase-helpers'
import { revalidatePath } from 'next/cache'

export async function updateLeadStatus(leadId: string, status: string) {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })

  if (!token) {
    throw new Error('Not authenticated')
  }

  const supabase = createClerkSupabaseClient(
    token,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('leads')
    .update({ statut: status })
    .eq('id', leadId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/leads')
  return { success: true }
}
```

### Example 2: Create Note

```typescript
// app/actions/notes.ts
'use server'

import { auth, currentUser } from '@clerk/nextjs'
import { createClerkSupabaseClient, getCurrentUserProfile } from '@/lib/utils/clerk-supabase-helpers'
import { revalidatePath } from 'next/cache'

export async function createNote(leadId: string, content: string) {
  const user = await currentUser()
  
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })

  const supabase = createClerkSupabaseClient(
    token!,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get user profile to get the database ID
  const profile = await getCurrentUserProfile(supabase)

  if (!profile) {
    throw new Error('User profile not found')
  }

  const { error } = await supabase
    .from('notes')
    .insert({
      lead_id: leadId,
      auteur_id: profile.id,
      contenu: content,
    })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/leads/${leadId}`)
  return { success: true }
}
```

## Middleware

### Example: Protect Routes

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up'],
  ignoredRoutes: ['/api/webhooks/clerk'],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

## Testing SQL Functions

You can test the SQL functions directly in the Supabase SQL Editor:

```sql
-- Test get_clerk_user_id (with active JWT)
SELECT get_clerk_user_id();

-- Test is_clerk_authenticated
SELECT is_clerk_authenticated();

-- Test get_current_user_profile
SELECT * FROM get_current_user_profile();

-- Test current_user_has_role
SELECT current_user_has_role('admin');

-- Test current_user_has_any_role
SELECT current_user_has_any_role(ARRAY['admin', 'manager']);
```

## Common Patterns

### Pattern 1: Conditional Role-Based Rendering

```typescript
import { hasAnyRole } from '@/lib/utils/clerk-supabase-helpers'

export async function DashboardLayout({ children }) {
  const { getToken } = auth()
  const token = await getToken({ template: 'supabase' })
  const supabase = createClerkSupabaseClient(token!, url, key)
  
  const canManage = await hasAnyRole(supabase, ['admin', 'manager'])

  return (
    <div>
      {canManage && <AdminSidebar />}
      {children}
    </div>
  )
}
```

### Pattern 2: Optimistic Updates

```typescript
'use client'

import { useAuth } from '@clerk/nextjs'
import { useState, useTransition } from 'react'
import { updateLeadStatus } from '@/app/actions/leads'

export function LeadStatusButton({ lead }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState(lead.statut)

  const handleStatusChange = (newStatus: string) => {
    setOptimisticStatus(newStatus)
    startTransition(async () => {
      try {
        await updateLeadStatus(lead.id, newStatus)
      } catch (error) {
        setOptimisticStatus(lead.statut)
      }
    })
  }

  return (
    <button
      onClick={() => handleStatusChange('en_cours')}
      disabled={isPending}
    >
      Status: {optimisticStatus}
    </button>
  )
}
```
