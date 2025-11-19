import { supabase } from '@/lib/supabase/client';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signUp(email: string, password: string, nom: string, prenom: string, role: 'admin' | 'manager' | 'commercial' = 'admin') {
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
  await supabase.auth.signOut();
  return { error: null };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}
