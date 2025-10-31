// types/file.types.ts
export interface FileData {
    id: string;
    name: string;
    path: string;
    size: number;
    mime_type: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    user_id: string;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, any>;
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
    headers: string[];
  }