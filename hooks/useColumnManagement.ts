import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { fileService } from '@/lib/services/fileService';
import { CustomColumn, LeadColumn } from '@/lib/types/index';

// Colonnes par défaut (en dehors du composant pour éviter les recréations)
const DEFAULT_COLUMNS: LeadColumn[] = [
  {
    value: 'nom', label: 'Nom',
    column_name: ''
  },
  {
    value: 'prenom', label: 'Prénom',
    column_name: ''
  },
  {
    value: 'email', label: 'Email',
    column_name: ''
  },
  {
    value: 'telephone', label: 'Téléphone',
    column_name: ''
  },
  {
    value: 'adresse', label: 'Adresse',
    column_name: ''
  },
  {
    value: 'code_postal', label: 'Code postal',
    column_name: ''
  },
  {
    value: 'ville', label: 'Ville',
    column_name: ''
  },
  {
    value: 'pays', label: 'Pays',
    column_name: ''
  },
  {
    value: 'source', label: 'Source',
    column_name: ''
  },
  {
    value: 'notes', label: 'Notes',
    column_name: ''
  },
];

export const useColumnManagement = (userId: string | undefined) => {
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mémoïser les colonnes par défaut
  const defaultColumns = useMemo(() => DEFAULT_COLUMNS, []);

  // Charger les colonnes personnalisées
  const loadCustomColumns = useCallback(async () => {
    if (!userId) {
      setError('Utilisateur non connecté');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fileService.getCustomColumns(userId);
      setCustomColumns(data);
      setIsInitialized(true);
    } catch (err) {
      console.error('Erreur lors du chargement des colonnes personnalisées:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(`Échec du chargement des colonnes: ${errorMessage}`);
      toast.error('Impossible de charger les colonnes personnalisées');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Charger les colonnes au montage du composant
  useEffect(() => {
    if (!isInitialized && userId) {
      loadCustomColumns();
    }
  }, [isInitialized, loadCustomColumns, userId]);

  // Obtenir toutes les colonnes (défaut + personnalisées) avec mémoïsation
  const allColumns = useMemo(() => {
    if (isLoading) return defaultColumns;
    
    const customLeadColumns = customColumns.map(col => ({
      value: col.column_name,
      label: col.display_name,
      isCustom: true
    }));

    return [...defaultColumns, ...customLeadColumns];
  }, [customColumns, defaultColumns, isLoading]);

  // Normaliser le nom de colonne
  const normalizeColumnName = useCallback((name: string): string => {
    return name.trim().toLowerCase().replace(/\s+/g, '_');
  }, []);

  // Vérifier si une colonne existe déjà
  const columnExists = useCallback((name: string): boolean => {
    const normalized = normalizeColumnName(name);
    return allColumns.some(
      col => col.value === normalized || col.label.toLowerCase() === name.trim().toLowerCase()
    );
  }, [allColumns, normalizeColumnName]);

  // Ajouter une nouvelle colonne personnalisée
  const addCustomColumn = useCallback(async (columnName: string): Promise<boolean> => {
    if (!userId) {
      toast.error('Vous devez être connecté pour ajouter des colonnes personnalisées');
      return false;
    }

    const trimmedName = columnName.trim();
    if (!trimmedName) {
      toast.error('Le nom de la colonne ne peut pas être vide');
      return false;
    }

    if (columnExists(trimmedName)) {
      toast.error('Une colonne avec ce nom existe déjà');
      return false;
    }

    const newColumn = {
      column_name: normalizeColumnName(trimmedName),
      display_name: trimmedName,
      user_id: userId
    };

    try {
      const savedColumn = await fileService.addCustomColumn(newColumn);
      setCustomColumns(prev => [...prev, savedColumn]);
      toast.success(`Colonne "${savedColumn.display_name}" ajoutée avec succès`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la colonne personnalisée:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Échec de l'ajout: ${errorMessage}`);
      return false;
    }
  }, [userId, columnExists, normalizeColumnName]);

  // Mettre à jour une colonne existante
  const updateCustomColumn = useCallback(async (
    columnId: string, 
    updates: Partial<Omit<CustomColumn, 'id' | 'user_id'>>
  ): Promise<boolean> => {
    try {
      const updatedColumn = await fileService.updateCustomColumn(columnId, updates);
      setCustomColumns(prev => 
        prev.map(col => col.id === columnId ? { ...col, ...updatedColumn } : col)
      );
      toast.success('Colonne mise à jour avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la colonne:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Échec de la mise à jour: ${errorMessage}`);
      return false;
    }
  }, []);

  // Supprimer une colonne personnalisée
  const deleteCustomColumn = useCallback(async (columnId: string): Promise<boolean> => {
    try {
      await fileService.deleteCustomColumn(columnId);
      setCustomColumns(prev => prev.filter(col => col.id !== columnId));
      toast.success('Colonne supprimée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la colonne:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Échec de la suppression: ${errorMessage}`);
      return false;
    }
  }, []);

  return {
    // Données
    customColumns,
    defaultColumns,
    allColumns,
    
    // États
    isLoading,
    error,
    isInitialized,
    
    // Méthodes
    addCustomColumn,
    updateCustomColumn,
    deleteCustomColumn,
    refresh: loadCustomColumns,
    columnExists,
    normalizeColumnName
  };
};
