import { createClient } from '@/lib/utils/supabase/client'
import type { 
  ImportHistory, 
  ImportOptions, 
  ImportProgress, 
  StorageFile,
  DuplicateRecord,
  ImportError
} from '@/lib/types/storage-sync'
import { storageSyncService } from './storageSyncService'
import * as XLSX from 'xlsx'
import * as Papa from 'papaparse'

const supabase = createClient()

export const importService = {
  /**
   * Lance un import incrémental avec détection de doublons
   */
  async startImport(
    storageFile: StorageFile,
    options: ImportOptions,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportHistory> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non authentifié')

    let importHistory: ImportHistory | null = null

    try {
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from(storageFile.bucket_name)
        .download(storageFile.storage_path)

      if (downloadError) throw downloadError
      if (!fileData) throw new Error('Fichier introuvable')

      const rows = await this.parseFile(fileData, storageFile)

      const { data: historyData, error: historyError } = await supabase
        .from('import_history')
        .insert({
          fichier_id: storageFile.fichier_id,
          user_id: user.id,
          statut: 'en_cours',
          nb_lignes_total: rows.length,
          nb_lignes_importees: 0,
          nb_lignes_doublons: 0,
          nb_lignes_erreurs: 0,
          mapping_utilise: options.mapping,
          peut_rollback: true
        })
        .select()
        .single()

      if (historyError) throw historyError
      importHistory = historyData

      const { data: fichierImport, error: fichierError } = await supabase
        .from('fichiers_import')
        .insert({
          nom: storageFile.nom_fichier,
          chemin: storageFile.storage_path,
          statut: 'en_cours',
          nb_lignes: rows.length,
          nb_lignes_importees: 0,
          mapping_colonnes: options.mapping,
          user_id: user.id
        })
        .select()
        .single()

      if (fichierError) throw fichierError

      await supabase
        .from('import_history')
        .update({ fichier_id: fichierImport.id })
        .eq('id', importHistory.id)

      let imported = 0
      let duplicates = 0
      let errors = 0
      const errorList: ImportError[] = []
      const batchSize = options.batchSize || 100
      const existingHashes = new Set<string>()

      if (options.detectDuplicates && options.duplicateFields) {
        const { data: existingLeads } = await supabase
          .from('fichier_donnees')
          .select('donnees')
          .eq('fichier_id', fichierImport.id)

        if (existingLeads) {
          for (const lead of existingLeads) {
            const hash = await storageSyncService.calculateRowHash(lead.donnees, options.duplicateFields!)
            existingHashes.add(hash)
          }
        }
      }

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize)
        const transformedBatch: any[] = []
        const duplicateBatch: DuplicateRecord[] = []

        for (let j = 0; j < batch.length; j++) {
          const row = batch[j]
          const lineNumber = i + j + 1

          try {
            const transformedData = this.transformRow(row, options.mapping)

            if (options.detectDuplicates && options.duplicateFields) {
              const hash = await storageSyncService.calculateRowHash(transformedData, options.duplicateFields)
              
              if (existingHashes.has(hash)) {
                duplicates++
                duplicateBatch.push({
                  id: crypto.randomUUID(),
                  import_history_id: importHistory.id,
                  ligne_numero: lineNumber,
                  donnees: transformedData,
                  raison_doublon: `Doublon détecté sur les champs: ${options.duplicateFields.join(', ')}`,
                  hash_donnees: hash,
                  created_at: new Date().toISOString()
                })
                continue
              }
              
              existingHashes.add(hash)
            }

            transformedBatch.push({
              fichier_id: fichierImport.id,
              donnees: transformedData,
              statut: 'nouveau',
              user_id: user.id
            })
            imported++
          } catch (error) {
            errors++
            errorList.push({
              ligne: lineNumber,
              message: error instanceof Error ? error.message : 'Erreur inconnue',
              donnees: row
            })

            if (!options.skipErrors) {
              throw error
            }
          }
        }

        if (transformedBatch.length > 0) {
          const { error: insertError } = await supabase
            .from('fichier_donnees')
            .insert(transformedBatch)

          if (insertError) throw insertError
        }

        if (duplicateBatch.length > 0) {
          await supabase
            .from('duplicate_records')
            .insert(duplicateBatch)
        }

        const progress: ImportProgress = {
          total: rows.length,
          processed: Math.min(i + batchSize, rows.length),
          imported,
          duplicates,
          errors,
          percentage: Math.round((Math.min(i + batchSize, rows.length) / rows.length) * 100)
        }

        if (onProgress) {
          onProgress(progress)
        }
      }

      const { data: updatedHistory, error: updateError } = await supabase
        .from('import_history')
        .update({
          statut: errorList.length > 0 && !options.skipErrors ? 'erreur' : 'termine',
          nb_lignes_importees: imported,
          nb_lignes_doublons: duplicates,
          nb_lignes_erreurs: errors,
          erreurs: errorList
        })
        .eq('id', importHistory.id)
        .select()
        .single()

      if (updateError) throw updateError

      await supabase
        .from('fichiers_import')
        .update({
          statut: 'actif',
          nb_lignes_importees: imported
        })
        .eq('id', fichierImport.id)

      await storageSyncService.markAsImported(storageFile.id, fichierImport.id, importHistory.id)

      return updatedHistory
    } catch (error) {
      console.error('Erreur lors de l\'import:', error)
      
      if (importHistory) {
        await supabase
          .from('import_history')
          .update({
            statut: 'erreur',
            erreurs: [{
              ligne: 0,
              message: error instanceof Error ? error.message : 'Erreur inconnue'
            }]
          })
          .eq('id', importHistory.id)
      }

      throw error
    }
  },

  /**
   * Parse le fichier en fonction de son type
   */
  async parseFile(fileData: Blob, storageFile: StorageFile): Promise<Record<string, any>[]> {
    const isExcel = storageFile.content_type?.includes('spreadsheet') || 
                    storageFile.nom_fichier.match(/\.(xlsx|xls)$/i)

    if (isExcel) {
      const arrayBuffer = await fileData.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      return XLSX.utils.sheet_to_json(firstSheet)
    } else {
      const text = await fileData.text()
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true
      })
      return parsed.data as Record<string, any>[]
    }
  },

  /**
   * Transforme une ligne selon le mapping
   */
  transformRow(row: Record<string, any>, mapping: Record<string, any>): Record<string, any> {
    const transformed: Record<string, any> = {}

    for (const [sourceCol, config] of Object.entries(mapping)) {
      let value = row[sourceCol]

      if (value === undefined || value === null || value === '') {
        if (config.required) {
          throw new Error(`Le champ requis "${sourceCol}" est manquant`)
        }
        value = config.default_value || ''
      }

      if (config.transform) {
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

      switch (config.type) {
        case 'number':
          value = parseFloat(value) || 0
          break
        case 'email':
          if (value && !this.isValidEmail(value)) {
            throw new Error(`Email invalide: ${value}`)
          }
          break
        case 'phone':
          value = this.normalizePhone(value)
          break
        case 'date':
          if (value) {
            const date = new Date(value)
            if (isNaN(date.getTime())) {
              throw new Error(`Date invalide: ${value}`)
            }
            value = date.toISOString()
          }
          break
      }

      transformed[config.target_column] = value
    }

    return transformed
  },

  /**
   * Valide un email
   */
  isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  },

  /**
   * Normalise un numéro de téléphone
   */
  normalizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '')
  },

  /**
   * Effectue un rollback d'un import
   */
  async rollbackImport(importHistoryId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data: history, error: historyError } = await supabase
        .from('import_history')
        .select('*, fichier_id')
        .eq('id', importHistoryId)
        .eq('user_id', user.id)
        .single()

      if (historyError) throw historyError
      if (!history) throw new Error('Historique d\'import introuvable')
      if (!history.peut_rollback) throw new Error('Ce import ne peut pas être annulé')
      if (history.rollback_effectue) throw new Error('Ce import a déjà été annulé')

      const { error: deleteError } = await supabase
        .from('fichier_donnees')
        .delete()
        .eq('fichier_id', history.fichier_id)

      if (deleteError) throw deleteError

      const { error: updateError } = await supabase
        .from('import_history')
        .update({
          statut: 'annule',
          rollback_effectue: true,
          rollback_at: new Date().toISOString()
        })
        .eq('id', importHistoryId)

      if (updateError) throw updateError

      await supabase
        .from('fichiers_import')
        .update({ statut: 'inactif' })
        .eq('id', history.fichier_id)

      if (history.import_history_id) {
        await supabase
          .from('storage_files')
          .update({ est_importe: false, fichier_id: null, import_history_id: null })
          .eq('import_history_id', importHistoryId)
      }
    } catch (error) {
      console.error('Erreur lors du rollback:', error)
      throw error
    }
  },

  /**
   * Récupère l'historique des imports
   */
  async getImportHistory(limit: number = 50): Promise<ImportHistory[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data, error } = await supabase
        .from('import_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error)
      throw error
    }
  },

  /**
   * Récupère les doublons d'un import
   */
  async getDuplicates(importHistoryId: string): Promise<DuplicateRecord[]> {
    try {
      const { data, error } = await supabase
        .from('duplicate_records')
        .select('*')
        .eq('import_history_id', importHistoryId)
        .order('ligne_numero', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des doublons:', error)
      throw error
    }
  }
}
