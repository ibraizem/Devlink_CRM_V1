'use client'

import { useUser, useAuth, useClerk } from '@clerk/nextjs'

export function useAuthUser() {
  const { user, isLoaded, isSignedIn } = useUser()
  
  return {
    user,
    isLoaded,
    isSignedIn,
    userId: user?.id,
    email: user?.emailAddresses[0]?.emailAddress,
    firstName: user?.firstName,
    lastName: user?.lastName,
    fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    imageUrl: user?.imageUrl,
  }
}

export function useAuthSession() {
  const { isLoaded, isSignedIn, userId, sessionId } = useAuth()
  
  return {
    isLoaded,
    isSignedIn,
    userId,
    sessionId,
  }
}

export function useSignOut() {
  const { signOut } = useClerk()
  
  return async () => {
    await signOut()
  }
}
