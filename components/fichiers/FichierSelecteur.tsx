'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FichierImport {
  id: string;
  nom: string;
  created_at?: string;
  size?: number;
}

interface FichierSelecteurProps {
  onFichierSelect: (fichierId: string | null) => void;
  className?: string;
  placeholder?: string;
  userId?: string;
  fileLineCounts: Record<string, number>;
  availableFiles?: FichierImport[];
  disabled?: boolean;
  enableSearch?: boolean;
  showFileInfo?: boolean;
  label?: string;
  error?: string;
  loading?: boolean;
  selectedFileId?: string | null;
}

export function FichierSelecteur({
  onFichierSelect,
  className = '',
  placeholder = 'Sélectionner un fichier',
  fileLineCounts = {},
  availableFiles = [],
  disabled = false,
  enableSearch = true,
  showFileInfo = true,
  label,
  error,
  loading = false,
  selectedFileId = null,
}: FichierSelecteurProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mettre à jour la valeur sélectionnée lorsque selectedFileId change
  useEffect(() => {
    if (selectedFileId) {
      // Vérifier que le fichier existe toujours dans la liste
      const fileExists = availableFiles.some(file => file.id === selectedFileId);
      if (fileExists) {
        onFichierSelect(selectedFileId);
      }
    }
  }, [selectedFileId, availableFiles, onFichierSelect]);
  
  // Obtenir le fichier sélectionné
  const selectedFile = useMemo(() => {
    if (!selectedFileId) return null;
    return availableFiles.find(f => f.id === selectedFileId) || null;
  }, [availableFiles, selectedFileId]);
  
  const filteredFiles = useMemo(() => {
    if (!enableSearch || !searchQuery) return availableFiles || [];
    const query = searchQuery.toLowerCase();
    return (availableFiles || []).filter(file => 
      file.nom.toLowerCase().includes(query) ||
      file.id.toLowerCase().includes(query)
    );
  }, [availableFiles, searchQuery, enableSearch]);
  

  const handleValueChange = useCallback((value: string) => {
    onFichierSelect(value || null);
  }, [onFichierSelect]);


  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);
  const renderFileInfo = useCallback((file: FichierImport) => {
    const lineCount = fileLineCounts[file.id] || 0;
    const createdAt = file.created_at ? new Date(file.created_at) : null;
    
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="truncate font-medium text-foreground">{file.nom}</p>
        </div>
        {showFileInfo && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Badge variant="outline" className="text-xs font-normal">
                {lineCount.toLocaleString('fr-FR')} {lineCount > 1 ? 'lignes' : 'ligne'}
              </Badge>
            </div>
            {createdAt && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate">
                    {formatDistanceToNow(createdAt, { addSuffix: true, locale: fr })}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {createdAt.toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TooltipContent>
              </Tooltip>
            )}
            {file.size !== undefined && (
              <span className="hidden sm:inline">{formatFileSize(file.size)}</span>
            )}
          </div>
        )}
      </div>
    );
  }, [fileLineCounts, showFileInfo, formatFileSize]);

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && <Skeleton className="h-4 w-24" />}
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn('w-full space-y-2', className)}>
        {label && (
          <label className="block text-sm font-medium text-foreground/80 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            className={cn(
              'w-full bg-background py-2 pl-3 pr-8 text-sm border border-input rounded-md',
              'focus:ring-2 focus:ring-primary/50 focus:outline-none',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              'appearance-none'
            )}
            value={selectedFileId || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={disabled || loading}
          >
            <option value="">{placeholder}</option>
            {filteredFiles.map((file) => (
              <option key={file.id} value={file.id}>
                {file.nom}
              </option>
            ))}
          </select>
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {selectedFile && showFileInfo && (
          <div className="mt-2 p-3 text-sm bg-muted/30 rounded-md">
            {renderFileInfo(selectedFile)}
          </div>
        )}
        
        {error && (
          <div className="flex items-center mt-1 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mr-1.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
