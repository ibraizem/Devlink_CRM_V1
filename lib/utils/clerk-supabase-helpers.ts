/**
 * Clerk + Supabase Integration Helpers
 * 
 * This file provides TypeScript utilities for working with Clerk authentication
 * in a Supabase database context.
 */

import { createClient } from '@supabase/supabase-js'
import type { User } from '@clerk/nextjs/server'

/**
 * User profile type matching the database schema
 */
export interface UserProfile {
  id: string
  clerk_user_id: string | null
  nom: string
  prenom: string
  role: 'admin' | 'manager' | 'telepro'
  actif: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

/**
 * Create a Supabase client with Clerk JWT
 * 
 * @param clerkToken - JWT token from Clerk (use auth().getToken())
 * @param supabaseUrl - Supabase project URL
 * @param supabaseAnonKey - Supabase anon/public key
 * @returns Supabase client configured with Clerk auth
 * 
 * @example
 * ```typescript
 * import { auth } from '@clerk/nextjs'
 * 
 * const token = await auth().getToken({ template: 'supabase' })
 * const supabase = createClerkSupabaseClient(
 *   token,
 *   process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 * )
 * ```
 */
export function createClerkSupabaseClient(
  clerkToken: string | null,
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: clerkToken
        ? {
            Authorization: `Bearer ${clerkToken}`,
          }
        : {},
    },
  })
}

/**
 * Get or create user profile from Clerk user data
 * 
 * @param supabaseClient - Supabase client (with service role key for admin operations)
 * @param clerkUser - Clerk user object
 * @returns User profile from database
 * 
 * @example
 * ```typescript
 * import { currentUser } from '@clerk/nextjs'
 * import { createClient } from '@supabase/supabase-js'
 * 
 * const user = await currentUser()
 * const supabase = createClient(url, serviceRoleKey)
 * const profile = await syncClerkUserToSupabase(supabase, user)
 * ```
 */
export async function syncClerkUserToSupabase(
  supabaseClient: ReturnType<typeof createClient>,
  clerkUser: User
): Promise<{ data: UserProfile | null; error: any }> {
  try {
    const userData = {
      nom: clerkUser.lastName || 'User',
      prenom: clerkUser.firstName || '',
      email: clerkUser.emailAddresses[0]?.emailAddress,
      avatar_url: clerkUser.imageUrl,
      role: (clerkUser.publicMetadata?.role as string) || 
            (clerkUser.unsafeMetadata?.role as string) || 
            'telepro',
    }

    const { data, error } = await supabaseClient.rpc('sync_clerk_user', {
      p_clerk_user_id: clerkUser.id,
      p_user_data: userData,
    })

    if (error) {
      console.error('Error syncing Clerk user:', error)
      return { data: null, error }
    }

    // Fetch the complete profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('users_profile')
      .select('*')
      .eq('clerk_user_id', clerkUser.id)
      .single()

    if (profileError) {
      return { data: null, error: profileError }
    }

    return { data: profile, error: null }
  } catch (error) {
    console.error('Exception syncing Clerk user:', error)
    return { data: null, error }
  }
}

/**
 * Get current user profile using Clerk authentication
 * 
 * @param supabaseClient - Supabase client with Clerk JWT
 * @returns Current user profile or null
 * 
 * @example
 * ```typescript
 * const profile = await getCurrentUserProfile(supabase)
 * if (profile) {
 *   console.log(`Welcome, ${profile.prenom} ${profile.nom}`)
 * }
 * ```
 */
export async function getCurrentUserProfile(
  supabaseClient: ReturnType<typeof createClient>
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabaseClient.rpc('get_current_user_profile')

    if (error) {
      console.error('Error fetching current user profile:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Exception fetching current user profile:', error)
    return null
  }
}

/**
 * Check if current user has a specific role
 * 
 * @param supabaseClient - Supabase client with Clerk JWT
 * @param role - Role to check ('admin', 'manager', 'telepro')
 * @returns True if user has the role
 * 
 * @example
 * ```typescript
 * if (await hasRole(supabase, 'admin')) {
 *   // Show admin features
 * }
 * ```
 */
