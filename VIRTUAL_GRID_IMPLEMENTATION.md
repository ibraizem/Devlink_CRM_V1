# Système de Grille Virtuelle Haute-Performance - Documentation d'Implémentation

## Vue d'ensemble

Ce système fournit une grille virtuelle complète et hautement performante pour afficher et gérer des milliers de lignes de données simultanément. Il intègre :

- **Virtualisation** avec `@tanstack/react-virtual` pour des performances optimales
- **Colonnes redimensionnables et réorganisables** avec `@dnd-kit`
- **Édition inline** avec validation en temps réel via Zod
- **Tri, filtrage et recherche** intégrés
- **Sélection multiple** avec opérations groupées
- **Export** vers CSV, Excel et JSON

## Structure des fichiers

```
components/virtual/
├── VirtualGrid.tsx              # Composant principal de grille
├── EditableCell.tsx             # Cellule éditable avec validation
├── ResizableColumn.tsx          # Colonne redimensionnable
├── ColumnManager.tsx            # Gestionnaire de colonnes (Sheet)
├── VirtualGridToolbar.tsx       # Barre d'outils avec recherche/actions
├── VirtualGridStats.tsx         # Affichage des statistiques
├── VirtualGridContext.tsx       # Context React pour état partagé
├── ColumnTypeSelector.tsx       # Sélecteur de type de colonne
├── README.md                    # Documentation détaillée
├── examples/
│   ├── SimpleExample.tsx        # Exemple simple
│   └── AdvancedExample.tsx      # Exemple avancé complet
└── index.ts                     # Exports publics

hooks/
├── useVirtualGridState.ts       # Gestion de l'état (colonnes, tri, sélection)
├── useVirtualGridColumns.ts     # Création de colonnes typées
├── useVirtualGridFilters.ts     # Recherche et filtres
├── useVirtualGridExport.ts      # Export de données
└── useVirtualGridPerformance.ts # Monitoring des performances

types/
└── virtual-grid.ts              # Types TypeScript complets

components/leads/
├── VirtualLeadsTable.tsx        # Implémentation simple pour leads
└── AdvancedVirtualLeadsTable.tsx # Implémentation complète pour leads
```

## Composants créés

### 1. VirtualGrid (Principal)
**Fichier:** `components/virtual/VirtualGrid.tsx`

Composant de grille virtuelle haute-performance qui gère :
- Virtualisation des lignes avec `@tanstack/react-virtual`
- Drag-and-drop des colonnes avec `@dnd-kit`
- Redimensionnement des colonnes
- Tri par colonnes
- Sélection de lignes
- Édition inline des cellules

**Caractéristiques:**
- Supporte des milliers de lignes sans perte de performance
- Rendu uniquement des lignes visibles + overscan
- Header fixe avec défilement horizontal
- Gestion des largeurs de colonnes dynamiques

### 2. EditableCell
**Fichier:** `components/virtual/EditableCell.tsx`

Cellule éditable avec :
- Validation en temps réel via schémas Zod
- Formatage personnalisable de l'affichage
- Parsing personnalisable de la saisie
- Indicateurs visuels (erreurs, sauvegarde)
- Support de différents types d'input HTML

**Modes:**
- Vue : affichage formaté avec hover
- Édition : input avec validation live
- Sauvegarde : indicateur de chargement

### 3. ResizableColumn
**Fichier:** `components/virtual/ResizableColumn.tsx`

Colonne redimensionnable avec :
- Poignée de redimensionnement visuelle
- Contraintes min/max width
- Feedback visuel pendant le drag
- Curseur personnalisé

### 4. ColumnManager
**Fichier:** `components/virtual/ColumnManager.tsx`

Gestionnaire avancé de colonnes avec :
- Drag-and-drop pour réorganiser
- Checkbox pour afficher/masquer
- Input pour redimensionner
- Colonnes verrouillées
- Bouton reset

