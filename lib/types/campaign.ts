export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

import { DatabaseCampaign, DatabaseCampaignFile, DatabaseCampaignFileLink } from './database';

export interface Campaign extends DatabaseCampaign {
  files?: CampaignFile[] | null;
}

export interface CampaignFile extends DatabaseCampaignFile {
}

export interface CampaignFileLink extends DatabaseCampaignFileLink {
}

export interface TeamCampaign {
  id: string;
  team_id: string;
  campaign_id: string;
  created_at: string;
  updated_at: string;
  assigned_at: string;
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  status?: string; // Changé de CampaignStatus à string pour correspondre au schéma
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
  target_audience?: Record<string, any> | null;
  team_id?: string | null;
  channels?: string[];
  associated_file_id?: string | null;
  file_name?: string | null;
  files?: CampaignFile[] | null;
  organization?: string | null; // Nouveau champ du schéma
}

export interface UpdateCampaignData extends Partial<CreateCampaignData> {
  id: string;
  total_leads?: number;
  converted_leads?: number;
  progress?: number;
}

export interface CampaignFilters {
  search?: string;
  status?: CampaignStatus;
  team_id?: string;
  start_date_from?: string;
  start_date_to?: string;
}

export interface CampaignSortOptions {
  field: keyof Campaign;
  direction: 'asc' | 'desc';
}
