import { useState, useEffect } from 'react'
import { storageSyncService } from '@/lib/services/storageSyncService'
import { importService } from '@/lib/services/importService'
import type { StorageFile, ImportHistory, ImportProgress } from '@/lib/types/storage-sync'

export function useStorageSync() {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [history, setHistory] = useState<ImportHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, imported: 0, pending: 0 })

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      const data = await storageSyncService.getUnimportedFiles()
      setFiles(data)
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const data = await importService.getImportHistory()
      setHistory(data)
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
      throw error
    }
  }

  const loadStats = async () => {
    try {
      const data = await storageSyncService.getSyncStats()
      setStats(data)
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error)
      throw error
    }
  }

  const detectNewFiles = async () => {
    try {
      const newFiles = await storageSyncService.detectNewFiles()
      await loadFiles()
      await loadStats()
      return newFiles
    } catch (error) {
      console.error('Erreur lors de la détection:', error)
      throw error
    }
  }

  const refresh = async () => {
    await Promise.all([loadFiles(), loadHistory(), loadStats()])
  }

  useEffect(() => {
    refresh()
  }, [])

  return {
    files,
    history,
    stats,
    isLoading,
    loadFiles,
    loadHistory,
    loadStats,
    detectNewFiles,
    refresh
  }
}
