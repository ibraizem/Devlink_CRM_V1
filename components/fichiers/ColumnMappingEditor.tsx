'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ColumnMappingField } from '@/lib/types/storage-sync'
import { columnMappingService } from '@/lib/services/columnMappingService'
import { Save, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ColumnMappingEditorProps {
  columns: string[]
  initialMapping: Record<string, ColumnMappingField>
  onMappingChange: (mapping: Record<string, ColumnMappingField>) => void
}

export function ColumnMappingEditor({
  columns,
  initialMapping,
  onMappingChange
}: ColumnMappingEditorProps) {
  const [mapping, setMapping] = useState<Record<string, ColumnMappingField>>(initialMapping)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [mappingName, setMappingName] = useState('')

  useEffect(() => {
    const validation = columnMappingService.validateMapping(mapping)
    setValidationErrors(validation.errors)
  }, [mapping])

  const handleFieldChange = (
    column: string,
    field: keyof ColumnMappingField,
    value: any
  ) => {
    const updated = {
      ...mapping,
      [column]: {
        ...mapping[column],
        [field]: value
      }
    }
    setMapping(updated)
    onMappingChange(updated)
  }

  const handleSaveMapping = async () => {
    if (!mappingName.trim()) {
      toast.error('Veuillez entrer un nom pour ce mapping')
      return
    }

    try {
      setIsSaving(true)
      await columnMappingService.createMapping(mappingName, mapping, 'Mapping personnalisé')
      toast.success('Mapping sauvegardé avec succès')
      setMappingName('')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde du mapping')
    } finally {
      setIsSaving(false)
    }
  }

  const typeOptions = [
    { value: 'text', label: 'Texte' },
    { value: 'number', label: 'Nombre' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Téléphone' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Booléen' }
  ]

  const transformOptions = [
    { value: 'none', label: 'Aucune' },
    { value: 'trim', label: 'Trim (espaces)' },
    { value: 'uppercase', label: 'MAJUSCULES' },
    { value: 'lowercase', label: 'minuscules' },
    { value: 'capitalize', label: 'Capitalize' }
  ]

  return (
    <div className="space-y-4">
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sauvegarder ce mapping</CardTitle>
          <CardDescription className="text-xs">
            Enregistrez cette configuration pour la réutiliser plus tard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nom du mapping..."
              value={mappingName}
              onChange={e => setMappingName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveMapping} disabled={isSaving || !mappingName.trim()}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[400px] border rounded-lg p-4">
        <div className="space-y-6">
          {columns.map(column => {
            const config = mapping[column] || {
              source_column: column,
              target_column: column.toLowerCase().replace(/\s+/g, '_'),
              type: 'text' as const,
              required: false,
              transform: 'trim' as const
            }

            return (
              <Card key={column}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {column}
                    </CardTitle>
                    {config.required && (
                      <Badge variant="destructive" className="text-xs">
                        Requis
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Colonne cible</Label>
                      <Input
                        value={config.target_column}
                        onChange={e =>
                          handleFieldChange(column, 'target_column', e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Type de données</Label>
                      <Select
                        value={config.type}
                        onValueChange={value =>
                          handleFieldChange(column, 'type', value)
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Transformation</Label>
                      <Select
                        value={config.transform || 'none'}
                        onValueChange={value =>
                          handleFieldChange(
                            column,
                            'transform',
                            value === 'none' ? undefined : value
                          )
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {transformOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Valeur par défaut</Label>
                      <Input
                        value={config.default_value || ''}
                        onChange={e =>
                          handleFieldChange(column, 'default_value', e.target.value || undefined)
                        }
                        placeholder="Optionnel"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Label className="text-xs">Champ requis</Label>
                    <Switch
                      checked={config.required}
                      onCheckedChange={checked =>
                        handleFieldChange(column, 'required', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
