// hooks/useFileUpload.ts
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { fileService } from '@/lib/services/fileService';
import { FileData, FileImportResult, SheetInfo } from '@/lib/types/file.types';

// Define the expected options type for the file service
interface FileServiceUploadOptions {
  user_id: string;
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

export const useFileUpload = (userId: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [availableSheets, setAvailableSheets] = useState<SheetInfo[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    setProgress(0);
    setAvailableSheets([]);
    setSelectedSheetIndex(0);
    setHeaders([]);
    setMapping({});
    setError(null);
  }, []);

  // Annuler le téléchargement
  const cancelUpload = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
      setIsUploading(false);
      toast.info('Téléchargement annulé');
    }
  }, []);

  // Mettre à jour le mapping des colonnes
  const updateColumnMapping = useCallback((header: string, value: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      if (value) {
        newMapping[header] = value;
      } else {
        delete newMapping[header];
      }
      return newMapping;
    });
  }, []);

  // Lire les en-têtes du fichier
  const readFileHeaders = useCallback(async (file: File) => {
    try {
      const sheets = await fileService.readFileHeaders(file);
      setAvailableSheets(sheets);
      
      if (sheets.length > 0) {
        // Mettre à jour les en-têtes pour la feuille sélectionnée
        const currentSheetIndex = Math.min(selectedSheetIndex, sheets.length - 1);
        setSelectedSheetIndex(currentSheetIndex);
        setHeaders(sheets[currentSheetIndex].headers);
        
        // Mappage intelligent par défaut
        const defaultMapping: Record<string, string> = {};
        sheets[currentSheetIndex].headers.forEach((header: string) => {
          if (!header) return;
          
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('raison') || lowerHeader.includes('société') || lowerHeader.includes('entreprise')) {
            defaultMapping[header] = 'denomination_entreprise';
          } else if (lowerHeader.includes('téléphone') || lowerHeader.includes('tel') || lowerHeader.includes('phone')) {
            defaultMapping[header] = 'telephone';
          } else if (lowerHeader.includes('mail') || lowerHeader.includes('email') || lowerHeader.includes('courriel')) {
            defaultMapping[header] = 'email';
          } else if (lowerHeader.includes('ville') || lowerHeader.includes('city')) {
            defaultMapping[header] = 'ville';
          } else if (lowerHeader.includes('code postal') || lowerHeader.includes('cp') || lowerHeader.includes('zip')) {
            defaultMapping[header] = 'code_postal';
          }
        });
        
        setMapping(defaultMapping);
      }
      
      return sheets;
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      setError('Impossible de lire le fichier. Vérifiez le format et réessayez.');
      throw error;
    }
  }, [selectedSheetIndex]);

  // Télécharger un fichier
  const uploadFile = useCallback(async (
    file: File, 
    options: { 
      userId: string; 
      onProgress?: (progress: number) => void;
      sheetIndex?: number;
    } = { userId }
  ): Promise<FileImportResult> => {
    if (!file) {
      const errorMsg = 'Aucun fichier sélectionné';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsUploading(true);
    abortController.current = new AbortController();

    try {
      // 1. Lire les en-têtes du fichier
      await readFileHeaders(file);
      // 2. Téléverser le fichier avec les options correctes
      const uploadOptions: FileServiceUploadOptions = {
        user_id: options.userId,
        onProgress: (progress: number) => {
          options.onProgress?.(progress);
          setProgress(progress);
        },
        abortSignal: abortController.current?.signal
      };

      const uploadedFile = await fileService.uploadFile(file, uploadOptions);
      
      // 3. Préparer les métadonnées du fichier
      const sheetIndex = options.sheetIndex !== undefined ? options.sheetIndex : selectedSheetIndex;
      const currentSheet = availableSheets[sheetIndex] || availableSheets[0];
      
      const fileMetadata = {
        nom: file.name,
        chemin: uploadedFile.chemin,
        taille: file.size,
        mime_type: file.type,
        statut: 'en_cours' as const,
        user_id: options.userId,
        original_filename: file.name,
        type: file.type,
        date_import: new Date().toISOString(),
        nb_lignes: currentSheet?.rowCount || 0,
        nb_lignes_importees: 0,
        mapping_colonnes: mapping,
        separateur: ',',
        metadata: {
          sheetCount: availableSheets.length,
          selectedSheet: sheetIndex,
          sheetName: currentSheet?.name || 'Feuille 1',
          mapping
        }
      };

      // Le fichier est déjà enregistré via uploadFile, donc pas besoin de saveFileMetadata séparé
      const savedFile = uploadedFile;

      // 4. Importer les données
      const { rowCount } = await fileService.importData(file, mapping, { 
        sheetIndex 
      });

      options.onProgress?.(100);
      
      return { 
        success: true, 
        fileId: savedFile.id,
        headers,
        rowCount
      };
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      const errorMsg = error instanceof Error ? error.message : 'Une erreur est survenue';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsUploading(false);
      abortController.current = null;
    }
  }, [availableSheets, headers, mapping, readFileHeaders, selectedSheetIndex, userId]);

  return {
    // États
    isUploading,
    progress,
    availableSheets,
    selectedSheetIndex,
    headers,
    mapping,
    error,
    
    // Méthodes
    setSelectedSheetIndex,
    uploadFile,
    cancelUpload,
    updateColumnMapping,
    reset,
    readFileHeaders,
    setHeaders,
    setAvailableSheets
  };
};