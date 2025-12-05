export interface ColumnMapping {
  id: string
  nom: string
  description?: string
  mapping: Record<string, ColumnMappingField>
  user_id: string
  created_at: string
  updated_at: string
}

export interface ColumnMappingField {
  source_column: string
  target_column: string
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'boolean'
  required: boolean
  transform?: 'uppercase' | 'lowercase' | 'trim' | 'capitalize'
  default_value?: string
}

export interface ImportHistory {
  id: string
  fichier_id: string
  user_id: string
  statut: 'en_attente' | 'en_cours' | 'termine' | 'erreur' | 'annule'
  nb_lignes_total: number
  nb_lignes_importees: number
  nb_lignes_doublons: number
  nb_lignes_erreurs: number
  mapping_utilise?: Record<string, ColumnMappingField>
  erreurs?: ImportError[]
  peut_rollback: boolean
  rollback_effectue: boolean
  rollback_at?: string
  created_at: string
  updated_at: string
}

export interface ImportError {
  ligne: number
  colonne?: string
  message: string
  donnees?: Record<string, any>
}

export interface StorageFile {
  id: string
  storage_path: string
  bucket_name: string
  nom_fichier: string
  taille?: number
  content_type?: string
  checksum?: string
  est_importe: boolean
  fichier_id?: string
  import_history_id?: string
  derniere_detection: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface DuplicateRecord {
  id: string
  import_history_id: string
  ligne_numero: number
  donnees: Record<string, any>
  raison_doublon: string
  hash_donnees: string
  created_at: string
}

export interface FilePreview {
  columns: string[]
  rows: Record<string, any>[]
  totalRows: number
  suggestedMapping?: Record<string, ColumnMappingField>
}

export interface ImportOptions {
  mapping: Record<string, ColumnMappingField>
  detectDuplicates: boolean
  duplicateFields?: string[]
  skipErrors: boolean
  batchSize?: number
}

export interface ImportProgress {
  total: number
  processed: number
  imported: number
  duplicates: number
  errors: number
  percentage: number
}
