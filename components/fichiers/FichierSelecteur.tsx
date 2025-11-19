'use client';

import { useState, useMemo, useCallback, useEffect, SetStateAction } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, AlertCircle, ChevronDown, X, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '../ui/input';

interface FichierImport {
  id: string;
  nom: string;
  created_at?: string;
  size?: number;
  nb_lignes?: number;
}

interface FichierSelecteurProps {
  onFichierSelect: (fichierIds: string[] | null) => void;
  className?: string;
  userId?: string;
  availableFiles?: FichierImport[];
  disabled?: boolean;
  enableSearch?: boolean;
  showFileInfo?: boolean;
  label?: string;
  error?: string;
  loading?: boolean;
  selectedFileId?: string | null; // Rétrocompatibilité
  selectedFileIds?: string[];
  multiple?: boolean;
  placeholder?: string;
  fileLineCounts?: Record<string, number>;
}

export function FichierSelecteur({
  onFichierSelect,
  className = '',
  placeholder = 'Sélectionner un fichier',
  userId,
  availableFiles = [],
  disabled = false,
  enableSearch = true,
  showFileInfo = true,
  label,
  error,
  loading = false,
  selectedFileId = null, // Rétrocompatibilité
  selectedFileIds: externalSelectedIds = [],
  multiple = false,
  fileLineCounts = {},
}: FichierSelecteurProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);

  // Synchroniser les IDs sélectionnés
  useEffect(() => {
    if (selectedFileId && !multiple) {
      setInternalSelectedIds(selectedFileId ? [selectedFileId] : []);
    } else if (externalSelectedIds) {
      setInternalSelectedIds([...externalSelectedIds]);
    }
  }, [selectedFileId, externalSelectedIds, multiple]);

  // Gérer la sélection d'un fichier
  const handleSelect = useCallback((fileId: string) => {
    if (!fileId || disabled) return;
    
    setInternalSelectedIds(prev => {
      let newSelected: string[];
      
      if (multiple) {
        // En mode multiple, on ajoute ou retire le fichier de la sélection
        newSelected = prev.includes(fileId)
          ? prev.filter(id => id !== fileId)
          : [...prev, fileId];
      } else {
        // En mode simple, on remplace la sélection
        newSelected = [fileId];
        setIsOpen(false);
      }

      // Notifier le parent
      try {
        onFichierSelect(newSelected.length > 0 ? newSelected : null);
      } catch (error) {
        console.error('Erreur dans onFichierSelect:', error);
      }
      
      return newSelected;
    });
  }, [multiple, onFichierSelect, disabled]);

  // Obtenir les fichiers sélectionnés
  const selectedFiles = useMemo(() => {
    if (!availableFiles || !Array.isArray(availableFiles)) return [];
    return availableFiles.filter(file => file && file.id && internalSelectedIds.includes(file.id));
  }, [availableFiles, internalSelectedIds]);

  // Filtrage des fichiers
  const filteredFiles = useMemo(() => {
    if (!enableSearch || !searchQuery) return availableFiles || [];
    if (!availableFiles || !Array.isArray(availableFiles)) return [];
    const query = searchQuery.toLowerCase();
    return availableFiles.filter(file => 
      file && 
      file.nom && 
      file.id &&
      (file.nom.toLowerCase().includes(query) || file.id.toLowerCase().includes(query))
    );
  }, [availableFiles, searchQuery, enableSearch]);

  // Rendu du texte affiché dans le sélecteur
  const displayValue = useMemo(() => {
    if (internalSelectedIds.length === 0) return placeholder;
    if (internalSelectedIds.length === 1) {
      return availableFiles.find(f => f.id === internalSelectedIds[0])?.nom || 'Fichier sélectionné';
    }
    return `${internalSelectedIds.length} fichiers sélectionnés`;
  }, [internalSelectedIds, availableFiles, placeholder]);

  const formatFileSize = useCallback((bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const renderFileInfo = (file: FichierImport) => {
    if (!file) return null;
    
    const lineCount = file.nb_lignes || 0;
    const date = file.created_at ? new Date(file.created_at) : null;
    
    return (
      <div className="space-y-1">
        <div className="font-medium">{file.nom}</div>
        <div className="text-sm text-muted-foreground">
          {lineCount.toLocaleString()} lignes
          {date && (
            <span> • {formatDistanceToNow(date, { addSuffix: true, locale: fr })}</span>
          )}
        </div>
      </div>
    );
  };

  const renderSelectedFile = (file: FichierImport) => (
    <div key={file.id} className="flex items-center gap-2 p-2 bg-muted/20 rounded-md">
      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{file.nom}</div>
        <div className="text-xs text-muted-foreground">
          {file.nb_lignes?.toLocaleString() || '0'} lignes
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          handleSelect(file.id);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <TooltipProvider>
      <div className={cn('space-y-2', className)}>
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        
        <div className="relative">
          <div
            className={cn(
              'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              error ? 'border-destructive' : '',
              disabled || loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              'min-h-[40px]',
              isOpen && 'ring-2 ring-ring ring-offset-2'
            )}
            onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          >
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <span>Chargement...</span>
              ) : selectedFiles.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedFiles.map(file => (
                    <span key={file.id} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs">
                      {file.nom}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(file.id);
                        }}
                      />
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && 'rotate-180')} />
          </div>
          
          {isOpen && (
            <div 
              className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95"
              onMouseDown={(e) => e.preventDefault()} // Empêche le blur immédiat
            >
              {enableSearch && (
                <div className="p-2 border-b">
                  <div className="relative">
                    <Input
                      placeholder="Rechercher un fichier..."
                      className="w-full pl-8"
                      value={searchQuery}
                      onChange={(e: { target: { value: SetStateAction<string>; }; }) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}
              
              <ScrollArea className="max-h-[300px] overflow-y-auto">
                {filteredFiles.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Aucun fichier trouvé
                  </div>
                ) : (
                  <ul className="py-1">
                    {filteredFiles.map((file) => (
                      <li 
                        key={file.id}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                          'flex items-center gap-3 cursor-pointer',
                          internalSelectedIds.includes(file.id) && 'bg-accent font-medium'
                        )}
                        onClick={() => handleSelect(file.id)}
                      >
                        {multiple ? (
                          <Checkbox 
                            checked={internalSelectedIds.includes(file.id)}
                            className="h-4 w-4 rounded border-gray-300 pointer-events-none"
                          />
                        ) : (
                          <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate">{file.nom}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {file.nb_lignes} lignes
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
              
              {multiple && selectedFiles.length > 0 && (
                <div className="border-t p-2 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8"
                    onClick={() => {
                      onFichierSelect(null);
                      setInternalSelectedIds([]);
                    }}
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Tout effacer
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {showFileInfo && selectedFiles.length > 0 && !multiple && (
          <div className="mt-2 p-3 text-sm bg-muted/30 rounded-md">
            {renderFileInfo(selectedFiles[0])}
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
