import { createClient } from '@/lib/utils/supabase/client'
import type { StorageFile, FilePreview, ColumnMappingField } from '@/lib/types/storage-sync'
import * as XLSX from 'xlsx'
import * as Papa from 'papaparse'

const supabase = createClient()

export const storageSyncService = {
  /**
   * Détecte les nouveaux fichiers dans le bucket Supabase Storage
   */
  async detectNewFiles(bucketName: string = 'fichiers'): Promise<StorageFile[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data: files, error: listError } = await supabase
        .storage
        .from(bucketName)
        .list(user.id, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (listError) throw listError

      if (!files || files.length === 0) {
        return []
      }

      const { data: existingFiles } = await supabase
        .from('storage_files')
        .select('storage_path')
        .eq('bucket_name', bucketName)
        .eq('user_id', user.id)

      const existingPaths = new Set(existingFiles?.map(f => f.storage_path) || [])

      const newFiles: StorageFile[] = []

      for (const file of files) {
        const fullPath = `${user.id}/${file.name}`
        
        if (!existingPaths.has(fullPath)) {
          const { data: insertedFile, error: insertError } = await supabase
            .from('storage_files')
            .insert({
              storage_path: fullPath,
              bucket_name: bucketName,
              nom_fichier: file.name,
              taille: file.metadata?.size,
              content_type: file.metadata?.mimetype,
              est_importe: false,
              user_id: user.id
            })
            .select()
            .single()

          if (!insertError && insertedFile) {
            newFiles.push(insertedFile)
          }
        }
      }

      return newFiles
    } catch (error) {
      console.error('Erreur lors de la détection des fichiers:', error)
      throw error
    }
  },

  /**
   * Récupère tous les fichiers non importés
   */
  async getUnimportedFiles(): Promise<StorageFile[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data, error } = await supabase
        .from('storage_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('est_importe', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers non importés:', error)
      throw error
    }
  },

  /**
   * Prévisualise un fichier depuis le Storage
   */
  async previewFile(storageFile: StorageFile, maxRows: number = 50): Promise<FilePreview> {
    try {
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from(storageFile.bucket_name)
        .download(storageFile.storage_path)

      if (downloadError) throw downloadError
      if (!fileData) throw new Error('Fichier introuvable')

      const isExcel = storageFile.content_type?.includes('spreadsheet') || 
                      storageFile.nom_fichier.match(/\.(xlsx|xls)$/i)

      let rows: Record<string, any>[] = []
      let columns: string[] = []

      if (isExcel) {
        const arrayBuffer = await fileData.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
        
        if (jsonData.length > 0) {
          columns = jsonData[0].map(col => String(col || ''))
          rows = jsonData.slice(1, maxRows + 1).map(row => {
            const obj: Record<string, any> = {}
            columns.forEach((col, idx) => {
              obj[col] = row[idx] || ''
            })
            return obj
          })
        }
      } else {
        const text = await fileData.text()
        const parsed = Papa.parse(text, {
          header: true,
          preview: maxRows,
          skipEmptyLines: true
        })
        
        rows = parsed.data as Record<string, any>[]
        columns = parsed.meta.fields || []
      }

      const suggestedMapping = this.suggestColumnMapping(columns)

      return {
        columns,
        rows,
        totalRows: rows.length,
        suggestedMapping
      }
    } catch (error) {
      console.error('Erreur lors de la prévisualisation du fichier:', error)
      throw error
    }
  },

  /**
   * Suggère un mapping intelligent des colonnes
   */
  suggestColumnMapping(columns: string[]): Record<string, ColumnMappingField> {
    const mapping: Record<string, ColumnMappingField> = {}
    
    const patterns: Record<string, { target: string; type: ColumnMappingField['type'] }> = {
      'nom|name|lastname|surname': { target: 'nom', type: 'text' },
      'prenom|firstname|prenom': { target: 'prenom', type: 'text' },
      'email|e-mail|mail|courriel': { target: 'email', type: 'email' },
      'tel|telephone|phone|mobile|portable': { target: 'telephone', type: 'phone' },
      'entreprise|company|societe|organization': { target: 'entreprise', type: 'text' },
      'adresse|address|rue|street': { target: 'adresse', type: 'text' },
      'ville|city|town': { target: 'ville', type: 'text' },
      'code.?postal|zip|postal': { target: 'code_postal', type: 'text' },
      'pays|country': { target: 'pays', type: 'text' },
      'statut|status|etat|state': { target: 'statut', type: 'text' },
      'montant|amount|prix|price': { target: 'montant', type: 'number' },
      'date|created|cree': { target: 'date', type: 'date' },
      'notes|commentaire|comment|description': { target: 'notes', type: 'text' }
    }

    columns.forEach(col => {
      const normalizedCol = col.toLowerCase().trim()
      
      for (const [pattern, config] of Object.entries(patterns)) {
        const regex = new RegExp(pattern, 'i')
        if (regex.test(normalizedCol)) {
          mapping[col] = {
            source_column: col,
            target_column: config.target,
            type: config.type,
            required: ['nom', 'email', 'telephone'].includes(config.target),
            transform: 'trim'
          }
          break
        }
      }

      if (!mapping[col]) {
        mapping[col] = {
          source_column: col,
          target_column: col.toLowerCase().replace(/\s+/g, '_'),
          type: 'text',
          required: false,
          transform: 'trim'
        }
      }
    })

    return mapping
  },

  /**
   * Calcule le hash d'une ligne pour la détection de doublons
   */
  async calculateRowHash(data: Record<string, any>, fields: string[]): Promise<string> {
    const values = fields.map(field => String(data[field] || '').toLowerCase().trim()).join('|')
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(values)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  },

  /**
   * Marque un fichier comme importé
   */
  async markAsImported(storageFileId: string, fichierImportId: string, importHistoryId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('storage_files')
        .update({
          est_importe: true,
          fichier_id: fichierImportId,
          import_history_id: importHistoryId
        })
        .eq('id', storageFileId)

      if (error) throw error
    } catch (error) {
      console.error('Erreur lors de la mise à jour du fichier:', error)
      throw error
    }
  },

  /**
   * Récupère les statistiques de synchronisation
   */
  async getSyncStats(): Promise<{
    total: number
    imported: number
    pending: number
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { count: total } = await supabase
        .from('storage_files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: imported } = await supabase
        .from('storage_files')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('est_importe', true)

      return {
        total: total || 0,
        imported: imported || 0,
        pending: (total || 0) - (imported || 0)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  }
}
