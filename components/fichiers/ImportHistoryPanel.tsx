'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { importService } from '@/lib/services/importService'
import type { ImportHistory, DuplicateRecord } from '@/lib/types/storage-sync'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  RotateCcw,
  FileText,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function ImportHistoryPanel() {
  const [history, setHistory] = useState<ImportHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState<ImportHistory | null>(null)
  const [duplicates, setDuplicates] = useState<DuplicateRecord[]>([])
  const [isRollbacking, setIsRollbacking] = useState(false)
  const [showDuplicates, setShowDuplicates] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      const data = await importService.getImportHistory()
      setHistory(data)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement de l\'historique')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRollback = async (historyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet import ? Cette action est irréversible.')) {
      return
    }

    try {
      setIsRollbacking(true)
      await importService.rollbackImport(historyId)
      toast.success('Import annulé avec succès')
      loadHistory()
      setSelectedHistory(null)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de l\'annulation de l\'import')
    } finally {
      setIsRollbacking(false)
    }
  }

  const handleViewDetails = async (item: ImportHistory) => {
    setSelectedHistory(item)
    if (item.nb_lignes_doublons > 0) {
      try {
        const dups = await importService.getDuplicates(item.id)
        setDuplicates(dups)
      } catch (error) {
        console.error('Erreur:', error)
      }
    }
  }

  const getStatusBadge = (statut: ImportHistory['statut']) => {
    switch (statut) {
      case 'termine':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Terminé
          </Badge>
        )
      case 'en_cours':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        )
      case 'erreur':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        )
      case 'annule':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            <RotateCcw className="h-3 w-3 mr-1" />
            Annulé
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertTriangle className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Historique des imports</CardTitle>
          <CardDescription>
            Consultez l'historique de vos imports et effectuez des rollbacks si nécessaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : history.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Aucun import n'a encore été effectué
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {history.map(item => (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(item.statut)}
                          {item.rollback_effectue && (
                            <Badge variant="outline" className="text-xs">
                              Rollback effectué
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(item.created_at), 'PPp', { locale: fr })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item)}
                        >
                          Détails
                        </Button>
                        {item.peut_rollback && !item.rollback_effectue && item.statut === 'termine' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollback(item.id)}
                            disabled={isRollbacking}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Total</div>
                        <div className="font-medium">{item.nb_lignes_total}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Importés</div>
                        <div className="font-medium text-green-600">{item.nb_lignes_importees}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Doublons</div>
                        <div className="font-medium text-orange-600">{item.nb_lignes_doublons}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Erreurs</div>
                        <div className="font-medium text-red-600">{item.nb_lignes_erreurs}</div>
                      </div>
                    </div>

                    {item.erreurs && item.erreurs.length > 0 && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {item.erreurs.length} erreur(s) détectée(s)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedHistory} onOpenChange={() => setSelectedHistory(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Détails de l'import</DialogTitle>
            <DialogDescription>
              {selectedHistory && format(new Date(selectedHistory.created_at), 'PPpp', { locale: fr })}
            </DialogDescription>
          </DialogHeader>

          {selectedHistory && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Statut</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getStatusBadge(selectedHistory.statut)}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Statistiques</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{selectedHistory.nb_lignes_total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Importés:</span>
                        <span className="font-medium text-green-600">
                          {selectedHistory.nb_lignes_importees}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Doublons:</span>
                        <span className="font-medium text-orange-600">
                          {selectedHistory.nb_lignes_doublons}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Erreurs:</span>
                        <span className="font-medium text-red-600">
                          {selectedHistory.nb_lignes_erreurs}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedHistory.erreurs && selectedHistory.erreurs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Erreurs détectées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {selectedHistory.erreurs.map((error, idx) => (
                            <Alert key={idx} variant="destructive">
                              <AlertDescription className="text-xs">
                                <strong>Ligne {error.ligne}:</strong> {error.message}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                {duplicates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Doublons détectés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {duplicates.map(dup => (
                            <div key={dup.id} className="p-3 border rounded-lg bg-orange-50">
                              <div className="flex justify-between items-start mb-2">
                                <Badge variant="outline" className="text-xs">
                                  Ligne {dup.ligne_numero}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(dup.created_at), 'HH:mm:ss')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">{dup.raison_doublon}</div>
                              <div className="text-xs bg-white p-2 rounded border">
                                <pre className="whitespace-pre-wrap">
                                  {JSON.stringify(dup.donnees, null, 2)}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedHistory(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
