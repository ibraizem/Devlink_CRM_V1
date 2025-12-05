'use client'

import { UserButton as ClerkUserButton } from '@clerk/nextjs'

interface UserButtonProps {
  afterSignOutUrl?: string
  showName?: boolean
}

export function UserButton({ 
  afterSignOutUrl = '/',
  showName = false 
}: UserButtonProps) {
  return (
    <ClerkUserButton 
      afterSignOutUrl={afterSignOutUrl}
      appearance={{
        elements: {
          avatarBox: 'w-10 h-10',
        },
      }}
      showName={showName}
    />
  )
}
