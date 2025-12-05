import { createClient } from '@/lib/utils/supabase/client'
import type { ColumnMapping, ColumnMappingField } from '@/lib/types/storage-sync'

const supabase = createClient()

export const columnMappingService = {
  /**
   * Crée un nouveau mapping de colonnes réutilisable
   */
  async createMapping(
    nom: string,
    mapping: Record<string, ColumnMappingField>,
    description?: string
  ): Promise<ColumnMapping> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data, error } = await supabase
        .from('column_mappings')
        .insert({
          nom,
          description,
          mapping,
          user_id: user.id
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la création du mapping:', error)
      throw error
    }
  },

  /**
   * Récupère tous les mappings de l'utilisateur
   */
  async getMappings(): Promise<ColumnMapping[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data, error } = await supabase
        .from('column_mappings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des mappings:', error)
      throw error
    }
  },

  /**
   * Récupère un mapping par son ID
   */
  async getMapping(id: string): Promise<ColumnMapping> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data, error } = await supabase
        .from('column_mappings')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération du mapping:', error)
      throw error
    }
  },

  /**
   * Met à jour un mapping existant
   */
  async updateMapping(
    id: string,
    updates: Partial<Omit<ColumnMapping, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<ColumnMapping> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data, error } = await supabase
        .from('column_mappings')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mapping:', error)
      throw error
    }
  },

  /**
   * Supprime un mapping
   */
  async deleteMapping(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { error } = await supabase
        .from('column_mappings')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    } catch (error) {
      console.error('Erreur lors de la suppression du mapping:', error)
      throw error
    }
  },

  /**
   * Duplique un mapping existant
   */
  async duplicateMapping(id: string, nouveauNom: string): Promise<ColumnMapping> {
    try {
      const mapping = await this.getMapping(id)
      
      return await this.createMapping(
        nouveauNom,
        mapping.mapping,
        `Copie de: ${mapping.description || mapping.nom}`
      )
    } catch (error) {
      console.error('Erreur lors de la duplication du mapping:', error)
      throw error
    }
  },

  /**
   * Valide un mapping
   */
  validateMapping(mapping: Record<string, ColumnMappingField>): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const targetColumns = new Set<string>()

    for (const [sourceCol, config] of Object.entries(mapping)) {
      if (!config.source_column || !config.target_column) {
        errors.push(`Configuration incomplète pour la colonne "${sourceCol}"`)
        continue
      }

      if (targetColumns.has(config.target_column)) {
        errors.push(`La colonne cible "${config.target_column}" est utilisée plusieurs fois`)
      }
      targetColumns.add(config.target_column)

      if (config.type === 'email' && config.required) {
        // OK
      } else if (config.type === 'phone' && config.required) {
        // OK
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Applique un mapping sur des données
   */
  applyMapping(
    data: Record<string, any>[],
    mapping: Record<string, ColumnMappingField>
  ): { 
    success: Record<string, any>[]
    errors: Array<{ index: number; error: string; data: Record<string, any> }>
  } {
    const success: Record<string, any>[] = []
    const errors: Array<{ index: number; error: string; data: Record<string, any> }> = []

    data.forEach((row, index) => {
      try {
        const transformed: Record<string, any> = {}

        for (const [sourceCol, config] of Object.entries(mapping)) {
          let value = row[sourceCol]

          if (value === undefined || value === null || value === '') {
            if (config.required) {
              throw new Error(`Champ requis manquant: ${sourceCol}`)
            }
            value = config.default_value || ''
          }

          if (config.transform && value) {
            switch (config.transform) {
              case 'uppercase':
                value = String(value).toUpperCase()
                break
              case 'lowercase':
                value = String(value).toLowerCase()
                break
              case 'trim':
                value = String(value).trim()
                break
              case 'capitalize':
                value = String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase()
                break
            }
          }

          transformed[config.target_column] = value
        }

        success.push(transformed)
      } catch (error) {
        errors.push({
          index,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          data: row
        })
      }
    })

    return { success, errors }
  }
}
