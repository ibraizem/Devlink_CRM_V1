# Clerk Authentication Setup Guide

This guide explains how to set up and use Clerk authentication in the DevLink CRM application.

## Installation

The Clerk SDK has been added to `package.json`. Install dependencies:

```bash
yarn install
```

## Environment Configuration

### 1. Get Your Clerk Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select an existing one
3. Navigate to "API Keys" in the sidebar
4. Copy your Publishable Key and Secret Key

### 2. Configure Environment Variables

Update `.env.local` with your Clerk keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/clerk-login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/clerk-register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Architecture

### Provider Setup

Clerk is configured in `app/layout.tsx`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'
import { frFR } from '@clerk/localizations'
import { clerkConfig } from '@/lib/clerk/config'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider 
      localization={frFR}
      appearance={clerkConfig.appearance}
    >
      {children}
    </ClerkProvider>
  )
}
```

### Middleware Protection

The `middleware.ts` file at the root protects routes:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/login(.*)',
  '/auth/register(.*)',
  '/auth/forgot-password(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})
```

## Available Pages

### Clerk Built-in Pages

1. **Sign In**: `/auth/clerk-login`
   - Full-featured login with social providers
   - Password reset
   - Email verification

2. **Sign Up**: `/auth/clerk-register`
   - User registration
   - Email verification
   - Terms acceptance

3. **User Profile**: `/auth/profile`
   - Profile management
   - Password change
   - Connected accounts
   - Active sessions

### Custom Pages

The existing Supabase pages remain available:
- `/auth/login` - Custom login page
- `/auth/register` - Custom registration page

## Using Clerk Components

### Pre-built Components

```typescript
import { SignInButton, SignUpButton, UserButton } from '@/components/clerk'

export default function Navigation() {
  return (
    <nav>
      <SignInButton />
      <SignUpButton />
      <UserButton />
    </nav>
  )
}
```

### Server-Side Authentication

```typescript
import { requireAuth, getAuthUser, getUserMetadata } from '@/lib/clerk'

export default async function ProtectedPage() {
  // Require authentication (redirects if not logged in)
  const userId = await requireAuth()
  
  // Get user details
  const user = await getAuthUser()
  const metadata = await getUserMetadata()
  
  return (
    <div>
      <h1>Welcome {metadata?.fullName}</h1>
      <p>Email: {metadata?.email}</p>
    </div>
  )
}
```

### Client-Side Authentication

```typescript
'use client'

import { useAuthUser, useAuthSession, useSignOut } from '@/lib/clerk'

export default function UserDashboard() {
  const { user, isSignedIn, fullName, email } = useAuthUser()
  const { isLoaded, sessionId } = useAuthSession()
  const signOut = useSignOut()
  
  if (!isLoaded) return <div>Loading...</div>
  if (!isSignedIn) return <div>Please sign in</div>
  
  return (
    <div>
      <h1>{fullName}</h1>
      <p>{email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Protected Route Wrapper

```typescript
'use client'

import { ProtectedRoute } from '@/components/clerk'

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is protected</div>
    </ProtectedRoute>
  )
}
```

## Utilities Reference

### Server-Side Functions (`lib/clerk/auth.ts`)

- `requireAuth()` - Ensures user is authenticated, redirects otherwise
- `getAuthUser()` - Returns current user object
- `getAuthUserId()` - Returns current user ID
- `isAuthenticated()` - Returns boolean authentication status
- `getUserMetadata()` - Returns formatted user metadata

### Client-Side Hooks (`lib/clerk/hooks.ts`)

- `useAuthUser()` - User data and loading state
- `useAuthSession()` - Session information
- `useSignOut()` - Sign out function

### Components (`components/clerk/`)

- `SignInButton` - Styled sign in button
- `SignUpButton` - Styled sign up button
- `UserButton` - User avatar with dropdown menu
- `SignOutButton` - Sign out button with icon
- `ProtectedRoute` - Wrapper for protected content

## Configuration (`lib/clerk/config.ts`)

Customize Clerk appearance:

```typescript
export const clerkConfig = {
  appearance: {
    variables: {
      colorPrimary: '#2563eb',
      borderRadius: '0.5rem',
      // ... more customization
    },
    elements: {
      formButtonPrimary: 'custom-class',
      // ... more element styling
    },
  },
}
```

## Social Providers

To enable social login (Google, Microsoft, GitHub, etc.):

1. Go to Clerk Dashboard > Configure > Social Connections
2. Enable desired providers
3. Configure OAuth credentials
4. The social buttons will automatically appear in sign-in/sign-up forms

## Webhooks

To sync Clerk users with your database:

1. Go to Clerk Dashboard > Configure > Webhooks
2. Create endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Add signing secret to `.env.local`:

```env
CLERK_WEBHOOK_SECRET=whsec_your_secret
```

Create webhook handler at `app/api/webhooks/clerk/route.ts`:

```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  
  const headerPayload = headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')
  
  const body = await req.text()
  
  const wh = new Webhook(WEBHOOK_SECRET)
  const evt = wh.verify(body, {
    'svix-id': svixId,
    'svix-timestamp': svixTimestamp,
    'svix-signature': svixSignature,
  })
  
  // Handle events
  const { type, data } = evt
  
  if (type === 'user.created') {
    // Create user in your database
  }
  
  return new Response('', { status: 200 })
}
```

## Migration from Supabase Auth

To migrate from existing Supabase authentication:

1. Keep both systems running in parallel
2. Use Clerk for new users
3. Gradually migrate existing users
4. Use webhooks to sync user data between systems
5. Update protected routes to check both auth systems during migration

## Troubleshooting

### Middleware Issues

If routes aren't protected:
- Check `middleware.ts` matcher config
- Verify environment variables are set
- Check Next.js console for errors

### Styling Issues

If Clerk components don't match your design:
- Update `lib/clerk/config.ts` appearance settings
- Use Clerk's appearance prop for component-level customization
- Check CSS conflicts with Tailwind

### Session Issues

If users aren't staying logged in:
- Verify domain settings in Clerk Dashboard
- Check cookie settings
- Ensure HTTPS in production

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk GitHub](https://github.com/clerkinc/javascript)
- [Clerk Discord Community](https://clerk.com/discord)

## Support

For issues with Clerk integration:
1. Check the Clerk Dashboard for errors
2. Review browser console logs
3. Check Next.js server logs
4. Consult Clerk documentation
5. Join Clerk Discord for community support
