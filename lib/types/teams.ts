export interface TeamMember {
  id: any;
  user: {
    id: string;
    nom: string | null;
    prenom: string | null;
    email: string;
  };
  role?: string;
  joined_at?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  leader_id: string | null;
  leader?: {
    id: string;
    nom: string | null;
    prenom: string | null;
    email: string;
    avatar_url?: string | null;
  } | null;
  members?: TeamMember[];
  campaigns?: TeamCampaign[];
  members_count?: number;
  campaigns_count?: number;
}

export interface TeamCampaign {
  id: string;
  team_id: string;
  campaign_id: string;
  assigned_at: string;
  assigned_by: string;
  campaign: {
    id: string;
    name: string;
    description: string | null;
  };
}

// Types pour les formulaires
export interface CreateTeamFormData {
  name: string;
  description?: string | null;
  leader_id?: string | null;
  members?: string[];
}

export interface UpdateTeamFormData extends Partial<CreateTeamFormData> {
  id: string;
}

// Types pour les réponses d'API
export interface TeamResponse extends Team {
  members_count?: number;
  campaigns_count?: number;
}

// Types pour les filtres et le tri
export interface TeamFilters {
  search?: string;
  leader_id?: string;
  has_campaign?: boolean;
}

export interface TeamSortOptions {
  field: keyof Team;
  direction: 'asc' | 'desc';
}
