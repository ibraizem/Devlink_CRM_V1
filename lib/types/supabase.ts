// Types pour l'utilisateur authentifié
export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

// Extension des types pour Supabase
declare module '@supabase/supabase-js' {
  interface User extends AuthUser {}
  
  interface Session {
    user: User;
  }
}