### 5. VirtualGridToolbar
**Fichier:** `components/virtual/VirtualGridToolbar.tsx`

Barre d'outils complète avec :
- Champ de recherche avec clear
- Compteur de sélection
- Filtres avec badges
- Actions personnalisables
- Modes contextuel (sélection active/inactive)

### 6. VirtualGridStats
**Fichier:** `components/virtual/VirtualGridStats.tsx`

Affichage de statistiques en cartes avec :
- Icônes personnalisables
- Couleurs personnalisables
- Tendances (optionnel)
- Layout responsive

### 7. VirtualGridContext
**Fichier:** `components/virtual/VirtualGridContext.tsx`

Context React pour :
- État partagé entre composants
- Gestion centralisée des colonnes
- Sélection globale
- Tri et recherche

### 8. ColumnTypeSelector
**Fichier:** `components/virtual/ColumnTypeSelector.tsx`

Sélecteur de type avec :
- 8 types supportés
- Icônes et descriptions
- Formatage et validation automatiques

## Hooks créés

### 1. useVirtualGridState
**Fichier:** `hooks/useVirtualGridState.ts`

Gère l'état complet de la grille :
- Colonnes et leur configuration
- Lignes sélectionnées
- Tri actuel
- Données triées
- Callbacks pour mise à jour

**API:**
```tsx
const {
  columns,           // Colonnes actuelles
  sortedData,        // Données triées
  selectedRows,      // Set d'IDs sélectionnés
  sortBy,            // Configuration du tri
  handleCellUpdate,  // Mettre à jour une cellule
  handleColumnsChange, // Changer les colonnes
  handleSelectionChange, // Changer la sélection
  handleSortChange,  // Changer le tri
  clearSelection,    // Désélectionner tout
  selectAll,         // Tout sélectionner
  getSelectedData,   // Obtenir les données sélectionnées
} = useVirtualGridState(options)
```

### 2. useVirtualGridColumns
**Fichier:** `hooks/useVirtualGridColumns.ts`

Crée des colonnes avec formatage automatique :
- 8 types prédéfinis (text, number, email, tel, url, date, boolean, currency)
- Formatage automatique selon le type
- Validation automatique selon le type
- Parsing automatique selon le type

**Types supportés:**
- `text`: Texte simple
- `number`: Formatage français (espace milliers)
- `email`: Validation email
- `tel`: Formatage téléphone français (06 12 34 56 78)
- `url`: Validation et formatage URL
- `date`: Formatage date français (JJ/MM/AAAA)
- `boolean`: Oui/Non
- `currency`: Formatage monétaire (1 234,56 €)

### 3. useVirtualGridFilters
**Fichier:** `hooks/useVirtualGridFilters.ts`

Gère recherche et filtres :
- Recherche multi-colonnes
- 10 opérateurs de filtre
- Filtres actifs/inactifs
- Clear individual/all

**Opérateurs:**
- `equals`, `contains`, `startsWith`, `endsWith`
- `gt`, `lt`, `gte`, `lte`
- `isEmpty`, `isNotEmpty`

### 4. useVirtualGridExport
**Fichier:** `hooks/useVirtualGridExport.ts`

Gère l'export de données :
- CSV (avec BOM UTF-8)
- JSON (formaté)
- Excel (via XLSX)
- Presse-papiers (TSV)

**Options:**
- Colonnes visibles uniquement
- Lignes sélectionnées ou toutes
- Formatage selon les colonnes

### 5. useVirtualGridPerformance
**Fichier:** `hooks/useVirtualGridPerformance.ts`

Monitoring des performances :
- Temps de rendu
- Frame drops
- Utilisation mémoire
- Statistiques (min, max, moyenne, p95)
- Logs en développement

## Composants d'intégration pour Leads

### 1. VirtualLeadsTable
**Fichier:** `components/leads/VirtualLeadsTable.tsx`

