# Guide d'Intégration - Fonctionnalités Avancées du Tableau de Leads

Ce guide explique comment intégrer les nouvelles fonctionnalités avancées dans votre application DevLink CRM.

## 📦 Fichiers Créés

### Composants Principaux

```
components/leads/
├── CellContextMenu.tsx          # Menu contextuel (clic droit)
├── ColumnFilters.tsx            # Filtres par colonne avec autocomplete
├── EnhancedLeadsTable.tsx       # Tableau intégré avec toutes les fonctionnalités
├── ExportDialog.tsx             # Dialog d'export multi-format
├── FullscreenTable.tsx          # Mode plein écran avec raccourcis
├── GlobalSearch.tsx             # Recherche globale avec highlighting
└── LeadsTableDemo.tsx           # Composant de démonstration
```

### Documentation

```
components/leads/
├── ADVANCED_FEATURES.md         # Documentation détaillée des fonctionnalités
├── CHANGELOG.md                 # Historique des versions
└── README.md                    # Guide d'utilisation
```

### Exemples

```
components/leads/examples/
├── BasicExample.tsx             # Exemple basique
├── ContextMenuExample.tsx       # Exemple menu contextuel
├── ExportExample.tsx            # Exemple export
└── index.ts                     # Export centralisé
```

### Utilitaires

```
hooks/
└── useAdvancedTableInteractions.ts  # Hook de gestion d'état

types/
└── advanced-table.ts                # Types TypeScript

components/leads/advanced/
└── index.ts                         # Export centralisé des composants

components/leads/__tests__/
└── advanced-features.test.ts        # Spécifications de tests
```

## 🚀 Intégration Rapide

### Option 1 : Utilisation du Composant Intégré (Recommandé)

Le moyen le plus simple d'utiliser toutes les fonctionnalités :

```tsx
// Dans votre page de leads (app/leads/page.tsx)
import { EnhancedLeadsTable } from '@/components/leads/EnhancedLeadsTable'
import { useCrmData2 } from '@/hooks/useCrmData2'

export default function LeadsPage() {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const { data: leads, isLoading, refresh } = useCrmData2(selectedFileIds)

  const columns = [
    { key: 'nom', label: 'Nom' },
    { key: 'prenom', label: 'Prénom' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'company', label: 'Entreprise' },
  ]

  return (
    <EnhancedLeadsTable
      data={leads}
      columns={columns}
      onRefresh={refresh}
    />
  )
}
```

### Option 2 : Composants Individuels

Pour plus de contrôle, utilisez les composants séparément :

```tsx
import {
  GlobalSearch,
  ColumnFilters,
  ExportDialog,
  FullscreenTable
} from '@/components/leads/advanced'

export default function CustomLeadsPage() {
  const [filters, setFilters] = useState({})
  const [selected, setSelected] = useState([])

  return (
    <div>
      {/* Barre d'outils */}
      <div className="flex gap-2">
        <GlobalSearch data={leads} onSelectLead={handleSelect} />
        <ColumnFilters 
          data={leads}
          columns={columns}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <ExportDialog
          data={leads}
          selectedIds={selected}
          columns={columns}
        />
      </div>

      {/* Tableau dans mode plein écran */}
      <FullscreenTable>
        {/* Votre tableau personnalisé */}
      </FullscreenTable>
    </div>
  )
}
```

### Option 3 : Menu Contextuel Uniquement

Pour ajouter juste le menu contextuel à un tableau existant :

```tsx
import { CellContextMenu } from '@/components/leads/CellContextMenu'

function MyTableCell({ lead, value }) {
  return (
    <CellContextMenu
      lead={lead}
      cellKey="email"
      cellValue={value}
      onCall={handleCall}
      onEmail={handleEmail}
      onNote={handleNote}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onStatusChange={handleStatusChange}
      onCopyCell={handleCopyCell}
      onFilterByValue={handleFilterByValue}
    >
      <div>{value}</div>
    </CellContextMenu>
  )
}
```

## 🎯 Fonctionnalités par Composant

### 1. Menu Contextuel (CellContextMenu)

**Activation :** Clic droit sur n'importe quelle cellule

