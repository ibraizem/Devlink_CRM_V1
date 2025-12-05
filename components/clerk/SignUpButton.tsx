'use client'

import { SignUpButton as ClerkSignUpButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { clerkRoutes } from '@/lib/clerk/config'

interface SignUpButtonProps {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function SignUpButton({ 
  children = "S'inscrire", 
  className,
  variant = 'default',
  size = 'default'
}: SignUpButtonProps) {
  return (
    <ClerkSignUpButton 
      mode="redirect"
      redirectUrl={clerkRoutes.afterSignUpUrl}
      signUpFallbackRedirectUrl={clerkRoutes.afterSignUpUrl}
    >
      <Button variant={variant} size={size} className={className}>
        {children}
      </Button>
    </ClerkSignUpButton>
  )
}
