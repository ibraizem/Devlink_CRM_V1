export interface UserProfile {
  id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  avatar_url: string | null;
  role: string;
  actif: boolean;
  telephone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends Omit<UserProfile, 'role'> {
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
  };
  role: string; // Rendre le rôle obligatoire
  last_sign_in_at?: string;
}

export type UserRole = 'admin' | 'manager' | 'commercial';

export interface UpdateUserProfileData {
  nom?: string;
  prenom?: string;
  telephone?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  actif?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  actif?: boolean;
}

export interface UserSortOptions {
  field: keyof UserProfile;
  direction: 'asc' | 'desc';
}
