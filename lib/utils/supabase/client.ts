import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );

export async function getUserProfileIdClient(clerkUserId: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('users_profile')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();
  
  return data?.id || null;
}
