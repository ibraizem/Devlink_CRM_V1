// Types alignés avec les schémas Supabase pour architecture API-first

// Types pour la table campaigns
export interface DatabaseCampaign {
  id: string;
  name: string;
  description: string | null;
  status: string; // TEXT dans le schéma
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  target_audience: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  team_id: string | null;
  associated_file_id: string | null;
  total_leads: number;
  channels: string[]; // ARRAY
  converted_leads: number;
  progress: number | null;
  file_name: string | null;
  organization: string | null;
}

// Types pour la table campaigns_admin
export interface DatabaseCampaignAdmin {
  id: string;
  campaign_id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

// Types pour la table campaign_files
export interface DatabaseCampaignFile {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  campaign_id: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  file_id: string | null;
}

// Types pour la table campaign_file_links
export interface DatabaseCampaignFileLink {
  id: string;
  campaign_id: string;
  fichier_id: string;
  created_at: string;
}

// Types pour la table fichiers
export interface DatabaseFichier {
  id: string;
  nom: string;
  chemin: string;
  statut: 'actif' | 'inactif' | 'en_cours' | 'erreur';
  date_import: string;
  nb_lignes: number;
  nb_lignes_importees: number;
  mapping_colonnes: Record<string, string>;
  separateur: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  chemin_fichier: any;
  mime_type: string;
  original_filename: string;
  taille: number;
  type: string | null;
  metadata: Record<string, any> | null;
  donnees: Record<string, any> | null;
}

// Types pour la table fichiers_admin
export interface DatabaseFichierAdmin {
  id: string;
  fichier_id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

// Types pour la table fichiers_import
export interface DatabaseFichierImport {
  id: string;
  nom: string;
  chemin: string;
  statut: 'actif' | 'inactif' | 'en_cours' | 'erreur';
  date_import: string;
  nb_lignes: number;
  nb_lignes_importees: number;
  mapping_colonnes: Record<string, string>;
  separateur: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  chemin_fichier: any;
  mime_type: string;
  original_filename: string;
  taille: number;
  type: string | null;
  metadata: Record<string, any> | null;
  donnees: Record<string, any> | null;
  campagne_id?: string | null;
}

// Types pour la table leads
export interface DatabaseLead {
  id: string;
  fichier_id: string;
  donnees: Record<string, any>;
  statut: 'nouveau' | 'en_cours' | 'traite' | 'abandonne';
  notes: string | null;
  created_at: string;
  updated_at: string;
  agent_id: string | null;
}

// Types pour la table lead_actions
export interface DatabaseLeadAction {
  id: string;
  lead_id: string;
  action_type: 'appel' | 'email' | 'sms' | 'rdv' | 'note';
  action_data: Record<string, any> | null;
  created_at: string;
  created_by: string | null;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Types pour les filtres et options
export interface CampaignFilters {
  status?: string;
  created_by?: string;
  team_id?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface LeadFilters {
  statut?: string;
  agent_id?: string;
  fichier_id?: string;
  search?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface FileFilters {
  statut?: 'actif' | 'inactif' | 'en_cours' | 'erreur';
  user_id?: string;
  search?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

// Types pour les statistiques
export interface CampaignStats {
  total_campaigns: number;
  active_campaigns: number;
  total_leads: number;
  conversion_rate: number;
  avg_budget: number;
}

export interface LeadStats {
  total_leads: number;
  by_status: Record<string, number>;
  by_agent: Record<string, number>;
  conversion_rate: number;
  avg_processing_time: number;
}

export interface FileStats {
  total_files: number;
  total_imported_leads: number;
  by_status: Record<string, number>;
  avg_file_size: number;
}
