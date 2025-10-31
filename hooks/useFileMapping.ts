import { useState, useMemo, useCallback } from 'react';

export interface ColumnDefinition {
  key: string;
  label: string;
  isVisible?: boolean;
  isCustom?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  filterable?: boolean;
  sortable?: boolean;
  width?: string | number;
}

export interface ColumnOption {
  value: string;
  label: string;
  required?: boolean;
  isCustom?: boolean;
  category?: string;
}

export const useFileMapping = (userId: string | undefined) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Définir les champs obligatoires
  const REQUIRED_FIELDS = ['denomination_entreprise', 'telephone', 'email'];

  // Vérifier si le mapping est valide (tous les champs requis sont mappés)
  const isMappingValid = useMemo(() => {
    const mappedValues = new Set(Object.values(mapping));
    return REQUIRED_FIELDS.every(field => mappedValues.has(field));
  }, [mapping]);

  // Obtenir les champs obligatoires manquants
  const missingRequiredFields = useMemo(() => {
    const mappedValues = new Set(Object.values(mapping));
    return REQUIRED_FIELDS.filter(field => !mappedValues.has(field));
  }, [mapping]);
  
  // Gérer le changement de mapping
  const handleMappingChange = useCallback((sourceColumn: string, targetColumn: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      
      // Supprimer l'ancien mapping si la colonne cible était déjà mappée
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === targetColumn && key !== sourceColumn) {
          delete newMapping[key];
        }
      });

      // Mettre à jour le mapping
      if (targetColumn) {
        newMapping[sourceColumn] = targetColumn;
      } else {
        delete newMapping[sourceColumn];
      }

      return newMapping;
    });
  }, []);

  // Réinitialiser le mapping
  const resetMapping = useCallback(() => {
    setMapping({});
  }, []);

  // Mettre à jour le mapping avec de nouvelles valeurs
  const updateMapping = useCallback((newMapping: Record<string, string>) => {
    setMapping(newMapping);
  }, []);
  
  // Colonnes par défaut (seront remplacées par celles de useMappingOptions)
  const columns: ColumnOption[] = [];

  return {
    columns,
    isLoading,
    mapping,
    isMappingValid,
    missingRequiredFields,
    handleMappingChange,
    setMapping: updateMapping,
    resetMapping
  };
};
