'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { columnMappingService } from '@/lib/services/columnMappingService'
import type { ColumnMapping } from '@/lib/types/storage-sync'
import { MoreVertical, Copy, Trash2, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface SavedMappingsPanelProps {
  onSelectMapping: (mapping: ColumnMapping) => void
}

export function SavedMappingsPanel({ onSelectMapping }: SavedMappingsPanelProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    loadMappings()
  }, [])

  const loadMappings = async () => {
    try {
      setIsLoading(true)
      const data = await columnMappingService.getMappings()
      setMappings(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des mappings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce mapping ?')) return

    try {
      await columnMappingService.deleteMapping(id)
      toast.success('Mapping supprimé')
      loadMappings()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleDuplicate = async (id: string, nom: string) => {
    try {
      await columnMappingService.duplicateMapping(id, `${nom} (copie)`)
      toast.success('Mapping dupliqué')
      loadMappings()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la duplication')
    }
  }

  const handleSelect = (mapping: ColumnMapping) => {
    setSelectedId(mapping.id)
    onSelectMapping(mapping)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mappings sauvegardés</CardTitle>
        <CardDescription>
          Sélectionnez un mapping existant pour l'appliquer à l'import
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : mappings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">Aucun mapping sauvegardé</p>
            <p className="text-xs mt-1">Créez un mapping dans la configuration de l'import</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {mappings.map(mapping => (
                <div
                  key={mapping.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedId === mapping.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelect(mapping)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{mapping.nom}</div>
                      {mapping.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {mapping.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {Object.keys(mapping.mapping).length} colonnes
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(mapping.created_at), 'PPp', { locale: fr })}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            handleDuplicate(mapping.id, mapping.nom)
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation()
                            handleDelete(mapping.id)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
