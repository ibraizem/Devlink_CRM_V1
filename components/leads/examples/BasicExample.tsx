'use client'

import { EnhancedLeadsTable } from '../EnhancedLeadsTable'
import { ColumnDefinition, Lead } from '@/types/leads'

const sampleData: Lead[] = [
  {
    id: '1',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@example.com',
    phone: '+33 6 12 34 56 78',
    company: 'ACME Corp',
    ville: 'Paris',
    pays: 'France',
    statut: 'nouveau'
  },
  {
    id: '2',
    nom: 'Martin',
    prenom: 'Sophie',
    email: 'sophie.martin@example.com',
    phone: '+33 6 98 76 54 32',
    company: 'TechCo',
    ville: 'Lyon',
    pays: 'France',
    statut: 'en_cours'
  },
  {
    id: '3',
    nom: 'Bernard',
    prenom: 'Pierre',
    email: 'pierre.bernard@example.com',
    phone: '+33 6 11 22 33 44',
    company: 'StartupXYZ',
    ville: 'Marseille',
    pays: 'France',
    statut: 'traite'
  }
]

export function BasicExample() {
  const columns: ColumnDefinition<Lead>[] = [
    { key: 'nom' as keyof Lead, label: 'Nom' },
    { key: 'prenom' as keyof Lead, label: 'Prénom' },
    { key: 'email' as keyof Lead, label: 'Email' },
    { key: 'phone' as keyof Lead, label: 'Téléphone' },
    { key: 'company' as keyof Lead, label: 'Entreprise' },
    { key: 'ville' as keyof Lead, label: 'Ville' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Exemple Basique</h1>
      <EnhancedLeadsTable
        data={sampleData}
        columns={columns}
        onRefresh={() => console.log('Refresh triggered')}
      />
    </div>
  )
}
