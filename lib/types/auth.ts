import { createClient } from '@/lib/utils/supabase/client';

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(email: string, password: string, nom: string, prenom: string, role: 'admin' | 'manager' | 'telepro' = 'telepro') {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (data.user && !error) {
    const { error: profileError } = await supabase
      .from('users_profile')
      .insert({
        id: data.user.id,
        nom,
        prenom,
        role,
        actif: true,
      });

    if (profileError) {
      return { data: null, error: profileError };
    }
  }

  return { data, error };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return { data, error };
}
