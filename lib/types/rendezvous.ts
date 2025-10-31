export type RendezvousStatus = 
  | 'planifie' 
  | 'confirme' 
  | 'annule' 
  | 'rdv_ok' 
  | 'rdv_ko' 
  | 'a_replanifier' 
  | 'en_attente_document' 
  | 'artisan_recrute' 
  | 'recrutement_annule';

export type RendezvousSousStatut = 
  | 'prospect_absent' 
  | 'manager_absent' 
  | null;

export interface Rendezvous {
  id: string;
  lead_id: string;
  agent_id: string;
  date_heure: string;
  duree_minutes: number;
  canal: string;
  notes?: string;
  statut: RendezvousStatus;
  sous_statut?: RendezvousSousStatut;
  created_at: string;
  updated_at: string;
  leads?: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
  };
  users_profile?: {
    nom: string;
    prenom: string;
  };
}
