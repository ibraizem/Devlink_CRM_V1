import { SupabaseClient } from '@supabase/supabase-js';

export abstract class BaseRepository<T> {
  constructor(
    protected readonly supabase: SupabaseClient,
    protected readonly tableName: string
  ) {}

  // Méthodes de base CRUD
  protected async getAll(columns = '*'): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(columns);
    
    if (error) throw error;
    return data as T[];
  }

  protected async getById(id: string, columns = '*'): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(columns)
      .eq('id', id)
      .single();

    if (error) return null;
    return data as T;
  }

  protected async create(data: Omit<T, 'id' | 'created_at'>): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result as T;
  }

  protected async update(id: string, data: Partial<T>): Promise<T> {
    const { data: result, error } = await this.supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result as T;
  }

  protected async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
