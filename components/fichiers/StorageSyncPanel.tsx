'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { storageSyncService } from '@/lib/services/storageSyncService'
import type { StorageFile } from '@/lib/types/storage-sync'
import { RefreshCw, FileText, Download, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface StorageSyncPanelProps {
  onSelectFile: (file: StorageFile) => void
}

export function StorageSyncPanel({ onSelectFile }: StorageSyncPanelProps) {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [stats, setStats] = useState({ total: 0, imported: 0, pending: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
    loadStats()
  }, [])

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      const data = await storageSyncService.getUnimportedFiles()
      setFiles(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des fichiers')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await storageSyncService.getSyncStats()
      setStats(data)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleDetectNewFiles = async () => {
    try {
      setIsDetecting(true)
      const newFiles = await storageSyncService.detectNewFiles()
      
      if (newFiles.length > 0) {
        toast.success(`${newFiles.length} nouveau(x) fichier(s) détecté(s)`)
        await loadFiles()
        await loadStats()
      } else {
        toast.info('Aucun nouveau fichier détecté')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la détection des fichiers')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleSelectFile = (file: StorageFile) => {
    setSelectedFile(file.id)
    onSelectFile(file)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(2)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Fichiers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Importés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.imported}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fichiers non importés</CardTitle>
              <CardDescription>Sélectionnez un fichier pour lancer l'import</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadFiles}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              <Button
                onClick={handleDetectNewFiles}
                disabled={isDetecting}
                size="sm"
              >
                <Download className={`h-4 w-4 mr-2 ${isDetecting ? 'animate-pulse' : ''}`} />
                Détecter nouveaux
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun fichier en attente d'import. Cliquez sur "Détecter nouveaux" pour scanner le bucket Storage.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedFile === file.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectFile(file)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="font-medium">{file.nom_fichier}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                          <span>{formatFileSize(file.taille)}</span>
                          <span>•</span>
                          <span>{file.content_type || 'Type inconnu'}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Détecté le {format(new Date(file.derniere_detection), 'PPp', { locale: fr })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.est_importe ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Importé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
