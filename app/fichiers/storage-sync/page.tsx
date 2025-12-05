'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StorageSyncPanel } from '@/components/fichiers/StorageSyncPanel'
import { ImportPreviewModal } from '@/components/fichiers/ImportPreviewModal'
import { ImportWizard } from '@/components/fichiers/ImportWizard'
import { ImportHistoryPanel } from '@/components/fichiers/ImportHistoryPanel'
import { SavedMappingsPanel } from '@/components/fichiers/SavedMappingsPanel'
import type { StorageFile, FilePreview, ColumnMapping } from '@/lib/types/storage-sync'
import dynamic from 'next/dynamic'
import { FileSync, History, Settings } from 'lucide-react'

const Sidebar = dynamic(() => import('@/components/Sidebar'), {
  ssr: false,
  loading: () => <div>Chargement...</div>
})

export default function StorageSyncPage() {
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [activeTab, setActiveTab] = useState('sync')

  const handleFileSelect = (file: StorageFile) => {
    setSelectedFile(file)
    setIsPreviewOpen(true)
  }

  const handleConfirmImport = (file: StorageFile, preview: FilePreview) => {
    setSelectedFile(file)
    setFilePreview(preview)
    setIsPreviewOpen(false)
    setIsImporting(true)
  }

  const handleImportComplete = () => {
    setIsImporting(false)
    setSelectedFile(null)
    setFilePreview(null)
    setActiveTab('history')
  }

  const handleImportCancel = () => {
    setIsImporting(false)
    setSelectedFile(null)
    setFilePreview(null)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-6 md:p-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Synchronisation Storage
            </h1>
            <p className="text-gray-600">
              Importez automatiquement les fichiers depuis votre bucket Supabase Storage
            </p>
          </div>

          {isImporting && selectedFile && filePreview ? (
            <ImportWizard
              file={selectedFile}
              preview={filePreview}
              onComplete={handleImportComplete}
              onCancel={handleImportCancel}
            />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="sync" className="flex items-center gap-2">
                  <FileSync className="h-4 w-4" />
                  Synchronisation
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historique
                </TabsTrigger>
                <TabsTrigger value="mappings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Mappings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sync" className="space-y-6">
                <StorageSyncPanel onSelectFile={handleFileSelect} />
              </TabsContent>

              <TabsContent value="history">
                <ImportHistoryPanel />
              </TabsContent>

              <TabsContent value="mappings">
                <SavedMappingsPanel 
                  onSelectMapping={(mapping: ColumnMapping) => {
                    console.log('Mapping sélectionné:', mapping)
                  }} 
                />
              </TabsContent>
            </Tabs>
          )}

          <ImportPreviewModal
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            file={selectedFile}
            onConfirmImport={handleConfirmImport}
          />
        </div>
      </div>
    </div>
  )
}
