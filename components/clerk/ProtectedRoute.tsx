'use client'

import { useAuthSession } from '@/lib/clerk/hooks'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login',
  loadingComponent = <div>Chargement...</div>
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuthSession()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(redirectTo)
    }
  }, [isLoaded, isSignedIn, redirectTo, router])

  if (!isLoaded) {
    return <>{loadingComponent}</>
  }

  if (!isSignedIn) {
    return null
  }

  return <>{children}</>
}
