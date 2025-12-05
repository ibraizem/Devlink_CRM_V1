import { SignUp } from '@clerk/nextjs'
import { clerkConfig } from '@/lib/clerk/config'

export default function ClerkRegisterPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <SignUp 
        appearance={clerkConfig.appearance}
        routing="path"
        path="/auth/clerk-register"
        signInUrl="/auth/clerk-login"
      />
    </div>
  )
}
