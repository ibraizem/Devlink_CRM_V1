// types/file.types.ts
export interface FileData {
  id: string;
  name: string; // Alias pour 'nom' dans fichiers_import
  nom: string; // Champ réel dans la base de données
  path: string; // Alias pour 'chemin' dans fichiers_import
  chemin: string; // Champ réel dans la base de données
  size: number; // Alias pour 'taille' dans fichiers_import
  taille: number; // Champ réel dans la base de données
  mime_type: string; // Correspond au champ 'mime_type' dans fichiers_import
  status: 'pending' | 'processing' | 'completed' | 'error'; // Correspond au champ 'statut' dans fichiers_import
  user_id: string; // Correspond au champ 'user_id' dans fichiers_import
  created_at: string;
  updated_at: string;
  donnees?: Record<string, any>[]; // Correspond au champ 'donnees' dans fichiers_import (JSONB)
  metadata?: Record<string, any>; // Correspond au champ 'metadata' dans fichiers_import (JSONB)
  // Champs supplémentaires du schéma
  original_filename?: string | null;
  type?: string | null;
  date_import?: string;
  nb_lignes?: number;
  nb_lignes_importees?: number;
  mapping_colonnes?: Record<string, any>;
  separateur?: string;
}

export interface FileImportResult {
  success: boolean;
  fileId?: string;
  error?: string;
  headers?: string[];
  rowCount?: number;
}

export interface ColumnMapping {
  [key: string]: string; // { [columnName]: fieldName }
}

export interface FileUploadOptions {
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
  userId: string;
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  headers?: string[];
}