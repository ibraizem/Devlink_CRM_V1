import { DatabaseFichierImport } from './database';

export interface FichierImport extends Omit<DatabaseFichierImport, 'metadata'> {
  metadata?: {
    fileType?: string;
    originalName?: string;
    uploadedAt?: string;
    rowCount?: number;
    fileSize?: number;
    mimeType?: string;
    // Métadonnées d'importation multicanal
    totalLeads?: number;
    qualityScore?: number;
    validLeads?: number;
    detectedChannels?: string[];
    categoryDistribution?: Record<string, number>;
    importStatus?: 'success' | 'partial' | 'error';
    importMessage?: string;
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