**Actions disponibles :**
- ✅ Copier la cellule
- ✅ Copier toute la ligne (JSON)
- ✅ Filtrer par cette valeur
- ✅ Appeler le contact
- ✅ Envoyer un email
- ✅ Envoyer un message
- ✅ Ajouter une note
- ✅ Modifier le lead
- ✅ Changer le statut (Nouveau, En cours, Traité, Abandonné)
- ✅ Supprimer le lead

### 2. Recherche Globale (GlobalSearch)

**Activation :** ⌘K (Mac) ou Ctrl+K (Windows/Linux)

**Fonctionnalités :**
- ✅ Recherche dans tous les champs simultanément
- ✅ Highlighting des résultats trouvés
- ✅ Score de pertinence
- ✅ Navigation au clavier
- ✅ Icônes contextuelles
- ✅ Limite de 50 résultats

### 3. Filtres par Colonne (ColumnFilters)

**Activation :** Bouton "Filtres"

**Fonctionnalités :**
- ✅ Sélection de colonnes à filtrer
- ✅ Autocomplete des valeurs existantes
- ✅ Compteurs d'occurrences
- ✅ Multi-sélection de valeurs
- ✅ Recherche dans les valeurs
- ✅ Badges pour filtres actifs
- ✅ Effacement individuel ou global

### 4. Export Multi-Format (ExportDialog)

**Activation :** Bouton "Exporter"

**Formats supportés :**
- ✅ CSV (compatible Excel)
- ✅ Excel (.xlsx) avec mise en forme
- ✅ JSON (pour intégrations)

**Options :**
- ✅ Sélection de colonnes
- ✅ Inclusion/exclusion des en-têtes
- ✅ Export sélection ou tout
- ✅ Noms de fichiers avec timestamp

### 5. Mode Plein Écran (FullscreenTable)

**Activation :** Ctrl+F ou bouton "Plein écran"

**Raccourcis :**
- ✅ `Ctrl+F` : Activer/désactiver
- ✅ `Échap` : Quitter
- ✅ `Shift+?` : Afficher les raccourcis

## 🔧 Configuration

### Dépendances Requises

Toutes les dépendances sont déjà installées dans le projet :

```json
{
  "@radix-ui/react-context-menu": "^2.2.16",
  "cmdk": "^1.0.0",
  "framer-motion": "^12.23.24",
  "xlsx": "^0.18.5"
}
```

### Types TypeScript

Les types sont automatiquement disponibles via :

```tsx
import { Lead, ColumnDefinition } from '@/types/leads'
import { LeadStatus } from '@/lib/services/leadService'
import type {
  CellContextMenuProps,
  GlobalSearchProps,
  ExportDialogProps
} from '@/types/advanced-table'
```

## 📱 Responsive

Tous les composants sont responsive et s'adaptent automatiquement :

- **Mobile :** Boutons compacts, scroll horizontal
- **Tablet :** Layout intermédiaire
- **Desktop :** Interface complète

## ♿ Accessibilité

- Labels ARIA sur tous les contrôles
- Navigation clavier complète
- Support lecteurs d'écran
- Focus management
- Indicateurs visuels clairs

## 🎨 Personnalisation

### Thème

Les composants utilisent les tokens Tailwind et s'adaptent au mode sombre :

```tsx
// Pas de configuration nécessaire, tout est automatique
<EnhancedLeadsTable data={leads} columns={columns} />
```

### Classes CSS Personnalisées

Vous pouvez ajouter des classes personnalisées :

```tsx
<EnhancedLeadsTable
  data={leads}
  columns={columns}
  className="my-custom-table"
/>
```

### Callbacks Personnalisés

Tous les callbacks peuvent être personnalisés :

```tsx
<CellContextMenu
  lead={lead}
  onCall={(lead) => {
    // Votre logique d'appel
    console.log('Calling', lead.phone)
    myVoipService.call(lead.phone)
  }}
  onEmail={(lead) => {
    // Votre logique d'email
    myEmailService.compose(lead.email)
  }}
>
  {children}
</CellContextMenu>
```

## 🧪 Tests

### Exécuter les Tests (à configurer)

```bash
# Les spécifications de tests sont disponibles dans
# components/leads/__tests__/advanced-features.test.ts

# Pour exécuter les tests (après configuration Jest/Vitest) :
yarn test components/leads
```

### Tests Manuels

1. **Menu Contextuel :**
   - Clic droit sur une cellule → Menu s'affiche
   - Sélectionner "Copier la cellule" → Valeur copiée
   - Sélectionner "Filtrer par cette valeur" → Filtre appliqué

