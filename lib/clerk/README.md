# Clerk Authentication Setup

## Configuration

This directory contains the Clerk authentication configuration and utilities for the CRM application.

### Environment Variables

Add the following environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

Get your keys from [Clerk Dashboard](https://dashboard.clerk.com/).

## Files

### `config.ts`
Contains Clerk appearance configuration and route settings.

### `auth.ts`
Server-side authentication utilities:
- `requireAuth()` - Redirects to login if not authenticated
- `getAuthUser()` - Gets current user (server-side)
- `getAuthUserId()` - Gets current user ID
- `isAuthenticated()` - Checks if user is authenticated
- `getUserMetadata()` - Gets user metadata

### `hooks.ts`
Client-side React hooks:
- `useAuthUser()` - User data and authentication state
- `useAuthSession()` - Session information
- `useSignOut()` - Sign out functionality

## Usage

### Server Components

```typescript
import { requireAuth, getAuthUser } from '@/lib/clerk/auth'

export default async function ProtectedPage() {
  const userId = await requireAuth()
  const user = await getAuthUser()
  
  return <div>Hello {user?.firstName}</div>
}
```

### Client Components

```typescript
'use client'

import { useAuthUser } from '@/lib/clerk/hooks'

export default function UserProfile() {
  const { user, isSignedIn, fullName } = useAuthUser()
  
  if (!isSignedIn) return <div>Not signed in</div>
  
  return <div>Welcome {fullName}</div>
}
```

## Protected Routes

The middleware in `middleware.ts` automatically protects all routes except:
- `/` (landing page)
- `/auth/*` (authentication pages)
- `/api/webhooks/*` (webhooks)

All other routes require authentication.

## Customization

To customize the appearance, edit `config.ts`. The configuration includes:
- Color scheme
- Border radius
- Font family
- Button styles
- Form styles

## Localization

The application uses French localization (`frFR`) by default. This is configured in `app/layout.tsx`.