export async function hasRole(
  supabaseClient: ReturnType<typeof createClient>,
  role: 'admin' | 'manager' | 'telepro'
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc('current_user_has_role', {
      required_role: role,
    })

    if (error) {
      console.error('Error checking user role:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Exception checking user role:', error)
    return false
  }
}

/**
 * Check if current user has any of the specified roles
 * 
 * @param supabaseClient - Supabase client with Clerk JWT
 * @param roles - Array of roles to check
 * @returns True if user has any of the roles
 * 
 * @example
 * ```typescript
 * if (await hasAnyRole(supabase, ['admin', 'manager'])) {
 *   // Show management features
 * }
 * ```
 */
export async function hasAnyRole(
  supabaseClient: ReturnType<typeof createClient>,
  roles: Array<'admin' | 'manager' | 'telepro'>
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc('current_user_has_any_role', {
      required_roles: roles,
    })

    if (error) {
      console.error('Error checking user roles:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Exception checking user roles:', error)
    return false
  }
}

/**
 * Map existing Supabase Auth user to Clerk user
 * This is used during migration from Supabase Auth to Clerk
 * 
 * @param supabaseClient - Supabase client with service role key
 * @param supabaseUserId - Existing Supabase Auth user ID
 * @param clerkUserId - New Clerk user ID
 * @returns Result of mapping operation
 * 
 * @example
 * ```typescript
 * const result = await mapUserToClerk(
 *   supabase,
 *   'existing-uuid',
 *   'user_2xxxxxxxxxxxxx'
 * )
 * if (result.success) {
 *   console.log('User mapped successfully')
 * }
 * ```
 */
export async function mapUserToClerk(
  supabaseClient: ReturnType<typeof createClient>,
  supabaseUserId: string,
  clerkUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabaseClient.rpc('map_user_to_clerk', {
      p_supabase_user_id: supabaseUserId,
      p_clerk_user_id: clerkUserId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return data
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Bulk map multiple users from Supabase Auth to Clerk
 * 
 * @param supabaseClient - Supabase client with service role key
 * @param mappings - Array of user mappings
 * @returns Results of bulk mapping operation
 * 
 * @example
 * ```typescript
 * const result = await bulkMapUsersToClerk(supabase, [
 *   { supabase_user_id: 'uuid-1', clerk_user_id: 'user_2xxx1' },
 *   { supabase_user_id: 'uuid-2', clerk_user_id: 'user_2xxx2' },
 * ])
 * console.log(`Mapped ${result.mapped} users, ${result.errors} errors`)
 * ```
 */
export async function bulkMapUsersToClerk(
  supabaseClient: ReturnType<typeof createClient>,
  mappings: Array<{ supabase_user_id: string; clerk_user_id: string }>
): Promise<{ success: boolean; total: number; mapped: number; errors: number; results: any[] }> {
  try {
    const { data, error } = await supabaseClient.rpc('bulk_map_users_to_clerk', {
      p_mappings: mappings,
    })

    if (error) {
      throw error
    }

    return data
  } catch (error: any) {
    return {
      success: false,
      total: mappings.length,
      mapped: 0,
      errors: mappings.length,
      results: [],
    }
  }
}

/**
 * Handle Clerk webhook event
 * This should be called from your webhook endpoint
 * 
 * @param supabaseClient - Supabase client with service role key
 * @param eventType - Clerk event type
 * @param userData - User data from Clerk webhook
 * @returns Result of webhook processing
 * 
 * @example
 * ```typescript
 * // In your webhook endpoint (e.g., app/api/webhooks/clerk/route.ts)
 * const result = await handleClerkWebhook(
 *   supabase,
 *   'user.created',
 *   req.body.data
 * )
 * ```
 */
export async function handleClerkWebhook(
  supabaseClient: ReturnType<typeof createClient>,
  eventType: 'user.created' | 'user.updated' | 'user.deleted',
  userData: any
): Promise<{ success: boolean; action?: string; error?: string }> {
  try {
    const { data, error } = await supabaseClient.rpc('handle_clerk_webhook', {
      p_event_type: eventType,
      p_user_data: userData,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return data
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
