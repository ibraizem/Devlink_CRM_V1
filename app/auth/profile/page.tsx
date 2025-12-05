import { UserProfile } from '@clerk/nextjs'
import { clerkConfig } from '@/lib/clerk/config'

export default function ProfilePage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <UserProfile 
        appearance={clerkConfig.appearance}
        routing="path"
        path="/auth/profile"
      />
    </div>
  )
}
