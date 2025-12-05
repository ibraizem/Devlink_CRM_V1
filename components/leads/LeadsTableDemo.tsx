'use client'

import { EnhancedLeadsTable } from './EnhancedLeadsTable'
import { ColumnDefinition, Lead } from '@/types/leads'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface LeadsTableDemoProps {
  data: Lead[]
  onRefresh?: () => void
}

export function LeadsTableDemo({ data, onRefresh }: LeadsTableDemoProps) {
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

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Fonctionnalités avancées activées</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Clic droit</Badge>
              <span>Menu contextuel sur cellules et lignes</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">⌘K</Badge>
              <span>Recherche globale avec highlighting</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Filtres</Badge>
              <span>Filtres par colonne avec autocomplete</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Export</Badge>
              <span>Export CSV, Excel, JSON personnalisable</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Ctrl+F</Badge>
              <span>Mode plein écran avec raccourcis</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">?</Badge>
              <span>Afficher les raccourcis clavier</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Tableau de leads interactif</CardTitle>
          <CardDescription>
            Utilisez les fonctionnalités avancées pour gérer efficacement vos leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedLeadsTable
            data={data}
            columns={columns}
            onRefresh={onRefresh}
          />
        </CardContent>
      </Card>
    </div>
  )
}
