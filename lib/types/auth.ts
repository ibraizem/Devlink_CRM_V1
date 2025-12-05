import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/utils/supabase/client';

export async function signIn(email: string, password: string) {
  throw new Error('signIn is now handled by Clerk. Use Clerk\'s sign-in flow.');
}

export async function signUp(email: string, password: string, nom: string, prenom: string, role: 'admin' | 'manager' | 'telepro' = 'telepro') {
  throw new Error('signUp is now handled by Clerk. Use Clerk\'s sign-up flow and create profile in webhook.');
}

export async function signOut() {
  throw new Error('signOut is now handled by Clerk. Use useClerk().signOut().');
}

export async function getCurrentUser() {
  const user = await currentUser();
  return user;
}

export async function getUserProfile(clerkUserId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users_profile')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  return { data, error };
}
