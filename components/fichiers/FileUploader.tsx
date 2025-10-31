'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fileService } from '@/lib/services/fileService';
import { Progress } from '@/components/ui/progress';
import { FileMapping } from '@/components/fichiers/FileMapping';
import { Check, FileText, Loader2, UploadCloud } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

type ImportStep = 'upload' | 'select-sheet' | 'mapping' | 'preview' | 'complete';

interface FileUploaderProps {
  onUploadComplete?: (result: { success: boolean; fileId?: string; error?: string }) => void;
  onProgress?: (progress: number) => void;
  onCancel?: () => void;
  className?: string;
  acceptedFileTypes?: Record<string, string[]>;
  maxSizeMB?: number;
}

const DEFAULT_FILE_TYPES = {
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/csv': ['.csv']
};

const MAX_FILE_SIZE_MB = 10;

// Composant pour la barre de progression des étapes
const ProgressBar = ({ currentStep, className = '' }: { currentStep: ImportStep; className?: string }) => {
  const steps = useMemo<{ id: ImportStep; label: string }[]>(
    () => [
      { id: 'upload', label: 'Téléversement' },
      { id: 'select-sheet', label: 'Feuille' },
      { id: 'mapping', label: 'Mapping' },
      { id: 'preview', label: 'Aperçu' }
    ],
    []
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between px-2">
        {steps.map((step, index) => {
          const isComplete = steps.findIndex(s => s.id === currentStep) > index || currentStep === 'complete';
          const isCurrent = step.id === currentStep;
          const stepIndex = steps.findIndex(s => s.id === currentStep);
          
          return (
            <div key={step.id} className="flex flex-col items-center relative flex-1">
              <div className="flex flex-col items-center z-10 bg-white px-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                    isComplete
                      ? 'bg-[#2563EB] text-white shadow-md'
                      : isCurrent
                      ? 'border-2 border-[#2563EB] bg-white text-[#2563EB] shadow-md'
                      : 'border-2 border-gray-200 bg-white text-gray-400'
                  }`}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : index + 1}
                </div>
                <span className={`mt-2 text-xs font-medium whitespace-nowrap transition-colors ${
                  isComplete || isCurrent ? 'text-[#2563EB]' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
              
              {/* Ligne de connexion entre les étapes */}
              {index < steps.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-200 -z-0">
                  <div 
                    className="h-full bg-[#2563EB] transition-all duration-500 ease-in-out"
                    style={{
                      width: stepIndex >= index ? '100%' : '0%'
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Composant pour l'étape de téléversement
const UploadStep = ({
  onFileSelect,
  isDragActive,
  getRootProps,
  getInputProps,
  isLoading
}: {
  onFileSelect: (file: File) => void;
  isDragActive: boolean;
  getRootProps: any;
  getInputProps: any;
  isLoading: boolean;
}) => (
  <div
    {...getRootProps()}
    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
      isDragActive 
        ? 'border-[#2563EB] bg-[#2563EB]/5' 
        : 'border-gray-300 hover:border-[#2563EB]/50 bg-white hover:bg-gray-50'
    }`}
  >
    <input {...getInputProps()} />
    <div className="flex flex-col items-center justify-center space-y-3">
      {isLoading ? (
        <Loader2 className="h-14 w-14 animate-spin text-[#2563EB]" />
      ) : (
        <div className="p-4 rounded-full bg-[#2563EB]/10">
          <UploadCloud className="h-10 w-10 text-[#2563EB]" />
        </div>
      )}
      <p className={`text-base font-medium ${
        isDragActive ? 'text-[#2563EB]' : 'text-gray-700'
      }`}>
        {isLoading ? 'Traitement du fichier...' : 'Glissez-déposez votre fichier ici'}
      </p>
      <p className="text-sm text-gray-500">
        ou <span className="text-[#2563EB] font-medium">parcourir</span> vos fichiers
      </p>
      <p className="text-xs text-gray-400 mt-2">
        Formats supportés: .xlsx, .xls, .csv (max {MAX_FILE_SIZE_MB}MB)
      </p>
    </div>
  </div>
);

// Composant pour l'étape de sélection de feuille
const SheetSelectionStep = ({
  file,
  availableSheets,
  selectedSheetIndex,
  onSheetSelect,
  onBack,
  onNext,
  isLoading
}: {
  file: File | null;
  availableSheets: Array<{ name: string; rowCount: number }>;
  selectedSheetIndex: number;
  onSheetSelect: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563EB] mr-2" />
        <span className="text-gray-700">Chargement des feuilles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {file && (
        <div className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-[#2563EB]/10">
              <FileText className="h-6 w-6 text-[#2563EB]" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} Mo
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Prêt pour l'import
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Sélectionnez la feuille à importer</h3>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Feuille à importer</label>
            <select
              className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors duration-200"
              value={selectedSheetIndex}
              onChange={(e) => onSheetSelect(Number(e.target.value))}
              disabled={isLoading}
            >
              {availableSheets?.map((sheet, index) => (
                <option key={sheet.name} value={index}>
                  {sheet.name} ({sheet.rowCount} lignes)
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500">
              {availableSheets?.length || 0} feuille{availableSheets?.length !== 1 ? 's' : ''} disponible{availableSheets?.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <Button 
              variant="outline" 
              onClick={onBack} 
              disabled={isLoading}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Retour
            </Button>
            <Button 
              onClick={onNext} 
              disabled={isLoading || availableSheets?.length === 0}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  Suivant
                  <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function FileUploader({
  onUploadComplete,
  className = '',
  acceptedFileTypes = DEFAULT_FILE_TYPES,
  maxSizeMB = MAX_FILE_SIZE_MB
}: FileUploaderProps) {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const userId = user?.id || '';
  
  const {
    isUploading,
    progress,
    availableSheets,
    selectedSheetIndex,
    headers,
    mapping,
    setSelectedSheetIndex,
    uploadFile: uploadFileToServer,
    cancelUpload,
    updateColumnMapping,
    reset: resetFileUpload,
    readFileHeaders: readFileHeadersFromHook,
    setHeaders,
    setAvailableSheets
  } = useFileUpload(userId);
  
  // Fonction wrapper pour gérer le chargement des en-têtes de fichier
  const readFileHeaders = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const sheets = await readFileHeadersFromHook(file);
      return sheets;
    } finally {
      setIsLoading(false);
    }
  }, [readFileHeadersFromHook]);
  
  // Réinitialiser l'état complet
  const reset = useCallback(() => {
    resetFileUpload();
    setIsLoading(false);
  }, [resetFileUpload]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileSelect(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => {
      setIsDragging(false);
      toast.error('Type de fichier non pris en charge');
    },
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: isUploading || !!file
  });

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile) return;

    // Vérifier la taille du fichier (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    // Réinitialiser l'état avant de lire un nouveau fichier
    setFile(selectedFile);
    reset();
    
    try {
      setIsLoading(true);
      const sheets = await readFileHeaders(selectedFile);
      
      if (sheets.length === 0) {
        throw new Error('Aucune feuille trouvée dans le fichier');
      }

      setAvailableSheets(sheets);
      setSelectedSheetIndex(0);
      goToNextStep();
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Erreur lors de la lecture du fichier');
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour passer à l'étape suivante
  const goToNextStep = () => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('select-sheet');
        break;
      case 'select-sheet':
        setCurrentStep('mapping');
        break;
      case 'mapping':
        setCurrentStep('preview');
        break;
      case 'preview':
        handleImport();
        break;
    }
  };

  // Gestionnaire d'importation
  const handleImport = useCallback(async () => {
    if (!file) return;

    uploadAbortRef.current = new AbortController();
    setIsLoading(true);

    try {
      const result = await uploadFileToServer(file, {
        userId,
        sheetIndex: selectedSheetIndex,
        // @ts-ignore - Signal is handled internally by the upload function
        signal: uploadAbortRef.current?.signal,
      });
      
      if (result.success) {
        toast.success('Fichier importé avec succès');
        onUploadComplete?.({ success: true, fileId: result.fileId });
        setCurrentStep('complete');
      } else {
        throw new Error(result.error || 'Erreur lors de l\'importation');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'importation');
      setCurrentStep('upload');
    } finally {
      setIsLoading(false);
      uploadAbortRef.current = null;
    }
  }, [file, selectedSheetIndex, userId, onUploadComplete, uploadFileToServer]);

  // Fonction pour revenir à l'étape précédente
  const goToPreviousStep = () => {
    switch (currentStep) {
      case 'select-sheet':
        setCurrentStep('upload');
        break;
      case 'mapping':
        setCurrentStep('select-sheet');
        break;
      case 'preview':
        setCurrentStep('mapping');
        break;
      case 'complete':
        setCurrentStep('upload');
        break;
      default:
        break;
    }
  };

  // Effet de nettoyage
  useEffect(() => {
    return () => {
      if (uploadAbortRef.current) {
        uploadAbortRef.current.abort();
        uploadAbortRef.current = null;
      }
    };
  }, []);

  // Composant de la barre de progression des étapes
  const ProgressBar = () => {
    const steps: ImportStep[] = ['upload', 'select-sheet', 'mapping', 'preview'];
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-4">
          {steps.map((step, index) => {
            const stepIndex = steps.indexOf(step);
            const currentIndex = steps.indexOf(currentStep);
            const isComplete = stepIndex < currentIndex || currentStep === 'complete';
            const isCurrent = step === currentStep;
            const stepStatus = isComplete ? 'complete' : isCurrent ? 'current' : 'pending';
            
            return (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    stepStatus === 'complete'
                      ? 'bg-primary text-primary-foreground'
                      : stepStatus === 'current'
                      ? 'border-2 border-primary bg-background text-primary'
                      : 'border-2 border-muted-foreground/25 bg-background text-muted-foreground'
                  }`}
                >
                  {stepStatus === 'complete' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="mt-2 text-xs font-medium text-muted-foreground">
                  {step === 'upload' && 'Téléversement'}
                  {step === 'select-sheet' && 'Feuille'}
                  {step === 'mapping' && 'Mapping'}
                  {step === 'preview' && 'Aperçu'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
            style={{
              width: currentStep === 'complete' 
                ? '100%' 
                : `${(currentStep === 'upload' ? 0 : ['select-sheet', 'mapping', 'preview'].indexOf(currentStep) * 33.33) + 33.33}%`
            }}
          />
        </div>
      </div>
    );
  };

  // Rendu de l'étape de téléversement
  const renderUploadStep = () => (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
        isDragging 
          ? 'border-[#2563EB] bg-[#2563EB]/5' 
          : 'border-gray-300 hover:border-[#2563EB]/50 bg-white hover:bg-gray-50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="p-4 rounded-full bg-[#2563EB]/10">
          <UploadCloud className="h-10 w-10 text-[#2563EB]" />
        </div>
        <p className="text-sm text-gray-600">
          Glissez-déposez votre fichier ici, ou <span className="text-[#2563EB] font-medium">parcourir</span> vos fichiers
        </p>
        <p className="text-xs text-gray-400">
          Formats supportés: .xlsx, .xls, .csv (max {MAX_FILE_SIZE_MB}MB)
        </p>
      </div>
    </div>
  );

  // Rendu de l'étape de sélection de la feuille
  const renderSheetSelectionStep = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-[#2563EB] mr-2" />
          <span className="text-[#2563EB]">Chargement des données...</span>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-[#2563EB]/10">
              <FileText className="h-6 w-6 text-[#2563EB]" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{file?.name}</p>
              <p className="text-sm text-gray-500">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} Mo` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Sélectionnez la feuille à importer</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Feuille à importer</label>
              <select
                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition-colors duration-200"
                value={selectedSheetIndex}
                onChange={(e) => {
                  const newIndex = Number(e.target.value);
                  setSelectedSheetIndex(newIndex);
                  if (availableSheets && availableSheets[newIndex]) {
                    setHeaders(availableSheets[newIndex].headers);
                  }
                }}
                disabled={isUploading}
              >
                {availableSheets?.map((sheet, index) => (
                  <option key={sheet.name} value={index}>
                    {sheet.name} ({sheet.rowCount} lignes)
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {availableSheets?.length || 0} feuille(s) disponible(s)
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isUploading}
              >
                Retour
              </Button>
              <Button 
                onClick={() => {
                  if (availableSheets && availableSheets[selectedSheetIndex]) {
                    setHeaders(availableSheets[selectedSheetIndex].headers);
                  }
                  goToNextStep();
                }}
                disabled={isUploading || availableSheets?.length === 0}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rendu de l'étape de mapping
  const renderMappingStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Mappage des colonnes</h3>
        <p className="text-sm text-muted-foreground">
          Associez les colonnes de votre fichier aux champs de la base de données
        </p>
      </div>

      <FileMapping
        userId={userId}
        headers={headers}
        initialMapping={mapping}
        onMappingChange={(newMapping) => {
          Object.entries(newMapping).forEach(([header, value]) => {
            updateColumnMapping(header, value);
          });
        }}
        disabled={isUploading}
      />
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={goToPreviousStep}>
          Retour
        </Button>
        <Button 
          onClick={goToNextStep}
          disabled={isUploading || Object.keys(mapping).length === 0}
        >
          Voir l'aperçu
        </Button>
      </div>
    </div>
  );

  // Récupérer les données brutes après le mappage
  useEffect(() => {
    const fetchRawData = async () => {
      if (currentStep === 'preview' && file) {
        try {
          const data = await fileService.readFileAsJson(file, selectedSheetIndex);
          setRawData(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Erreur lors de la récupération des données brutes:', error);
          setRawData([]);
        }
      }
    };

    fetchRawData();
  }, [currentStep, file, selectedSheetIndex]);

  // Rendu de l'étape d'aperçu
  const renderPreviewStep = () => {
    const columns = headers.map(header => ({
      header,
      accessor: header
    }));

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Aperçu des données</h3>
          <p className="text-sm text-muted-foreground">
            Vérifiez que les données sont correctement mappées avant l'importation
          </p>
        </div>

        {/* Tableau d'aperçu des données brutes */}
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="border-b-2">
                  {columns.map((column) => (
                    <TableHead 
                      key={column.accessor}
                      className="whitespace-nowrap px-4 py-3 text-sm font-medium bg-muted/50"
                    >
                      <div className="flex items-center">
                        <span className="truncate max-w-[200px] inline-block">
                          {column.header}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawData.slice(0, 10).map((row, rowIndex) => (
                  <TableRow 
                    key={rowIndex} 
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={`${rowIndex}-${column.accessor}`} 
                        className="px-4 py-2 text-sm border-b whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]"
                        title={String(row[column.accessor] || '')}
                      >
                        <div className="truncate">
                          {row[column.accessor]?.toString() || '-'}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="border-t px-4 py-3 text-sm text-muted-foreground bg-muted/20">
            Affichage des 10 premières lignes sur {rawData.length} au total
          </div>
        </div>
        
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={goToPreviousStep}>
            Retour au mapping
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importation en cours...
              </>
            ) : (
              'Confirmer l\'importation'
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Rendu de l'étape de confirmation
  const renderCompleteStep = () => (
    <div className="text-center space-y-4 py-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-medium">Importation réussie !</h3>
      <p className="text-muted-foreground">
        Votre fichier a été importé avec succès.
      </p>
      <div className="pt-4">
        <Button onClick={() => setCurrentStep('upload')}>
          Importer un autre fichier
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {currentStep !== 'upload' && <ProgressBar />}
      
      <div className="pt-2">
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'select-sheet' && renderSheetSelectionStep()}
        {currentStep === 'mapping' && renderMappingStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {currentStep === 'complete' && renderCompleteStep()}
      </div>

      {/* Indicateur de chargement global */}
      {isUploading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 shadow-lg max-w-md w-full mx-4">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-medium">Importation en cours</p>
              <p className="text-sm text-muted-foreground text-center">
                Veuillez patienter pendant l'importation de vos données...
              </p>
              <div className="w-full space-y-2 pt-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progression</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M8 13h8" />
          <path d="M8 17h8" />
          <path d="M10 9H8v2h2V9z" />
        </svg>
      </div>
    );
  }

  if (mimeType.includes('csv')) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M8 13h8" />
          <path d="M8 17h8" />
          <path d="M8 9h2v2H8z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
  );
}
