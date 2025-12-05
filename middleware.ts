import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/login(.*)',
  '/auth/register(.*)',
  '/auth/forgot-password(.*)',
  '/auth/update-password(.*)',
  '/auth/clerk-login(.*)',
  '/auth/clerk-register(.*)',
  '/api/webhooks(.*)',
])

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
