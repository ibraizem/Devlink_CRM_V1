import { createClient } from '@/lib/utils/supabase/client';
import { ColumnDefinition } from '@/hooks/useFileMapping';

const supabase = createClient();

export interface UserColumn {
  id: string;
  user_id: string;
  column_name: string;
  display_name: string;
  created_at?: string;
  updated_at?: string;
}

export const userColumnsService = {
  /**
   * Récupère toutes les colonnes personnalisées de l'utilisateur connecté
   */
  async getUserColumns(): Promise<UserColumn[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_custom_columns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erreur lors de la récupération des colonnes personnalisées:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Ajoute ou met à jour une colonne personnalisée
   */
  async upsertUserColumn(column: Omit<UserColumn, 'id' | 'created_at' | 'updated_at'>): Promise<UserColumn | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const columnData = {
      ...column,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_custom_columns')
      .upsert(columnData, { onConflict: 'user_id,column_name' })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de la colonne personnalisée:', error);
      return null;
    }

    return data;
  },

  /**
   * Supprime une colonne personnalisée
   */
  async deleteUserColumn(columnName: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_custom_columns')
      .delete()
      .eq('user_id', user.id)
      .eq('column_name', columnName);

    if (error) {
      console.error('Erreur lors de la suppression de la colonne personnalisée:', error);
      return false;
    }

    return true;
  },

  /**
   * Convertit les colonnes utilisateur en format ColumnDefinition
   */
  toColumnDefinitions(columns: UserColumn[]): ColumnDefinition[] {
    return columns.map(col => ({
      key: col.column_name,
      label: col.display_name,
      isCustom: true,
      isVisible: true
    }));
  },

  /**
   * Synchronise les colonnes personnalisées avec la base de données
   */
  async syncUserColumns(columns: ColumnDefinition[]): Promise<ColumnDefinition[]> {
    const customColumns = columns.filter(col => col.isCustom);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return [];

    // Récupère les colonnes existantes
    const existingColumns = await this.getUserColumns();
    
    // Supprime les colonnes qui n'existent plus
    const columnsToRemove = existingColumns.filter(
      col => !customColumns.some(c => c.key === col.column_name)
    );
    
    for (const col of columnsToRemove) {
      await this.deleteUserColumn(col.column_name);
    }

    // Ajoute ou met à jour les colonnes
    const results = await Promise.all(
      customColumns.map(col => 
        this.upsertUserColumn({
          user_id: user.id,
          column_name: col.key,
          display_name: col.label
        })
      )
    );

    // Retourne les définitions mises à jour
    return this.toColumnDefinitions(results.filter(Boolean) as UserColumn[]);
  }
};
