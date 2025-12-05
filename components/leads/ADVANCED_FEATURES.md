# Fonctionnalités Avancées du Tableau de Leads

Ce document décrit les fonctionnalités avancées disponibles dans le système de gestion des leads.

## 🎯 Vue d'ensemble

Le tableau de leads amélioré offre une expérience utilisateur de type Excel avec des interactions avancées pour une gestion efficace des données.

## 📋 Composants Principaux

### 1. Menu Contextuel (CellContextMenu)

**Déclenchement:** Clic droit sur n'importe quelle cellule ou ligne

**Fonctionnalités:**
- **Actions sur cellule:**
  - Copier la valeur de la cellule
  - Filtrer par la valeur de la cellule
- **Actions sur ligne:**
  - Copier toute la ligne (format JSON)
  - Appeler le contact
  - Envoyer un email
  - Envoyer un message (WhatsApp/SMS)
  - Ajouter une note
  - Modifier le lead
  - Changer le statut (Nouveau, En cours, Traité, Abandonné)
  - Supprimer le lead

**Usage:**
```tsx
import { CellContextMenu } from '@/components/leads/CellContextMenu'

<CellContextMenu
  lead={lead}
  cellKey="email"
  cellValue="contact@example.com"
  onCall={handleCall}
  onEmail={handleEmail}
  onMessage={handleMessage}
  onNote={handleNote}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onStatusChange={handleStatusChange}
  onCopyCell={handleCopyCell}
  onCopyRow={handleCopyRow}
  onFilterByValue={handleFilterByValue}
>
  <div>contact@example.com</div>
</CellContextMenu>
```

### 2. Recherche Globale (GlobalSearch)

**Déclenchement:** 
- Cliquer sur le bouton de recherche
- Raccourci clavier: `⌘K` (Mac) ou `Ctrl+K` (Windows/Linux)

**Fonctionnalités:**
- Recherche instantanée dans tous les champs
- Highlighting des résultats trouvés
- Affichage du nombre de correspondances par lead
- Score de pertinence pour trier les résultats
- Navigation au clavier
- Prévisualisation des champs correspondants

**Usage:**
```tsx
import { GlobalSearch } from '@/components/leads/GlobalSearch'

<GlobalSearch 
  data={leads} 
  onSelectLead={handleSelectLead}
/>
```

**Caractéristiques:**
- Recherche floue avec scoring de pertinence
- Highlighting HTML avec `<mark>` tags
- Icônes contextuelles selon le type de champ
- Limite de 50 résultats maximum pour les performances

### 3. Filtres par Colonne (ColumnFilters)

**Déclenchement:** Cliquer sur le bouton "Filtres"

**Fonctionnalités:**
- Sélection de colonnes à filtrer
- Autocomplete avec compteurs de valeurs
- Recherche dans les valeurs disponibles
- Multi-sélection de valeurs
- Badges visuels pour filtres actifs
- Effacement individuel ou global

**Usage:**
```tsx
import { ColumnFilters } from '@/components/leads/ColumnFilters'

<ColumnFilters
  data={leads}
  columns={columns}
  filters={columnFilters}
  onFiltersChange={setColumnFilters}
/>
```

**Caractéristiques:**
- Comptage automatique des occurrences
- Tri par fréquence (valeurs les plus communes en premier)
- Recherche locale dans les valeurs du filtre
- État persistant entre les interactions

### 4. Export Multi-Format (ExportDialog)

**Déclenchement:** Cliquer sur le bouton "Exporter"

**Formats supportés:**
- **CSV:** Compatible Excel et tableurs
- **Excel (.xlsx):** Avec mise en forme et largeurs de colonnes
- **JSON:** Format structuré pour intégrations

**Options:**
- Sélection de colonnes à exporter
- Inclusion/exclusion des en-têtes
- Export de la sélection ou de toutes les données
- Boutons "Tout sélectionner" / "Tout désélectionner"

**Usage:**
```tsx
import { ExportDialog } from '@/components/leads/ExportDialog'

<ExportDialog
  data={filteredData}
  selectedIds={Array.from(selected)}
  columns={columns}
/>
```

**Fonctionnalités techniques:**
- Utilise la bibliothèque `xlsx` pour Excel
- Génération CSV avec échappement correct des guillemets
- Support UTF-8 avec BOM pour Excel
- Noms de fichiers avec timestamp

### 5. Mode Plein Écran (FullscreenTable)

