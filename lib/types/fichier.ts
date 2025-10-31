export interface FichierImport {
  chemin_fichier: any;
  mime_type: string;
  id: string;
  nom: string;
  chemin: string;
  statut: 'actif' | 'inactif' | 'en_cours' | 'erreur';
  date_import: string;
  nb_lignes: number;
  nb_lignes_importees: number;
  mapping_colonnes: Record<string, string>;
  separateur: string;
  original_filename: string;
  taille: number;
  type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    fileType?: string;
    originalName?: string;
    uploadedAt?: string;
    rowCount?: number;
    fileSize?: number;
    mimeType?: string;
    [key: string]: any;
  };
}

export interface ColonneMapping {
  nom_fichier: string;
  nom_colonne: string;
  type_donnee: 'texte' | 'nombre' | 'date' | 'email' | 'telephone';
  colonne_cible: string | null;
  est_obligatoire: boolean;
}

export type StatutImport = 'en_attente' | 'en_cours' | 'termine' | 'erreur';
