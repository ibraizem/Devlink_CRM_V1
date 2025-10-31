import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface MappingOption {
  value: string;
  label: string;
  required?: boolean;
  isCustom?: boolean;
  category?: string;
}

const STORAGE_KEY = 'custom_mapping_options';

// Options de mapping par défaut
const DEFAULT_MAPPING_OPTIONS: MappingOption[] = [
  { value: '', label: '-- Ne pas importer --', required: false },
  { value: 'denomination_entreprise', label: 'Dénomination entreprise', required: true, category: 'entreprise' },
  { value: 'telephone', label: 'Téléphone', required: true, category: 'contact' },
  { value: 'telephone_2', label: 'Téléphone secondaire', required: false, category: 'contact' },
  { value: 'email', label: 'Email', required: true, category: 'contact' },
  { value: 'adresse', label: 'Adresse', required: false, category: 'adresse' },
  { value: 'code_postal', label: 'Code postal', required: false, category: 'adresse' },
  { value: 'ville', label: 'Ville', required: false, category: 'adresse' },
  { value: 'pays', label: 'Pays', required: false, category: 'adresse' },
  { value: 'activite', label: 'Activité', required: false, category: 'entreprise' },
  { value: 'siret', label: 'SIRET', required: false, category: 'entreprise' },
  { value: 'siren', label: 'SIREN', required: false, category: 'entreprise' },
];

export const useMappingOptions = () => {
  const [options, setOptions] = useState<MappingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Set<string>>(new Set());

  // Charger les options depuis le stockage local
  useEffect(() => {
    try {
      const savedOptions = localStorage.getItem(STORAGE_KEY);
      const parsedOptions = savedOptions ? JSON.parse(savedOptions) : [];
      
      // Fusionner avec les options par défaut
      const mergedOptions = [...DEFAULT_MAPPING_OPTIONS];
      
      // Ajouter les options personnalisées qui n'existent pas déjà
      parsedOptions.forEach((option: MappingOption) => {
        if (!mergedOptions.some(o => o.value === option.value)) {
          mergedOptions.push({
            ...option,
            isCustom: true
          });
        }
      });
      
      setOptions(mergedOptions);
      
      // Extraire les catégories uniques
      const uniqueCategories = new Set<string>();
      mergedOptions.forEach(opt => {
        if (opt.category) {
          uniqueCategories.add(opt.category);
        }
      });
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error('Erreur lors du chargement des options de mapping:', error);
      setOptions(DEFAULT_MAPPING_OPTIONS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder les options dans le stockage local
  const saveOptions = useCallback((newOptions: MappingOption[]) => {
    try {
      // Ne sauvegarder que les options personnalisées
      const customOptions = newOptions.filter(opt => opt.isCustom);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOptions));
      
      // Mettre à jour les catégories
      const uniqueCategories = new Set<string>();
      newOptions.forEach(opt => {
        if (opt.category) {
          uniqueCategories.add(opt.category);
        }
      });
      setCategories(uniqueCategories);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des options:', error);
      toast.error('Erreur lors de la sauvegarde des options');
      return false;
    }
  }, []);

  // Ajouter une nouvelle option
  const addOption = useCallback((option: Omit<MappingOption, 'isCustom'>) => {
    if (options.some(opt => opt.value === option.value)) {
      toast.error('Une option avec cette valeur existe déjà');
      return false;
    }
    
    const newOption = {
      ...option,
      isCustom: true
    };
    
    const newOptions = [...options, newOption];
    setOptions(newOptions);
    
    return saveOptions(newOptions);
  }, [options, saveOptions]);

  // Supprimer une option personnalisée
  const removeOption = useCallback((value: string) => {
    // Ne pas permettre la suppression des options par défaut
    if (!options.some(opt => opt.value === value && opt.isCustom)) {
      toast.error('Impossible de supprimer une option par défaut');
      return false;
    }
    
    const newOptions = options.filter(opt => opt.value !== value);
    setOptions(newOptions);
    
    return saveOptions(newOptions);
  }, [options, saveOptions]);

  // Mettre à jour une option existante
  const updateOption = useCallback((value: string, updates: Partial<MappingOption>) => {
    const optionIndex = options.findIndex(opt => opt.value === value);
    if (optionIndex === -1) return false;
    
    // Ne pas permettre la modification des options par défaut
    if (!options[optionIndex].isCustom) {
      toast.error('Impossible de modifier une option par défaut');
      return false;
    }
    
    const newOptions = [...options];
    newOptions[optionIndex] = {
      ...newOptions[optionIndex],
      ...updates
    };
    
    setOptions(newOptions);
    return saveOptions(newOptions);
  }, [options, saveOptions]);

  // Obtenir les options par catégorie
  const getOptionsByCategory = useCallback((category: string) => {
    return options.filter(opt => opt.category === category);
  }, [options]);

  // Obtenir une option par sa valeur
  const getOptionByValue = useCallback((value: string) => {
    return options.find(opt => opt.value === value);
  }, [options]);

  return {
    options,
    categories: Array.from(categories),
    isLoading,
    addOption,
    removeOption,
    updateOption,
    getOptionsByCategory,
    getOptionByValue
  };
};

export default useMappingOptions;