**Déclenchement:** 
- Cliquer sur le bouton "Plein écran"
- Raccourci clavier: `Ctrl+F`

**Raccourcis disponibles:**
- `Ctrl+F` ou `⌘F`: Activer/désactiver le plein écran
- `Échap`: Quitter le plein écran
- `Shift+?`: Afficher/masquer les raccourcis

**Usage:**
```tsx
import { FullscreenTable } from '@/components/leads/FullscreenTable'

<FullscreenTable shortcuts={true}>
  {/* Contenu du tableau */}
</FullscreenTable>
```

**Caractéristiques:**
- Overlay fullscreen avec position fixe
- Animations Framer Motion pour entrée/sortie
- Badge de rappel des raccourcis
- Panel de raccourcis flottant
- Gestion automatique du overflow du body

## 🚀 Composant Intégré (EnhancedLeadsTable)

Le composant `EnhancedLeadsTable` combine toutes les fonctionnalités ci-dessus dans une interface unifiée.

**Usage complet:**
```tsx
import { EnhancedLeadsTable } from '@/components/leads/EnhancedLeadsTable'

<EnhancedLeadsTable
  data={leads}
  columns={columns}
  onRefresh={refresh}
/>
```

**Fonctionnalités intégrées:**
- ✅ Menu contextuel sur toutes les cellules
- ✅ Recherche globale avec `⌘K`
- ✅ Filtres par colonne avec autocomplete
- ✅ Export multi-format (CSV, Excel, JSON)
- ✅ Mode plein écran avec raccourcis
- ✅ Sélection multiple avec checkboxes
- ✅ Tri par colonne
- ✅ Pagination
- ✅ Actions en ligne (appel, email, note, édition, suppression)
- ✅ Changement de statut rapide

## 🎨 Composant de Démonstration

Pour une intégration rapide avec documentation visuelle:

```tsx
import { LeadsTableDemo } from '@/components/leads/LeadsTableDemo'

<LeadsTableDemo 
  data={leads} 
  onRefresh={refresh}
/>
```

Ce composant inclut:
- Alert avec description des fonctionnalités
- Badges pour chaque raccourci clavier
- Card wrapper avec titre et description
- Toutes les fonctionnalités activées

## 🔧 Hook Personnalisé

Pour une gestion d'état personnalisée:

```tsx
import { useAdvancedTableInteractions } from '@/hooks/useAdvancedTableInteractions'

const {
  filteredData,
  filters,
  selected,
  sortKey,
  sortDir,
  toggleSort,
  toggleSelect,
  selectAll,
  clearSelection,
  updateColumnFilter,
  clearColumnFilter,
  clearAllFilters,
  updateSearch
} = useAdvancedTableInteractions(data)
```

## 📊 Structure de Données

Les leads doivent implémenter l'interface `Lead`:

```typescript
interface Lead {
  id: string
  score?: number
  campaign_id?: string
  [key: string]: any  // Champs dynamiques
}
```

Les colonnes suivent la structure `ColumnDefinition`:

```typescript
interface ColumnDefinition<T> {
  key: keyof T
  label: string
}
```

## 🎯 Bonnes Pratiques

1. **Performance:**
   - Utilisez la pagination pour grandes quantités de données
   - Les filtres sont appliqués côté client
   - La recherche globale limite à 50 résultats

2. **UX:**
   - Toasts pour feedback utilisateur
   - Animations fluides avec Framer Motion
   - États de chargement avec skeletons
   - Confirmation pour actions destructives

3. **Accessibilité:**
   - Labels ARIA sur tous les contrôles
   - Navigation clavier complète
   - Indicateurs visuels clairs
   - Tooltips et badges explicatifs

## 🔐 Sécurité

- Validation des données avant export
- Échappement correct dans les CSV
- Sanitization des valeurs JSON
- Confirmation pour suppressions

## 📱 Responsive

- Layout adaptatif mobile/desktop
- Scroll horizontal pour tables larges
- Popover alignés intelligemment
- Boutons compacts sur mobile

## 🌐 Internationalisation

Tous les textes sont en français, mais peuvent être facilement internationalisés:
- Messages toast
- Labels de formulaires
- Descriptions d'actions
- Raccourcis clavier

## 🔄 Intégrations

Compatible avec:
- Supabase pour persistence
- React Query pour cache
- Zustand pour état global
- Framer Motion pour animations
- shadcn/ui pour composants UI