2. **Recherche Globale :**
   - Appuyer sur ⌘K → Dialog s'ouvre
   - Taper "test" → Résultats affichés avec highlighting
   - Cliquer sur un résultat → Dialog se ferme et lead sélectionné

3. **Filtres :**
   - Cliquer sur "Filtres" → Panel s'ouvre
   - Sélectionner une colonne → Valeurs affichées avec compteurs
   - Cocher des valeurs → Données filtrées
   - Cliquer sur "Effacer tout" → Filtres supprimés

4. **Export :**
   - Cliquer sur "Exporter" → Dialog s'ouvre
   - Sélectionner format CSV → Colonnes affichées
   - Décocher certaines colonnes → Export partiel
   - Cliquer "Exporter" → Fichier téléchargé

5. **Plein Écran :**
   - Appuyer sur Ctrl+F → Mode plein écran activé
   - Appuyer sur Shift+? → Raccourcis affichés
   - Appuyer sur Échap → Mode plein écran désactivé

## 🚨 Dépannage

### Le menu contextuel ne s'affiche pas

**Solution :** Vérifiez que `@radix-ui/react-context-menu` est installé et que le composant parent n'empêche pas le clic droit.

### La recherche globale ne s'ouvre pas avec ⌘K

**Solution :** Assurez-vous qu'aucun autre composant n'intercepte ce raccourci. Vérifiez la console pour d'éventuelles erreurs.

### L'export Excel génère un fichier corrompu

**Solution :** Vérifiez que les données ne contiennent pas de références circulaires. Utilisez `JSON.stringify` pour tester.

### Le mode plein écran ne se ferme pas

**Solution :** Appuyez sur `Échap`. Si cela ne fonctionne pas, vérifiez la console JavaScript pour des erreurs.

### Les filtres ne s'appliquent pas

**Solution :** Vérifiez que vous passez bien les filtres et le callback `onFiltersChange` au composant.

## 📊 Performance

### Optimisations Intégrées

- **useMemo** pour calculs coûteux
- **useCallback** pour callbacks stables
- Limite de 50 résultats pour recherche
- Virtualisation recommandée pour >1000 lignes
- Pagination par défaut

### Recommandations

Pour de grandes quantités de données (>10000 lignes) :

1. Utilisez la pagination côté serveur
2. Implémentez un debouncing sur la recherche
3. Limitez le nombre de colonnes visibles
4. Utilisez React Virtual pour le rendu

## 🔐 Sécurité

- Validation des données avant export
- Échappement correct des caractères spéciaux
- Pas d'exposition de données sensibles dans les logs
- Confirmation pour actions destructives
- Sanitization des valeurs JSON

## 📚 Ressources

- [Documentation Complète](./components/leads/ADVANCED_FEATURES.md)
- [Guide d'Utilisation](./components/leads/README.md)
- [Changelog](./components/leads/CHANGELOG.md)
- [Exemples](./components/leads/examples/)
- [Types TypeScript](./types/advanced-table.ts)

## 🤝 Support

Pour toute question ou problème :

1. Consultez la documentation complète
2. Vérifiez les exemples fournis
3. Consultez le changelog pour les notes de version
4. Vérifiez les spécifications de tests

## 📝 Checklist d'Intégration

- [ ] Lire la documentation complète
- [ ] Tester le composant EnhancedLeadsTable
- [ ] Vérifier les raccourcis clavier
- [ ] Tester le menu contextuel
- [ ] Tester la recherche globale
- [ ] Tester les filtres par colonne
- [ ] Tester l'export dans les 3 formats
- [ ] Tester le mode plein écran
- [ ] Vérifier la responsive mobile
- [ ] Vérifier l'accessibilité
- [ ] Personnaliser les callbacks si nécessaire
- [ ] Tester avec vos données réelles
- [ ] Former les utilisateurs aux nouveaux raccourcis

## 🎉 Prochaines Étapes

Une fois l'intégration terminée :

1. Consultez le [CHANGELOG](./components/leads/CHANGELOG.md) pour les futures fonctionnalités
2. Explorez les [exemples](./components/leads/examples/) pour des cas d'usage avancés
3. Personnalisez les composants selon vos besoins
4. Partagez vos retours pour améliorer les fonctionnalités