Implémentation simple avec :
- 10 colonnes pré-configurées
- Édition inline
- Mise à jour via leadService
- Refresh callback

### 2. AdvancedVirtualLeadsTable
**Fichier:** `components/leads/AdvancedVirtualLeadsTable.tsx`

Implémentation complète avec :
- Toutes les fonctionnalités
- Statistiques par statut
- Recherche et filtres
- Export multi-formats
- Actions groupées (suppression)
- Toolbar contextualisée

## Types TypeScript

**Fichier:** `types/virtual-grid.ts`

Types complets pour :
- Configuration des colonnes
- État de la grille
- Filtres et tri
- Export
- Actions
- Métriques de performance

## Exemples d'utilisation

### Exemple simple

```tsx
import { SimpleExample } from '@/components/virtual/examples/SimpleExample'

// Affiche 10 000 lignes avec édition inline
<SimpleExample />
```

### Exemple avancé

```tsx
import { AdvancedExample } from '@/components/virtual/examples/AdvancedExample'

// Affiche 50 000 lignes avec toutes les fonctionnalités
<AdvancedExample />
```

### Intégration avec leads

```tsx
import { AdvancedVirtualLeadsTable } from '@/components/leads/AdvancedVirtualLeadsTable'

function LeadsPage() {
  const [leads, setLeads] = useState([])
  
  return (
    <AdvancedVirtualLeadsTable
      data={leads}
      onRefresh={fetchLeads}
      onDataChange={setLeads}
    />
  )
}
```

## Performances

### Optimisations implémentées

1. **Virtualisation**
   - Seules les lignes visibles sont rendues
   - Overscan configurable (défaut: 10)
   - Scroll fluide 60fps

2. **Mémoïsation**
   - useMemo pour calculs coûteux
   - useCallback pour fonctions
   - Colonnes visibles uniquement

3. **Lazy operations**
   - Tri à la demande
   - Filtrage incrémental
   - Export asynchrone

4. **Optimisations DOM**
   - Transform CSS pour défilement
   - Position absolue pour lignes
   - Largeur fixe des colonnes

### Benchmarks attendus

- **10 000 lignes**: < 50ms premier rendu, 60fps scroll
- **50 000 lignes**: < 100ms premier rendu, 60fps scroll
- **100 000 lignes**: < 200ms premier rendu, stable
- **Édition cellule**: < 10ms
- **Tri**: < 100ms pour 50k lignes
- **Recherche**: < 50ms pour 50k lignes

## Dépendances

Toutes les dépendances sont déjà installées dans le projet :

- `@tanstack/react-virtual`: ^3.13.12 ✅
- `@dnd-kit/core`: ^6.1.0 ✅
- `@dnd-kit/sortable`: ^8.0.0 ✅
- `@dnd-kit/utilities`: ^3.2.2 ✅
- `zod`: ^3.23.8 ✅
- `xlsx`: ^0.18.5 ✅
- `framer-motion`: ^12.23.24 ✅

## Intégration avec l'existant

Le système est conçu pour coexister avec `RawLeadsTable` existant :

- **RawLeadsTable**: Tableau actuel avec pagination classique
- **VirtualLeadsTable**: Version virtualisée simple
- **AdvancedVirtualLeadsTable**: Version complète avec toutes les fonctionnalités

Les trois peuvent être utilisés selon les besoins :
- Pages simples → RawLeadsTable
- Performance → VirtualLeadsTable  
- Fonctionnalités avancées → AdvancedVirtualLeadsTable

## Prochaines étapes

Pour utiliser le système :

1. **Importer le composant souhaité**
2. **Préparer les données** (tableau d'objets)
3. **Définir les colonnes** via `useVirtualGridColumns`
4. **Gérer l'état** via `useVirtualGridState`
5. **Ajouter filtres/export** (optionnel) via hooks correspondants

Voir `components/virtual/README.md` pour documentation détaillée et exemples.
