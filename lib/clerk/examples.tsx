// This file contains usage examples for Clerk authentication
// Copy and adapt these examples to your components

// ============================================
// SERVER COMPONENT EXAMPLES
// ============================================

// Example 1: Protected page with redirect
import { requireAuth, getUserMetadata } from '@/lib/clerk'

export async function ProtectedPageExample() {
  const userId = await requireAuth()
  const metadata = await getUserMetadata()

  return (
    <div>
      <h1>Welcome {metadata?.fullName}</h1>
      <p>Email: {metadata?.email}</p>
      <p>User ID: {userId}</p>
    </div>
  )
}

// Example 2: Conditional content based on auth
import { isAuthenticated, getAuthUser } from '@/lib/clerk'

export async function ConditionalContentExample() {
  const authenticated = await isAuthenticated()
  const user = await getAuthUser()

  if (!authenticated) {
    return <div>Please sign in to view this content</div>
  }

  return (
    <div>
      <h1>Hello {user?.firstName}</h1>
      <p>This is protected content</p>
    </div>
  )
}

// ============================================
// CLIENT COMPONENT EXAMPLES
// ============================================

// Example 3: User profile display
'use client'

import { useAuthUser } from '@/lib/clerk'

export function UserProfileExample() {
  const { user, isSignedIn, isLoaded, fullName, email, imageUrl } = useAuthUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in</div>
  }

  return (
    <div className="flex items-center gap-4">
      {imageUrl && (
        <img src={imageUrl} alt={fullName} className="w-10 h-10 rounded-full" />
      )}
      <div>
        <p className="font-bold">{fullName}</p>
        <p className="text-sm text-gray-600">{email}</p>
      </div>
    </div>
  )
}

// Example 4: Protected client component
'use client'

import { ProtectedRoute } from '@/components/clerk'

export function ProtectedClientComponentExample() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  )
}

// Example 5: Auth session info
'use client'

import { useAuthSession } from '@/lib/clerk'

export function SessionInfoExample() {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuthSession()

  return (
    <div>
      <p>Loaded: {isLoaded ? 'Yes' : 'No'}</p>
      <p>Signed In: {isSignedIn ? 'Yes' : 'No'}</p>
      <p>User ID: {userId}</p>
      <p>Session ID: {sessionId}</p>
    </div>
  )
}

// Example 6: Sign out button
'use client'

import { useSignOut } from '@/lib/clerk'
import { Button } from '@/components/ui/button'

export function SignOutExample() {
  const signOut = useSignOut()

  return (
    <Button onClick={signOut}>
      Sign Out
    </Button>
  )
}

// ============================================
// NAVIGATION EXAMPLES
// ============================================

// Example 7: Conditional navigation
'use client'

import { useAuthUser } from '@/lib/clerk'
import { SignInButton, SignUpButton, UserButton } from '@/components/clerk'

export function NavigationExample() {
  const { isSignedIn, isLoaded } = useAuthUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <nav className="flex items-center gap-4">
      {isSignedIn ? (
        <UserButton />
      ) : (
        <>
          <SignInButton />
          <SignUpButton />
        </>
      )}
    </nav>
  )
}

// ============================================
// FORM EXAMPLES
// ============================================

// Example 8: Form with auth check
'use client'

import { useAuthUser } from '@/lib/clerk'
import { useState } from 'react'

export function AuthenticatedFormExample() {
  const { isSignedIn, userId } = useAuthUser()
  const [formData, setFormData] = useState({ title: '', content: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isSignedIn) {
      alert('Please sign in to submit')
      return
    }

    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, userId }),
    })

    if (response.ok) {
      alert('Post created!')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Title"
      />
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        placeholder="Content"
      />
      <button type="submit">Submit</button>
    </form>
  )
}

// ============================================
// API ROUTE EXAMPLES
// ============================================

// Example 9: Protected API route
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = auth()

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  return NextResponse.json({ message: 'Protected data', userId })
}

// Example 10: API route with user data
import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const user = await currentUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const body = await request.json()

  return NextResponse.json({
    message: 'Data saved',
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress,
  })
}

// ============================================
// MIDDLEWARE EXAMPLES
// ============================================

// Example 11: Custom middleware logic
import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export default clerkMiddleware((auth, request) => {
  const { userId } = auth()

  if (!userId && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (userId && request.nextUrl.pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
})

// ============================================
// WEBHOOK EXAMPLES
// ============================================

// Example 12: User sync webhook
import { Webhook } from 'svix'
import { headers } from 'next/headers'

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

  if (evt.type === 'user.created') {
    await saveUserToDatabase({
      id: evt.data.id,
      email: evt.data.email_addresses[0]?.email_address,
      firstName: evt.data.first_name,
      lastName: evt.data.last_name,
    })
  }

  return new Response('', { status: 200 })
}

async function saveUserToDatabase(userData: any) {
  // Your database logic here
}
