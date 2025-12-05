'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'

type BaseColumnDefinition = {
  key: string
  label: string
  isVisible?: boolean
  isCustom?: boolean
  accessorKey?: string
  header?: string | ((props: any) => React.ReactNode)
  cell?: (props: any) => React.ReactNode
}

type ColumnDefinition = BaseColumnDefinition & {
  isVisible?: boolean
  isCustom?: boolean
}
import { userColumnsService, UserColumn } from '@/lib/api/leads/userColumns';
import { createClient } from '@/lib/utils/supabase/client';

interface ColumnConfigContextType {
  availableColumns: ColumnDefinition[];
  visibleColumns: string[];
  customColumns: UserColumn[];
  isLoading: boolean;
  updateColumnVisibility: (columns: string[]) => void;
  reorderColumns: (newOrder: string[]) => Promise<boolean>;
  resetToDefault: () => void;
  setAvailableColumns: (columns: ColumnDefinition[]) => Promise<boolean>;
}

const defaultColumns: ColumnDefinition[] = [
  { key: 'prenom', label: 'Prénom', isVisible: true, accessorKey: 'prenom', header: 'Prénom' },
  { key: 'nom', label: 'Nom', isVisible: true, accessorKey: 'nom', header: 'Nom' },
  { key: 'entreprise', label: 'Entreprise', isVisible: true, accessorKey: 'entreprise', header: 'Entreprise' },
  { key: 'telephone', label: 'Téléphone', isVisible: true, accessorKey: 'telephone', header: 'Téléphone' },
  { key: 'email', label: 'Email', isVisible: true, accessorKey: 'email', header: 'Email' },
  { key: 'statut', label: 'Statut', isVisible: true, accessorKey: 'statut', header: 'Statut' },
  { key: 'priorite', label: 'Priorité', isVisible: true, accessorKey: 'priorite', header: 'Priorité' },
  { key: 'prochain_rappel', label: 'Prochain rappel', isVisible: false, accessorKey: 'prochain_rappel', header: 'Prochain rappel' },
];

const ColumnConfigContext = createContext<ColumnConfigContextType | undefined>(undefined);

export const ColumnConfigProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [availableColumns, setAvailableColumns] = useState<ColumnDefinition[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [customColumns, setCustomColumns] = useState<UserColumn[]>([]);

  // Charger les colonnes au montage
  useEffect(() => {
    const loadColumns = async () => {
      try {
        setIsLoading(true);
        
        // Charger les colonnes personnalisées depuis Supabase
        const userColumns = await userColumnsService.getUserColumns();
        setCustomColumns(userColumns);
        
        // Combiner les colonnes par défaut et personnalisées
        const customColumnDefs = userColumnsService.toColumnDefinitions(userColumns);
        const allColumns = [...defaultColumns, ...customColumnDefs];
        
        // Charger les préférences de visibilité depuis le localStorage
        let visibleCols: string[] = [];
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('visibleLeadColumns');
          visibleCols = saved ? JSON.parse(saved) : 
            allColumns.filter(col => col.isVisible).map(col => col.key);
        } else {
          visibleCols = allColumns.filter(col => col.isVisible).map(col => col.key);
        }
        
        setAvailableColumns(allColumns);
        setVisibleColumns(visibleCols);
      } catch (error) {
        console.error('Erreur lors du chargement des colonnes:', error);
        // En cas d'erreur, utiliser les valeurs par défaut
        setAvailableColumns(defaultColumns);
        setVisibleColumns(defaultColumns.filter(col => col.isVisible).map(col => col.key));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadColumns();
    
    // Écouter les changements d'authentification
    const { data: { subscription } } = createClient().auth.onAuthStateChange(() => {
      loadColumns();
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const updateColumnVisibility = useCallback((newVisibleColumns: string[]) => {
    setVisibleColumns(newVisibleColumns);
    if (typeof window !== 'undefined') {
      localStorage.setItem('visibleLeadColumns', JSON.stringify(newVisibleColumns));
    }
  }, []);

  const resetToDefault = useCallback(async () => {
    try {
      // Supprimer toutes les colonnes personnalisées de l'utilisateur
      const { data: { user } } = await createClient().auth.getUser();
      if (user) {
        const { error } = await createClient()
          .from('user_custom_columns')
          .delete()
          .eq('user_id', user.id);
          
        if (error) throw error;
      }
      
      // Réinitialiser les colonnes visibles
      const defaultVisible = defaultColumns
        .filter(col => col.isVisible)
        .map(col => col.key);
        
      setAvailableColumns(defaultColumns);
      setVisibleColumns(defaultVisible);
      setCustomColumns([]);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('visibleLeadColumns', JSON.stringify(defaultVisible));
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des colonnes:', error);
    }
  }, []);

  const updateAvailableColumns = useCallback(async (columns: ColumnDefinition[]) => {
    try {
      setIsLoading(true);
      
      // Filtrer uniquement les colonnes personnalisées
      const customColumns = columns.filter(col => col.isCustom);
      
      // Synchroniser avec Supabase
      const syncedColumns = await userColumnsService.syncUserColumns(customColumns);
      
      // Mettre à jour l'état local
      const mergedColumns = [...defaultColumns, ...syncedColumns];
      
      setAvailableColumns(mergedColumns);
      setCustomColumns(syncedColumns.map(col => ({
        id: '', // L'ID sera généré par Supabase
        user_id: '', // Sera défini par le service
        column_name: col.key,
        display_name: col.label,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
      
      // Mettre à jour les colonnes visibles pour inclure les nouvelles colonnes
      setVisibleColumns(prev => {
        const newVisible = [...prev];
        mergedColumns.forEach(col => {
          if (!newVisible.includes(col.key) && col.isVisible) {
            newVisible.push(col.key);
          }
        });
        return newVisible;
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des colonnes:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const reorderColumns = useCallback(async (newOrder: string[]): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Vérifier que toutes les colonnes visibles sont incluses dans le nouvel ordre
      const allColumns = [...availableColumns];
      const missingColumns = visibleColumns.filter(col => !newOrder.includes(col));
      const finalOrder = [...newOrder, ...missingColumns];
      
      // Mettre à jour l'ordre des colonnes visibles
      setVisibleColumns(finalOrder);
      
      // Sauvegarder la préférence dans le localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('visibleLeadColumns', JSON.stringify(finalOrder));
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du réordonnancement des colonnes:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [availableColumns, visibleColumns]);

  return (
    <ColumnConfigContext.Provider 
      value={{
        availableColumns,
        visibleColumns,
        customColumns,
        isLoading,
        updateColumnVisibility,
        reorderColumns,
        resetToDefault,
        setAvailableColumns: updateAvailableColumns
      }}
    >
      {children}
    </ColumnConfigContext.Provider>
  );
};

export const useColumnConfig = () => {
  const context = useContext(ColumnConfigContext);
  if (context === undefined) {
    throw new Error('useColumnConfig must be used within a ColumnConfigProvider');
  }
  return context;
};
