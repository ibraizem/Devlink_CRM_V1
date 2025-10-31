
export type FileStatus = 'actif' | 'inactif' | 'en_cours' | 'erreur';

export interface FileUploadData {
  id: string;
  name: string;
  path: string;
  size: number;
  status: FileStatus;
  uploadedAt: string;
  userId: string;
  mapping: Record<string, string>;
}

export interface CustomColumn {
  id?: string;
  column_name: string;
  display_name: string;
  user_id?: string;
}

export interface SheetInfo {
  name: string;
  index: number;
}

export type LeadColumn = {
  column_name: string;
  value: string;
  label: string;
};

export interface FileUploadState {
  selectedFile: File | null;
  isUploading: boolean;
  mappingMode: string | null;
  mapping: Record<string, string>;
  headers: string[];
  separator: string;
  availableSheets: SheetInfo[];
  selectedSheetIndex: number;
  processedSheets: Set<string>;
  newColumnName: string;
  showNewColumnInput: string | null;
  customColumns: CustomColumn[];
}
