import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/auth/login')
  }
  
  return userId
}

export async function getAuthUser() {
  const user = await currentUser()
  return user
}

export async function getAuthUserId() {
  const { userId } = auth()
  return userId
}

export async function isAuthenticated() {
  const { userId } = auth()
  return !!userId
}

export async function getUserMetadata() {
  const user = await currentUser()
  
  if (!user) return null
  
  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    imageUrl: user.imageUrl,
    publicMetadata: user.publicMetadata,
    privateMetadata: user.privateMetadata,
  }
}
