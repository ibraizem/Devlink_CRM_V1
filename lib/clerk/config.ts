import type { ClerkAppearanceConfig, ClerkRouteConfig } from './types'

export const clerkConfig: { appearance: ClerkAppearanceConfig } = {
  appearance: {
    layout: {
      socialButtonsPlacement: 'bottom',
      socialButtonsVariant: 'iconButton',
    },
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorTextOnPrimaryBackground: '#ffffff',
      colorInputBackground: '#ffffff',
      colorInputText: '#1f2937',
      borderRadius: '0.5rem',
      fontFamily: 'Inter, sans-serif',
    },
    elements: {
      formButtonPrimary:
        'bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors',
      card: 'shadow-lg',
      headerTitle: 'text-2xl font-bold',
      headerSubtitle: 'text-gray-600',
      socialButtonsBlockButton:
        'border border-gray-300 hover:border-gray-400 transition-colors',
      formFieldLabel: 'text-sm font-medium text-gray-700',
      formFieldInput:
        'border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium',
    },
  },
}

export const clerkRoutes: ClerkRouteConfig = {
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/auth/login',
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/auth/register',
  afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/dashboard',
  afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/dashboard',
}
