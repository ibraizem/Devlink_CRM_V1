'use client'

import { ExportDialog } from '../ExportDialog'
import { ColumnDefinition, Lead } from '@/types/leads'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const sampleData: Lead[] = Array.from({ length: 100 }, (_, i) => ({
  id: `${i + 1}`,
  nom: `Nom${i + 1}`,
  prenom: `Prenom${i + 1}`,
  email: `contact${i + 1}@example.com`,
  phone: `+33 6 ${String(i).padStart(2, '0')} ${String(i).padStart(2, '0')} ${String(i).padStart(2, '0')} ${String(i).padStart(2, '0')}`,
  company: `Company ${i + 1}`,
  ville: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'][i % 5],
  pays: 'France',
  statut: ['nouveau', 'en_cours', 'traite', 'abandonne'][i % 4] as any
}))

export function ExportExample() {
  const columns: ColumnDefinition<Lead>[] = [
    { key: 'nom' as keyof Lead, label: 'Nom' },
    { key: 'prenom' as keyof Lead, label: 'Prénom' },
    { key: 'email' as keyof Lead, label: 'Email' },
    { key: 'phone' as keyof Lead, label: 'Téléphone' },
    { key: 'company' as keyof Lead, label: 'Entreprise' },
    { key: 'ville' as keyof Lead, label: 'Ville' },
    { key: 'pays' as keyof Lead, label: 'Pays' },
    { key: 'statut' as keyof Lead, label: 'Statut' },
  ]

  const selectedIds = sampleData.slice(0, 10).map(d => d.id)

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exemple d'Export Multi-Format</CardTitle>
          <CardDescription>
            Testez l'export de données en CSV, Excel et JSON avec options personnalisables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="space-y-2 text-sm">
              <p><strong>Données disponibles:</strong> {sampleData.length} leads</p>
              <p><strong>Sélection actuelle:</strong> {selectedIds.length} leads</p>
              <p><strong>Colonnes disponibles:</strong> {columns.length}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <ExportDialog
              data={sampleData}
              selectedIds={selectedIds}
              columns={columns}
              trigger={
                <Button>
                  Exporter la sélection ({selectedIds.length})
                </Button>
              }
            />
            
            <ExportDialog
              data={sampleData}
              selectedIds={[]}
              columns={columns}
              trigger={
                <Button variant="outline">
                  Exporter tout ({sampleData.length})
                </Button>
              }
            />
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Formats disponibles:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>CSV:</strong> Compatible Excel et tableurs</li>
              <li><strong>Excel (.xlsx):</strong> Avec mise en forme automatique</li>
              <li><strong>JSON:</strong> Format structuré pour intégrations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
