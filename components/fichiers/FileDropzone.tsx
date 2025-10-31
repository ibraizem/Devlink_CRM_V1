import { useCallback, useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/types/utils';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // en octets
  accept?: string;
  className?: string;
  isUploading?: boolean;
}

export const FileDropzone = ({
  onFilesSelected,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB par défaut
  accept = '.csv,.xlsx,.xls,.json',
  className,
  isUploading = false,
}: FileDropzoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const validateFiles = useCallback((files: File[]): { valid: boolean; message?: string } => {
    if (files.length > maxFiles) {
      return { 
        valid: false, 
        message: `Vous ne pouvez téléverser que ${maxFiles} fichier(s) à la fois` 
      };
    }

    for (const file of files) {
      if (file.size > maxSize) {
        return { 
          valid: false, 
          message: `Le fichier ${file.name} dépasse la taille maximale de ${maxSize / (1024 * 1024)}MB` 
        };
      }
    }

    return { valid: true };
  }, [maxFiles, maxSize]);

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validation = validateFiles(fileArray);
    
    if (!validation.valid) {
      setError(validation.message || 'Une erreur est survenue');
      return;
    }

    setError(null);
    onFilesSelected(fileArray);
  }, [onFilesSelected, validateFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    setIsDragging(true);
  }, [isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    setIsDragging(false);
  }, [isUploading]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isUploading) return;
    setIsDragging(false);
    
    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [isUploading, processFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Réinitialiser la valeur pour permettre la sélection du même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  };

  // Gérer le glisser-déposer en dehors de la fenêtre
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      if (isUploading) return;
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      if (isUploading) return;
      e.preventDefault();
      // Vérifier si la souris est toujours dans la fenêtre
      if (
        e.clientX <= 0 || 
        e.clientY <= 0 || 
        e.clientX >= window.innerWidth || 
        e.clientY >= window.innerHeight
      ) {
        setIsDragging(false);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      setIsDragging(false);
    });

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', (e) => e.preventDefault());
      window.removeEventListener('drop', (e) => e.preventDefault());
    };
  }, [isUploading]);

  return (
    <div className={className}>
      <div 
        ref={dropRef}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50',
          isUploading && 'opacity-60 cursor-not-allowed',
          error && 'border-destructive/50 bg-destructive/5'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Téléversement en cours...</p>
            </>
          ) : (
            <>
              <div className="rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">
                  Glissez et déposez vos fichiers ici, ou cliquez pour sélectionner
                </p>
                <p className="text-xs text-muted-foreground">
                  Fichiers supportés: {accept.replace(/\./g, '').replace(/,/g, ', ')}
                  <br />
                  Taille maximale: {maxSize / (1024 * 1024)}MB par fichier
                </p>
                {error && (
                  <p className="text-xs text-destructive mt-2">
                    {error}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
};
