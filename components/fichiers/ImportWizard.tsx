'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { StorageFile, FilePreview, ImportProgress, ColumnMapping } from '@/lib/types/storage-sync'
import { importService } from '@/lib/services/importService'
import { CheckCircle2, AlertCircle, Loader2, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { SavedMappingsPanel } from './SavedMappingsPanel'

interface ImportWizardProps {
  file: StorageFile
  preview: FilePreview
  onComplete: () => void
  onCancel: () => void
}

export function ImportWizard({ file, preview, onComplete, onCancel }: ImportWizardProps) {
  const [step, setStep] = useState<'config' | 'importing' | 'complete'>('config')
  const [detectDuplicates, setDetectDuplicates] = useState(true)
  const [duplicateFields, setDuplicateFields] = useState<string[]>(['email'])
  const [skipErrors, setSkipErrors] = useState(true)
  const [batchSize, setBatchSize] = useState(100)
  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [selectedMapping, setSelectedMapping] = useState<ColumnMapping | null>(null)

  const handleStartImport = async () => {
    try {
      setStep('importing')

      const mapping = selectedMapping?.mapping || preview.suggestedMapping || {}

      await importService.startImport(
        file,
        {
          mapping,
          detectDuplicates,
          duplicateFields: detectDuplicates ? duplicateFields : undefined,
          skipErrors,
          batchSize
        },
        setProgress
      )

      setStep('complete')
      toast.success('Import terminé avec succès')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'import')
      setStep('config')
    }
  }

  const availableFields = preview.columns

  return (
    <div className="space-y-6">
      {step === 'config' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuration de l'import
                  </CardTitle>
                  <CardDescription>
                    Configurez les options d'import pour {file.nom_fichier}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="detectDuplicates"
                        checked={detectDuplicates}
                        onCheckedChange={checked => setDetectDuplicates(checked as boolean)}
                      />
                      <Label htmlFor="detectDuplicates" className="cursor-pointer">
                        Détecter les doublons
                      </Label>
                    </div>

                    {detectDuplicates && (
                      <div className="ml-6 space-y-3">
                        <Label className="text-sm text-gray-600">
                          Champs à comparer pour la détection
                        </Label>
                        <div className="space-y-2">
                          {availableFields.map(field => (
                            <div key={field} className="flex items-center space-x-2">
                              <Checkbox
                                id={`field-${field}`}
                                checked={duplicateFields.includes(field)}
                                onCheckedChange={checked => {
                                  if (checked) {
                                    setDuplicateFields([...duplicateFields, field])
                                  } else {
                                    setDuplicateFields(duplicateFields.filter(f => f !== field))
                                  }
                                }}
                              />
                              <Label htmlFor={`field-${field}`} className="cursor-pointer text-sm">
                                {field}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skipErrors"
                        checked={skipErrors}
                        onCheckedChange={checked => setSkipErrors(checked as boolean)}
                      />
                      <Label htmlFor="skipErrors" className="cursor-pointer">
                        Ignorer les lignes avec des erreurs
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batchSize">
                        Taille des lots (lignes par batch)
                      </Label>
                      <Input
                        id="batchSize"
                        type="number"
                        min={10}
                        max={1000}
                        value={batchSize}
                        onChange={e => setBatchSize(parseInt(e.target.value) || 100)}
                      />
                      <p className="text-xs text-gray-500">
                        Valeur recommandée: 100-500 lignes
                      </p>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Lignes à importer:</strong> {preview.totalRows}
                      {detectDuplicates && (
                        <>
                          <br />
                          <strong>Détection des doublons:</strong> Activée sur {duplicateFields.length} champ(s)
                        </>
                      )}
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-3">
                    <Button onClick={onCancel} variant="outline" className="flex-1">
                      Annuler
                    </Button>
                    <Button onClick={handleStartImport} className="flex-1">
                      Démarrer l'import
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <SavedMappingsPanel onSelectMapping={setSelectedMapping} />
          </div>

          {selectedMapping && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Mapping sélectionné: <strong>{selectedMapping.nom}</strong>
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {step === 'importing' && progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Import en cours
            </CardTitle>
            <CardDescription>
              Veuillez patienter pendant l'import des données...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span className="font-medium">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500 mb-1">Traités</div>
                <div className="text-xl font-bold">{progress.processed}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-gray-500 mb-1">Importés</div>
                <div className="text-xl font-bold text-green-600">{progress.imported}</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-gray-500 mb-1">Doublons</div>
                <div className="text-xl font-bold text-orange-600">{progress.duplicates}</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-gray-500 mb-1">Erreurs</div>
                <div className="text-xl font-bold text-red-600">{progress.errors}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Import terminé
            </CardTitle>
            <CardDescription>
              L'import s'est terminé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500 mb-1">Total</div>
                <div className="text-xl font-bold">{progress.total}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-gray-500 mb-1">Importés</div>
                <div className="text-xl font-bold text-green-600">{progress.imported}</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-gray-500 mb-1">Doublons</div>
                <div className="text-xl font-bold text-orange-600">{progress.duplicates}</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-gray-500 mb-1">Erreurs</div>
                <div className="text-xl font-bold text-red-600">{progress.errors}</div>
              </div>
            </div>

            <Button onClick={onComplete} className="w-full">
              Terminer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
