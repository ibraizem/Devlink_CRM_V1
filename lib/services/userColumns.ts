import { supabase } from '@/lib/supabase/client';

// Définition du type pour les colonnes personnalisées
export interface CustomColumn extends Omit<UserColumn, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  isCustom: boolean;
  accessorKey?: string;
}

export interface UserColumn {
  id: string;
  user_id: string;
  name: string;
  key: string;
  is_visible: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  isVisible?: boolean;
  isCustom?: boolean;
  accessorKey?: string;
  // Ajout des propriétés manquantes pour la compatibilité avec le reste du code
  id?: string;
  user_id?: string;
  order?: number;
  header?: string | ((props: any) => React.ReactNode);
  cell?: (props: any) => React.ReactNode;
}

export const userColumnsService = {
  async getUserColumns(userId: string): Promise<UserColumn[]> {
    const { data, error } = await supabase
      .from('user_columns')
      .select('*')
      .eq('user_id', userId)
      .order('order', { ascending: true });

    if (error || !data) {
      console.error('Error fetching user columns:', error || 'No data returned');
      return [];
    }

    return data;
  },

  async updateUserColumns(userId: string, columns: Partial<UserColumn>[]): Promise<UserColumn[]> {
    const { data, error } = await supabase
      .from('user_columns')
      .upsert(columns.map(col => ({
        ...col,
        user_id: userId,
        updated_at: new Date().toISOString(),
      })));

    if (error || !data) {
      console.error('Error updating user columns:', error || 'No data returned');
      return [];
    }

    return data;
  },

  async resetToDefault(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_columns')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting user columns:', error);
      return false;
    }

    return true;
  },

  toColumnDefinitions(columns: UserColumn[]): ColumnDefinition[] {
    return columns.map(col => ({
      key: col.key,
      label: col.name,
      isVisible: col.is_visible,
      isCustom: true,
      accessorKey: col.key,
      header: col.name
    }));
  },

  async syncUserColumns(columns: ColumnDefinition[], userId: string): Promise<ColumnDefinition[]> {
    // Convertir les définitions de colonnes en format pour la base de données
    const columnsToSync = columns.map((col, index) => ({
      user_id: userId,
      name: col.label,
      key: col.key,
      is_visible: col.isVisible ?? true,
      order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Mettre à jour la base de données
    const { data, error } = await supabase
      .from('user_columns')
      .upsert(columnsToSync)
      .select();

    if (error) {
      console.error('Error syncing user columns:', error);
      throw error;
    }

    // Retourner les colonnes mises à jour
    return data.map(col => ({
      key: col.key,
      label: col.name,
      isVisible: col.is_visible,
      isCustom: true,
      accessorKey: col.key,
      header: col.name
    }));
  }
};
