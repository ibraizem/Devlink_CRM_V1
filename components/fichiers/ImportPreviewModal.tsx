'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { StorageFile, FilePreview } from '@/lib/types/storage-sync'
import { storageSyncService } from '@/lib/services/storageSyncService'
import { Loader2, FileText, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { ColumnMappingEditor } from './ColumnMappingEditor'

interface ImportPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  file: StorageFile | null
  onConfirmImport: (file: StorageFile, preview: FilePreview) => void
}

export function ImportPreviewModal({
  isOpen,
  onClose,
  file,
  onConfirmImport
}: ImportPreviewModalProps) {
  const [preview, setPreview] = useState<FilePreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('preview')

  useEffect(() => {
    if (isOpen && file) {
      loadPreview()
    } else {
      setPreview(null)
      setActiveTab('preview')
    }
  }, [isOpen, file])

  const loadPreview = async () => {
    if (!file) return

    try {
      setIsLoading(true)
      const data = await storageSyncService.previewFile(file)
      setPreview(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement de la prévisualisation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = () => {
    if (file && preview) {
      onConfirmImport(file, preview)
    }
  }

  const handleMappingUpdate = (newMapping: any) => {
    if (preview) {
      setPreview({
        ...preview,
        suggestedMapping: newMapping
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Prévisualisation - {file?.nom_fichier}
          </DialogTitle>
          <DialogDescription>
            Vérifiez les données et configurez le mapping avant l'import
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : preview ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">
                <FileText className="h-4 w-4 mr-2" />
                Aperçu des données
              </TabsTrigger>
              <TabsTrigger value="mapping">
                <Settings className="h-4 w-4 mr-2" />
                Configuration mapping
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{preview.totalRows}</span> lignes détectées
                  <span className="mx-2">•</span>
                  <span className="font-medium">{preview.columns.length}</span> colonnes
                </div>
                <Badge variant="outline">{preview.rows.length} premières lignes</Badge>
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">#</th>
                        {preview.columns.map(col => (
                          <th key={col} className="px-4 py-3 text-left font-medium text-gray-700 border-b whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                          {preview.columns.map(col => (
                            <td key={col} className="px-4 py-2 text-gray-900 whitespace-nowrap">
                              {String(row[col] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="mapping">
              <ColumnMappingEditor
                columns={preview.columns}
                initialMapping={preview.suggestedMapping || {}}
                onMappingChange={handleMappingUpdate}
              />
            </TabsContent>
          </Tabs>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!preview}>
            Continuer l'import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
