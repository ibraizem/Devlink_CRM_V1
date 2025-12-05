'use client'

import { useSignOut } from '@/lib/clerk/hooks'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

interface SignOutButtonProps {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
}

export function SignOutButton({ 
  children = 'Se déconnecter', 
  className,
  variant = 'ghost',
  size = 'default',
  showIcon = true
}: SignOutButtonProps) {
  const signOut = useSignOut()

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={signOut}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  )
}
