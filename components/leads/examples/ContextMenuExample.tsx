'use client'

import { useState } from 'react'
import { CellContextMenu } from '../CellContextMenu'
import { Lead } from '@/types/leads'
import { LeadStatus } from '@/lib/services/leadService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export function ContextMenuExample() {
  const [actions, setActions] = useState<string[]>([])

  const sampleLead: Lead = {
    id: '1',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@example.com',
    phone: '+33 6 12 34 56 78',
    company: 'ACME Corp'
  }

  const addAction = (action: string) => {
    setActions(prev => [...prev, `${new Date().toLocaleTimeString()}: ${action}`])
    toast.success(action)
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exemple de Menu Contextuel</CardTitle>
          <CardDescription>
            Faites un clic droit sur les cellules ci-dessous pour voir le menu contextuel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <CellContextMenu
              lead={sampleLead}
              cellKey="nom"
              cellValue="Dupont"
              onCall={(lead) => addAction(`Appel à ${lead.nom}`)}
              onEmail={(lead) => addAction(`Email à ${lead.email}`)}
              onMessage={(lead) => addAction(`Message à ${lead.nom}`)}
              onNote={(lead) => addAction(`Note ajoutée pour ${lead.nom}`)}
              onEdit={(lead) => addAction(`Édition de ${lead.nom}`)}
              onDelete={(lead) => addAction(`Suppression de ${lead.nom}`)}
              onStatusChange={(lead, status) => addAction(`Statut changé: ${status}`)}
              onCopyCell={(value) => addAction(`Cellule copiée: ${value}`)}
              onCopyRow={(lead) => addAction(`Ligne copiée: ${lead.id}`)}
              onFilterByValue={(key, value) => addAction(`Filtre: ${key} = ${value}`)}
            >
              <div className="p-4 border rounded cursor-context-menu hover:bg-muted">
                <strong>Nom:</strong> Dupont
              </div>
            </CellContextMenu>

            <CellContextMenu
              lead={sampleLead}
              cellKey="email"
              cellValue="jean.dupont@example.com"
              onCall={(lead) => addAction(`Appel à ${lead.nom}`)}
              onEmail={(lead) => addAction(`Email à ${lead.email}`)}
              onMessage={(lead) => addAction(`Message à ${lead.nom}`)}
              onNote={(lead) => addAction(`Note ajoutée pour ${lead.nom}`)}
              onEdit={(lead) => addAction(`Édition de ${lead.nom}`)}
              onDelete={(lead) => addAction(`Suppression de ${lead.nom}`)}
              onStatusChange={(lead, status) => addAction(`Statut changé: ${status}`)}
              onCopyCell={(value) => addAction(`Cellule copiée: ${value}`)}
              onCopyRow={(lead) => addAction(`Ligne copiée: ${lead.id}`)}
              onFilterByValue={(key, value) => addAction(`Filtre: ${key} = ${value}`)}
            >
              <div className="p-4 border rounded cursor-context-menu hover:bg-muted">
                <strong>Email:</strong> jean.dupont@example.com
              </div>
            </CellContextMenu>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Actions déclenchées:</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucune action pour le moment. Faites un clic droit sur une cellule.
                </p>
              ) : (
                actions.map((action, idx) => (
                  <Badge key={idx} variant="secondary" className="block w-full justify-start">
                    {action}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
