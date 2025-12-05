import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};

export async function getUserProfileId() {
  const { userId } = await auth();
  if (!userId) return null;
  
  const supabase = createClient(await cookies());
  const { data } = await supabase
    .from('users_profile')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle();
  
  return data?.id || null;
}
