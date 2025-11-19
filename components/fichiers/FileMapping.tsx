// components/fichiers/FileMapping.tsx
'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Info, Check } from 'lucide-react';
import { useFileMapping } from '@/hooks/useFileMapping';
import { useMappingOptions, type MappingOption } from '@/hooks/useMappingOptions';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/types/utils';

interface FileMappingProps {
  userId: string | undefined;
  headers: string[];
  initialMapping?: Record<string, string>;
  onMappingChange?: (mapping: Record<string, string>) => void;
  disabled?: boolean;
  previewData?: Record<string, any>;
}

export function FileMapping({ 
  userId,
  headers = [],
  initialMapping = {},
  onMappingChange,
  disabled = false,
  previewData = {}
}: FileMappingProps) {
  // États pour la gestion des modales
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [newField, setNewField] = useState<Omit<MappingOption, 'isCustom'>>({ 
    value: '', 
    label: '',
    category: 'custom',
    required: false 
  });
  
  // Fonction pour normaliser le nom du champ en valeur technique
  const normalizeFieldValue = useCallback((str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '_') // Remplacer les caractères spéciaux par des underscores
      .replace(/^_+|_+$/g, '') // Supprimer les underscores au début et à la fin
      .replace(/_{2,}/g, '_'); // Remplacer les multiples underscores par un seul
  }, []);
  
  // Utilisation du hook pour gérer les options de mapping
  const { 
    options: mappingOptions, 
    categories, 
    addOption,
    removeOption,
    updateOption
  } = useMappingOptions();
  
  const {
    isLoading,
    mapping,
    isMappingValid,
    missingRequiredFields,
    handleMappingChange,
    setMapping
  } = useFileMapping(userId);
  
  // Fusionner les colonnes par défaut avec les options de mapping
  const columns = useMemo(() => {
    return mappingOptions
      .filter(option => option.value !== '')
      .map(option => ({
        value: option.value,
        label: option.label,
        required: option.required,
        isCustom: option.isCustom,
        category: option.category
      }));
  }, [mappingOptions]);
  
  // Gérer l'ajout d'un nouveau champ
  const { toast } = useToast();
  
  const handleAddField = useCallback(async () => {
    if (newField.value && newField.label) {
      try {
        const success = addOption({
          ...newField,
          isCustom: true
        } as MappingOption);
        
        if (success) {
          // Mettre à jour le mapping si on était en train d'éditer un en-tête
          if (editingHeader) {
            const newMapping = {
              ...mapping,
              [editingHeader]: newField.value
            };
            setMapping(newMapping);
            onMappingChange?.(newMapping);
          }
          
          // Réinitialiser le formulaire
          setNewField({ value: '', label: '', category: 'custom', required: false });
          setEditingHeader(null);
          setIsAddFieldOpen(false);
          
          toast({
            title: "Champ ajouté",
            description: `Le champ "${newField.label}" a été ajouté avec succès.`,
            action: <Check className="h-4 w-4 text-green-500" />
          });
        } else {
          throw new Error("Un champ avec cette valeur technique existe déjà.");
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'ajout du champ.",
          variant: "destructive"
        });
      }
    }
  }, [newField, addOption, editingHeader, mapping, onMappingChange, setMapping, toast]);
  
  // Préparer l'ajout d'un nouveau champ depuis un en-tête
  const prepareAddField = useCallback((header: string) => {
    const normalizedValue = normalizeFieldValue(header);
    
    setEditingHeader(header);
    setNewField({
      value: normalizedValue,
      label: header,
      category: 'custom',
      required: false
    });
    
    setIsAddFieldOpen(true);
  }, [normalizeFieldValue]);
  
  // Valider la valeur technique
  const validateFieldValue = (value: string) => {
    return /^[a-z0-9_]+$/.test(value);
  };

  // Initialiser le mapping avec les valeurs fournies
  useEffect(() => {
    if (Object.keys(initialMapping).length > 0) {
      setMapping(initialMapping);
    }
  }, [initialMapping, setMapping]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[40%]">Colonne source</TableHead>
              <TableHead>Champ de destination</TableHead>
              <TableHead>Exemple</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.length > 0 ? (
              headers.map((header) => {
                const column = columns.find(col => col.value === mapping[header]);
                const isRequired = column?.required;
                
                return (
                  <TableRow key={header} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {header}
                        {isRequired && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                        {mapping[header] && (
                          <Badge 
                            variant="outline" 
                            className="ml-2 bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {column?.label || mapping[header]}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1">
                            <Select
                              value={mapping[header] || ''}
                              onValueChange={(value: string) => handleMappingChange(header, value)}
                              disabled={disabled}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sélectionner un champ" />
                              </SelectTrigger>
                              <SelectContent>
                                {columns
                                  .filter(col => col.value !== '')
                                  .sort((a, b) => {
                                    if (a.category !== b.category) {
                                      return (a.category || '').localeCompare(b.category || '');
                                    }
                                    return a.label.localeCompare(b.label);
                                  })
                                  .map((col) => (
                                    <SelectItem 
                                      key={col.value}
                                      value={col.value}
                                      disabled={
                                        col.required && 
                                        Object.values(mapping).includes(col.value) && 
                                        mapping[header] !== col.value
                                      }
                                      className={cn(
                                        "flex items-center gap-2 group",
                                        col.isCustom && "font-medium"
                                      )}
                                    >
                                      <div className="flex items-center gap-2 w-full">
                                        {col.isCustom && (
                                          <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500"></span>
                                        )}
                                        <span className="truncate flex-1">
                                          {col.label}
                                        </span>
                                        {col.required && (
                                          <span className="text-red-500 ml-1 shrink-0">*</span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="icon"
                                  className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    prepareAddField(header);
                                  }}
                                  aria-label={`Créer un champ pour ${header}`}
                                >
                                  <PlusCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Créer un nouveau champ</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate">
                              {previewData?.[header] !== undefined ? (
                                <span className="truncate">
                                  {String(previewData[header]).substring(0, 30)}
                                  {String(previewData[header]).length > 30 ? '...' : ''}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50">-</span>
                              )}
                            </div>
                          </TooltipTrigger>
                          {previewData?.[header] !== undefined && (
                            <TooltipContent className="max-w-[300px] p-3">
                              <div className="font-mono text-xs wrap-break-word whitespace-pre-wrap">
                                {String(previewData[header])}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                  Aucune colonne à mapper
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-blue-500 mr-1.5"></div>
          <span>Champ personnalisé</span>
        </div>
        <div className="flex items-center">
          <span className="text-red-500 mr-1">*</span>
          <span>Champ obligatoire</span>
        </div>
        {!isMappingValid && missingRequiredFields.length > 0 && (
          <div className="text-amber-600 flex items-center">
            <Info className="h-3 w-3 mr-1" />
            <span>Veuillez mapper tous les champs obligatoires</span>
          </div>
        )}
      </div>

      {/* Modale d'ajout de champ */}
      <Dialog open={isAddFieldOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingHeader(null);
          setNewField({ value: '', label: '', category: 'custom', required: false });
        }
        setIsAddFieldOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau champ</DialogTitle>
            <DialogDescription>
              Définissez les propriétés du nouveau champ à ajouter au mappage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fieldLabel">Nom du champ</Label>
              <Input
                id="fieldLabel"
                value={newField.label}
                onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Téléphone portable"
              />
            </div>
            <div>
              <Label htmlFor="fieldValue">Valeur technique</Label>
              <Input
                id="fieldValue"
                value={newField.value}
                onChange={(e) => setNewField(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Ex: telephone_portable"
                className={!validateFieldValue(newField.value) && newField.value ? 'border-red-500' : ''}
              />
              {!validateFieldValue(newField.value) && newField.value && (
                <p className="text-sm text-red-500 mt-1">
                  La valeur technique ne doit contenir que des lettres minuscules, des chiffres et des underscores
                </p>
              )}
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select
                value={newField.category}
                onValueChange={(value: any) => setNewField(prev => ({ ...prev, category: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="fieldRequired"
                checked={newField.required}
                onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="fieldRequired" className="text-sm font-medium">
                Champ obligatoire
              </label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingHeader(null);
                  setNewField({ value: '', label: '', category: 'custom', required: false });
                  setIsAddFieldOpen(false);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddField}
                disabled={!newField.label || !newField.value || !validateFieldValue(newField.value)}
              >
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
