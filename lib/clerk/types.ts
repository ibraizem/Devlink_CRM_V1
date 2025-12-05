import type { User } from '@clerk/nextjs/server'

export interface ClerkUserMetadata {
  id: string
  email?: string
  firstName?: string | null
  lastName?: string | null
  fullName: string
  imageUrl?: string
  publicMetadata: Record<string, any>
  privateMetadata: Record<string, any>
}

export interface ClerkAuthState {
  isLoaded: boolean
  isSignedIn: boolean | undefined
  userId: string | null | undefined
  sessionId: string | null | undefined
}

export interface ClerkUserState extends ClerkAuthState {
  user: User | null | undefined
  email?: string
  firstName?: string | null
  lastName?: string | null
  fullName: string
  imageUrl?: string
}

export interface ClerkAppearanceConfig {
  layout?: {
    socialButtonsPlacement?: 'top' | 'bottom'
    socialButtonsVariant?: 'iconButton' | 'blockButton'
  }
  variables?: {
    colorPrimary?: string
    colorBackground?: string
    colorText?: string
    colorTextOnPrimaryBackground?: string
    colorInputBackground?: string
    colorInputText?: string
    borderRadius?: string
    fontFamily?: string
  }
  elements?: Record<string, string>
}

export interface ClerkRouteConfig {
  signInUrl: string
  signUpUrl: string
  afterSignInUrl: string
  afterSignUpUrl: string
}
