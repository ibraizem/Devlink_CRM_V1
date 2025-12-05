# Clerk Quick Start Guide

Get Clerk authentication up and running in 5 minutes.

## Step 1: Install Dependencies

```bash
yarn install
```

## Step 2: Get Clerk Keys

1. Visit [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
2. Sign up or log in
3. Create a new application
4. Go to **API Keys** in the sidebar
5. Copy your keys

## Step 3: Configure Environment

Update `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

## Step 4: Start Development Server

```bash
yarn dev
```

## Step 5: Test Authentication

Visit these URLs:

- **Sign In**: [http://localhost:3000/auth/clerk-login](http://localhost:3000/auth/clerk-login)
- **Sign Up**: [http://localhost:3000/auth/clerk-register](http://localhost:3000/auth/clerk-register)
- **Profile**: [http://localhost:3000/auth/profile](http://localhost:3000/auth/profile) (after login)

## What's Configured?

✅ ClerkProvider in `app/layout.tsx`  
✅ Middleware protection in `middleware.ts`  
✅ French localization  
✅ Custom appearance matching your design  
✅ Server and client utilities  
✅ Pre-built components  
✅ Webhook endpoint  

## Protected Routes

All routes are automatically protected except:
- `/` (home)
- `/auth/*` (auth pages)
- `/api/webhooks/*` (webhooks)

## Usage Examples

### In Server Components

```typescript
import { requireAuth, getUserMetadata } from '@/lib/clerk'

export default async function Page() {
  await requireAuth() // Redirects if not logged in
  const metadata = await getUserMetadata()
  
  return <div>Hello {metadata?.fullName}</div>
}
```

### In Client Components

```typescript
'use client'
import { useAuthUser } from '@/lib/clerk'

export default function Component() {
  const { user, fullName, email } = useAuthUser()
  return <div>{fullName} - {email}</div>
}
```

### UI Components

```typescript
import { SignInButton, UserButton } from '@/components/clerk'

export default function Nav() {
  return (
    <nav>
      <SignInButton />
      <UserButton />
    </nav>
  )
}
```

## Next Steps

1. **Enable Social Login**: Go to Clerk Dashboard > Social Connections
2. **Customize Appearance**: Edit `lib/clerk/config.ts`
3. **Set Up Webhooks**: See `CLERK_SETUP.md` for details
4. **Add User Metadata**: Configure in Clerk Dashboard

## Need Help?

- Full documentation: `CLERK_SETUP.md`
- Clerk docs: [https://clerk.com/docs](https://clerk.com/docs)
- Issues? Check browser console and Clerk Dashboard logs

## Migration Notes

If you're migrating from Supabase Auth:
- Both systems can run in parallel
- Use `/auth/clerk-*` routes for Clerk
- Use `/auth/login` and `/auth/register` for Supabase
- See `CLERK_SETUP.md` for migration strategy
