'use client';

import { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileMapping } from '@/components/fichiers/FileMapping';
import { Check, FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

type ImportStep = 'upload' | 'select-sheet' | 'mapping' | 'preview' | 'complete';

interface FileUploaderProps {
  onUploadComplete?: (result: { success: boolean; fileId?: string; error?: string }) => void;
  onProgress?: (progress: number) => void;
  onCancel?: () => void;
  className?: string;
}

export function FileUploader({ onUploadComplete, className = '' }: FileUploaderProps) {
  const { user } = useCurrentUser();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const uploadAbortRef = useRef<AbortController | null>(null);
  const userId = user?.id || '';

  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  
  const {
    isUploading,
    progress,
    availableSheets,
    selectedSheetIndex,
    headers,
    mapping,
    error,
    setSelectedSheetIndex,
    uploadFile,
    cancelUpload,
    updateColumnMapping,
    reset: resetFileUpload,
    readFileHeaders: readFileHeadersFromHook,
    setHeaders,
    setAvailableSheets
  } = useFileUpload(userId);
  
  // Fonction wrapper pour gérer le chargement
  const readFileHeaders = useCallback(async (file: File) => {
    setIsLoadingSheets(true);
    try {
      const sheets = await readFileHeadersFromHook(file);
      return sheets;
    } finally {
      setIsLoadingSheets(false);
    }
  }, [readFileHeadersFromHook]);
  
  // Réinitialiser l'état complet
  const reset = useCallback(() => {
    resetFileUpload();
    setIsLoadingSheets(false);
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
      setIsLoadingSheets(true);
      const sheets = await readFileHeaders(selectedFile);
      
      if (sheets.length === 0) {
        toast.error('Aucune feuille valide trouvée dans le fichier');
        return;
      }

      // Toujours passer par l'étape de sélection de feuille
      setAvailableSheets(sheets);
      setCurrentStep('select-sheet');
      
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier:', error);
      toast.error('Erreur lors de la lecture du fichier');
      setFile(null);
    } finally {
      setIsLoadingSheets(false);
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
    }
  };

  const handleImport = async () => {
    if (!file) return;

    uploadAbortRef.current = new AbortController();

    try {
      // Lire les données de la feuille sélectionnée
      const result = await uploadFile(file, {
        userId,
        sheetIndex: selectedSheetIndex
      });

      if (result.success) {
        toast.success('Fichier importé avec succès');
        setCurrentStep('complete');
        onUploadComplete?.({ success: true, fileId: result.fileId });
        
        // Réinitialiser après un délai pour laisser voir le message de succès
        setTimeout(() => {
          setFile(null);
          reset();
          setCurrentStep('upload');
        }, 2000);
      } else {
        toast.error(result.error || 'Erreur lors de l\'importation');
        setCurrentStep('upload');
      }
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      toast.error('Erreur lors de l\'importation du fichier');
    } finally {
      uploadAbortRef.current = null;
    }
  };

  const handleCancel = () => {
    if (isUploading && uploadAbortRef.current) {
      uploadAbortRef.current.abort();
      cancelUpload();
    }
    setFile(null);
    reset();
    setCurrentStep('upload');
  };

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
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2">
        <UploadCloud className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Glissez-déposez votre fichier ici, ou cliquez pour sélectionner
        </p>
        <p className="text-xs text-muted-foreground">
          Formats supportés: .xlsx, .xls, .csv (max 10MB)
        </p>
      </div>
    </div>
  );

  // Rendu de l'étape de sélection de la feuille
  const renderSheetSelectionStep = () => {
    if (isLoadingSheets) {
      return (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Chargement des feuilles...</span>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{file?.name}</p>
              <p className="text-sm text-muted-foreground">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sélectionnez la feuille à importer</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Feuille à importer</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

  // Rendu de l'étape d'aperçu
  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Aperçu des données</h3>
        <p className="text-sm text-muted-foreground">
          Vérifiez que les données sont correctement mappées avant l'importation
        </p>
      </div>

      {/* Ici, vous pouvez ajouter un composant d'aperçu des données */}
      <div className="border rounded-md p-4 bg-muted/20">
        <p className="text-sm text-muted-foreground text-center py-8">
          Aperçu des données à implémenter
        </p>
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
