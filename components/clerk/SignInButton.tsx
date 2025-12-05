'use client'

import { SignInButton as ClerkSignInButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { clerkRoutes } from '@/lib/clerk/config'

interface SignInButtonProps {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function SignInButton({ 
  children = 'Se connecter', 
  className,
  variant = 'default',
  size = 'default'
}: SignInButtonProps) {
  return (
    <ClerkSignInButton 
      mode="redirect"
      redirectUrl={clerkRoutes.afterSignInUrl}
      signInFallbackRedirectUrl={clerkRoutes.afterSignInUrl}
    >
      <Button variant={variant} size={size} className={className}>
        {children}
      </Button>
    </ClerkSignInButton>
  )
}
