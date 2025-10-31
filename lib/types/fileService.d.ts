import { FichierImport, CustomColumn } from './index';

type FileUploadOptions = {
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
  user_id: string;
};

type FileFilterOptions = {
  status?: 'actif' | 'inactif' | 'en_cours' | 'erreur' | 'all';
  fileType?: 'spreadsheet' | 'document' | 'image' | 'all';
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
  page?: number;
  pageSize?: number;
};

declare const fileService: {
  // Fichiers
  getFiles: (
    page?: number, 
    pageSize?: number, 
    filters?: FileFilterOptions
  ) => Promise<FichierImport[]>;
  
  uploadFile: (
    file: File, 
    options: FileUploadOptions
  ) => Promise<FichierImport>;
  
  createFileRecord: (
    fileData: Partial<FichierImport> & { user_id: string }
  ) => Promise<FichierImport>;
  
  updateFileStatus: (
    id: string, 
    status: 'actif' | 'inactif'
  ) => Promise<FichierImport>;
  
  // Colonnes personnalisées
  getCustomColumns: (
    userId: string, 
    forceRefresh?: boolean
  ) => Promise<CustomColumn[]>;
  
  addCustomColumn: (
    column: Omit<CustomColumn, 'id'> & { user_id: string }
  ) => Promise<CustomColumn>;
  
  updateCustomColumn: (
    columnId: string, 
    updates: Partial<Omit<CustomColumn, 'id' | 'user_id'>>
  ) => Promise<CustomColumn>;
  
  deleteCustomColumn: (columnId: string) => Promise<void>;
};

export default fileService;
