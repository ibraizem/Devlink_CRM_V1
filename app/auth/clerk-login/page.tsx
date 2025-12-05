import { SignIn } from '@clerk/nextjs'
import { clerkConfig } from '@/lib/clerk/config'

export default function ClerkLoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <SignIn 
        appearance={clerkConfig.appearance}
        routing="path"
        path="/auth/clerk-login"
        signUpUrl="/auth/clerk-register"
      />
    </div>
  )
}
