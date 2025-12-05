# Clerk UI Components

Pre-built, styled React components for Clerk authentication.

## Components

### SignInButton

A styled button that redirects to the sign-in page.

```typescript
import { SignInButton } from '@/components/clerk'

<SignInButton />
<SignInButton variant="outline" size="sm">Log In</SignInButton>
```

**Props:**
- `children` - Button text (default: "Se connecter")
- `className` - Additional CSS classes
- `variant` - Button variant: default, outline, ghost, link, destructive, secondary
- `size` - Button size: default, sm, lg, icon

### SignUpButton

A styled button that redirects to the sign-up page.

```typescript
import { SignUpButton } from '@/components/clerk'

<SignUpButton />
<SignUpButton variant="default" size="lg">Create Account</SignUpButton>
```

**Props:**
- `children` - Button text (default: "S'inscrire")
- `className` - Additional CSS classes
- `variant` - Button variant
- `size` - Button size

### UserButton

Displays user avatar with dropdown menu for account management.

```typescript
import { UserButton } from '@/components/clerk'

<UserButton />
<UserButton afterSignOutUrl="/" showName={true} />
```

**Props:**
- `afterSignOutUrl` - Redirect URL after sign out (default: "/")
- `showName` - Show user name next to avatar (default: false)

### SignOutButton

A styled sign-out button with optional icon.

```typescript
import { SignOutButton } from '@/components/clerk'

<SignOutButton />
<SignOutButton variant="destructive" showIcon={false}>
  Log Out
</SignOutButton>
```

**Props:**
- `children` - Button text (default: "Se déconnecter")
- `className` - Additional CSS classes
- `variant` - Button variant
- `size` - Button size
- `showIcon` - Show logout icon (default: true)

### ProtectedRoute

Client-side wrapper that ensures content is only visible to authenticated users.

```typescript
import { ProtectedRoute } from '@/components/clerk'

<ProtectedRoute>
  <div>This content is protected</div>
</ProtectedRoute>

<ProtectedRoute 
  redirectTo="/custom-login"
  loadingComponent={<Spinner />}
>
  <div>Protected content</div>
</ProtectedRoute>
```

**Props:**
- `children` - Content to protect
- `redirectTo` - Redirect URL if not authenticated (default: "/auth/login")
- `loadingComponent` - Component to show while loading (default: "Chargement...")

## Usage Examples

### Navigation Bar

```typescript
'use client'

import { useAuthUser } from '@/lib/clerk'
import { SignInButton, SignUpButton, UserButton } from '@/components/clerk'

export function Navigation() {
  const { isSignedIn, isLoaded } = useAuthUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <nav className="flex items-center gap-4">
      <div className="flex-1">Logo</div>
      
      {isSignedIn ? (
        <UserButton afterSignOutUrl="/" />
      ) : (
        <>
          <SignInButton variant="ghost" />
          <SignUpButton />
        </>
      )}
    </nav>
  )
}
```

### User Menu

```typescript
'use client'

import { useAuthUser } from '@/lib/clerk'
import { UserButton, SignOutButton } from '@/components/clerk'
import { DropdownMenu } from '@/components/ui/dropdown-menu'

export function UserMenu() {
  const { fullName, email } = useAuthUser()

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="font-medium">{fullName}</p>
        <p className="text-sm text-gray-600">{email}</p>
      </div>
      <UserButton showName={false} />
    </div>
  )
}
```

### Protected Dashboard

```typescript
'use client'

import { ProtectedRoute } from '@/components/clerk'
import { useAuthUser } from '@/lib/clerk'

export function Dashboard() {
  const { fullName } = useAuthUser()

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1>Welcome back, {fullName}!</h1>
        <p>This is your protected dashboard</p>
      </div>
    </ProtectedRoute>
  )
}
```

### Landing Page CTA

```typescript
import { SignUpButton } from '@/components/clerk'

export function Hero() {
  return (
    <section>
      <h1>Welcome to DevLink CRM</h1>
      <p>Start managing your leads today</p>
      <SignUpButton size="lg">
        Get Started Free
      </SignUpButton>
    </section>
  )
}
```

## Styling

All components use the shadcn/ui Button component for consistent styling. They automatically inherit your Tailwind theme and follow the design system.

### Customizing Appearance

You can customize the appearance by:

1. **Passing className prop:**
```typescript
<SignInButton className="my-custom-class" />
```

2. **Using variant and size props:**
```typescript
<SignUpButton variant="outline" size="lg" />
```

3. **Updating global config** in `lib/clerk/config.ts`

## Best Practices

1. **Use in Client Components** - All these components are client-side only
2. **Loading States** - Always handle `isLoaded` state from hooks
3. **Redirects** - Configure redirects in environment variables
4. **Accessibility** - Components follow WCAG guidelines
5. **Mobile** - All components are mobile-responsive

## Common Patterns

### Conditional Navigation

```typescript
{isSignedIn ? (
  <UserButton />
) : (
  <div className="flex gap-2">
    <SignInButton />
    <SignUpButton />
  </div>
)}
```

### Protected Content

```typescript
<ProtectedRoute>
  <ExpensiveComponent />
</ProtectedRoute>
```

### Custom Loading State

```typescript
<ProtectedRoute
  loadingComponent={
    <div className="flex items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  }
>
  <Content />
</ProtectedRoute>
```

## TypeScript Support

All components are fully typed. Import types from `@/lib/clerk/types`:

```typescript
import type { ClerkUserState } from '@/lib/clerk/types'
```

## Testing

Test components with Mock Clerk:

```typescript
import { ClerkProvider } from '@clerk/nextjs'

const mockUser = {
  id: 'user_123',
  firstName: 'Test',
  // ...
}

<ClerkProvider>
  <YourComponent />
</ClerkProvider>
```

## Support

For issues with these components:
- Check component props match expected types
- Review browser console for errors
- Verify Clerk is properly configured
- Check `lib/clerk/config.ts` settings

## Related

- Server utilities: `lib/clerk/auth.ts`
- Client hooks: `lib/clerk/hooks.ts`
- Configuration: `lib/clerk/config.ts`
- Examples: `lib/clerk/examples.tsx`
