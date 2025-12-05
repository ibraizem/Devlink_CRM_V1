# Extension du Système de Sélection Multiple

Ce guide explique comment étendre et personnaliser le système de sélection multiple.

## Ajouter une Nouvelle Action Groupée

### 1. Créer le Service (Backend Logic)

Dans `lib/services/leadService.ts`, ajoutez une nouvelle méthode :

```typescript
async customBulkAction(
  leadIds: string[],
  customParam: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < leadIds.length; i++) {
    try {
      // Votre logique ici
      await this.customOperation(leadIds[i], customParam);
      success++;
    } catch (error) {
      console.error(`Erreur pour le lead ${leadIds[i]}:`, error);
      failed++;
    }
    
    if (onProgress) {
      onProgress(i + 1, leadIds.length);
    }
  }

  return { success, failed };
}
```

### 2. Créer la Modale (UI)

Créez un nouveau fichier `components/leads/BulkCustomModal.tsx` :

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BulkActionSummary } from './BulkActionSummary';
import { toast } from 'sonner';

interface BulkCustomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onExecute: (param: string) => Promise<void>;
}

export function BulkCustomModal({
  open,
  onOpenChange,
  selectedCount,
  onExecute,
}: BulkCustomModalProps) {
  const [param, setParam] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      await onExecute(param);
      toast.success(`✅ Action exécutée sur ${selectedCount} lead(s)`);
      onOpenChange(false);
    } catch (error) {
      toast.error('❌ Erreur lors de l\'exécution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Action personnalisée</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <BulkActionSummary
            selectedCount={selectedCount}
            action="Description de votre action"
          />
          
          {/* Vos champs de formulaire ici */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleExecute} disabled={loading}>
            {loading ? 'Exécution...' : 'Exécuter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Intégrer dans RawLeadsTable

Dans `components/leads/RawLeadsTable.tsx` :

```typescript
// 1. Importer la modale
import { BulkCustomModal } from './BulkCustomModal';

// 2. Ajouter l'état
const [showBulkCustomModal, setShowBulkCustomModal] = useState(false);

// 3. Créer le handler
const handleBulkCustom = useCallback(() => {
  setShowBulkCustomModal(true);
}, []);

const handleBulkCustomExecute = useCallback(async (param: string) => {
  const selectedIds = Array.from(selected);
  
  setBulkActionProgress({
    show: true,
    action: 'Action personnalisée',
    current: 0,
    total: selectedIds.length,
    status: 'processing',
  });

  try {
    const result = await leadService.customBulkAction(
      selectedIds,
      param,
      (current, total) => {
        setBulkActionProgress(prev => ({
          ...prev,
          current,
          total,
        }));
      }
    );

    setBulkActionProgress(prev => ({
      ...prev,
      status: 'success',
      message: `${result.success} réussis, ${result.failed} échecs`,
    }));

    setTimeout(() => {
      setBulkActionProgress(prev => ({ ...prev, show: false }));
    }, 2000);

    toast.success(`✅ ${result.success} lead(s) traité(s)`);
    onRefresh?.();
  } catch (error) {
    setBulkActionProgress(prev => ({
      ...prev,
      status: 'error',
      message: 'Erreur lors de l\'exécution',
    }));
    setTimeout(() => {
      setBulkActionProgress(prev => ({ ...prev, show: false }));
    }, 3000);
    toast.error('❌ Erreur lors de l\'exécution');
  }
}, [selected, onRefresh]);

// 4. Ajouter la modale au JSX
<BulkCustomModal
  open={showBulkCustomModal}
  onOpenChange={setShowBulkCustomModal}
  selectedCount={selected.size}
  onExecute={handleBulkCustomExecute}
/>
```

### 4. Ajouter à la Barre d'Actions

Dans `components/leads/BulkActionsBar.tsx`, ajoutez un nouveau bouton :

```typescript
interface BulkActionsBarProps {
  // ... props existantes
  onCustom: () => void; // Ajouter
}

// Dans le JSX
<Button
  variant="ghost"
  size="sm"
  onClick={onCustom}
  className="h-8 text-primary-foreground hover:bg-primary-foreground/10"
>
  <YourIcon className="h-4 w-4 mr-1.5" />
  Action Custom
</Button>
```

Et passer le handler depuis RawLeadsTable :

```typescript
<BulkActionsBar
  // ... autres props
  onCustom={handleBulkCustom}
/>
```

## Personnaliser les Comportements de Sélection

### Désactiver la Sélection pour Certaines Lignes

Dans `LeadsTableRow.tsx`, ajoutez une condition :

```typescript
interface LeadsTableRowProps<T> {
  // ... props existantes
  isSelectable?: boolean;
}

export function LeadsTableRow<T extends { id: string }>({ 
  row,
  isSelectable = true, // Par défaut, toutes les lignes sont sélectionnables
  // ...
}: LeadsTableRowProps<T>) {
  if (!isSelectable) {
    return (
      <TableRow className="opacity-50">
        <TableCell>
          <Checkbox disabled />
        </TableCell>
        {/* ... */}
      </TableRow>
    );
  }
  
  // ... reste du code
}
```

### Limiter le Nombre de Sélections

Dans `useLeadsTable.ts`, ajoutez une limite :

```typescript
const MAX_SELECTION = 100;

const toggleSelect = useCallback((id: string, index?: number, event?: { ... }) => {
  setSelected(prev => {
    const newSet = new Set(prev);
    
    // Si on ajoute et qu'on atteint la limite
    if (!newSet.has(id) && newSet.size >= MAX_SELECTION) {
      toast.warning(`Maximum ${MAX_SELECTION} sélections`);
      return prev;
    }
    
    // ... reste de la logique
  });
}, []);
```

### Ajouter des Filtres de Sélection

Ajoutez un bouton pour filtrer la sélection :

```typescript
// Dans RawLeadsTable.tsx
const filterSelectionByStatus = useCallback((status: string) => {
  const filteredIds = allSorted
    .filter(lead => lead.statut === status)
    .map(lead => lead.id);
  
  setSelected(new Set(filteredIds));
  toast.info(`${filteredIds.length} leads avec statut "${status}" sélectionnés`);
}, [allSorted]);

// Dans BulkActionsBar, ajouter un menu
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="ghost" size="sm">
      <Filter className="h-4 w-4 mr-1.5" />
      Filtrer sélection
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => filterSelectionByStatus('nouveau')}>
      Uniquement nouveaux
    </DropdownMenuItem>
    {/* ... autres filtres */}
  </DropdownMenuContent>
</DropdownMenu>
```

## Ajouter des Animations Personnalisées

### Animation sur la Ligne Sélectionnée

Dans `LeadsTableRow.tsx`, utilisez Framer Motion :

```typescript
import { motion } from 'framer-motion';

return (
  <motion.tr
    layout
    initial={false}
    animate={{
      backgroundColor: isSelected ? 'rgb(239 246 255)' : 'transparent',
      borderLeftColor: isSelected ? 'rgb(59 130 246)' : 'transparent',
    }}
    transition={{ duration: 0.2 }}
    onClick={handleRowClick}
    className="cursor-pointer"
  >
    {/* ... */}
  </motion.tr>
);
```

### Animation de la Barre d'Actions

Personnalisez l'animation dans `BulkActionsBar.tsx` :

```typescript
<motion.div
  initial={{ opacity: 0, y: 50, scale: 0.8 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 50, scale: 0.8 }}
  transition={{ 
    duration: 0.3,
    type: "spring",
    stiffness: 200,
    damping: 20
  }}
  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
>
  {/* ... */}
</motion.div>
```

## Sauvegarder et Restaurer les Sélections

### Utiliser localStorage

```typescript
// Dans useLeadsTable.ts
const STORAGE_KEY = 'leads-selection';

// Sauvegarder
useEffect(() => {
  if (selected.size > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selected)));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}, [selected]);

// Restaurer au chargement
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const ids = JSON.parse(saved);
      setSelected(new Set(ids));
    } catch (error) {
      console.error('Erreur restauration sélection:', error);
    }
  }
}, []);
```

### Créer des "Sélections Nommées"

```typescript
interface SavedSelection {
  id: string;
  name: string;
  leadIds: string[];
  createdAt: string;
}

const saveSelection = useCallback((name: string) => {
  const savedSelections = JSON.parse(
    localStorage.getItem('saved-selections') || '[]'
  ) as SavedSelection[];
  
  savedSelections.push({
    id: crypto.randomUUID(),
    name,
    leadIds: Array.from(selected),
    createdAt: new Date().toISOString(),
  });
  
  localStorage.setItem('saved-selections', JSON.stringify(savedSelections));
  toast.success(`Sélection "${name}" sauvegardée`);
}, [selected]);

const loadSelection = useCallback((selectionId: string) => {
  const savedSelections = JSON.parse(
    localStorage.getItem('saved-selections') || '[]'
  ) as SavedSelection[];
  
  const selection = savedSelections.find(s => s.id === selectionId);
  if (selection) {
    setSelected(new Set(selection.leadIds));
    toast.success(`Sélection "${selection.name}" chargée`);
  }
}, []);
```

## Optimisations de Performance

### Virtualisation pour Grandes Listes

Si vous avez beaucoup de lignes, utilisez TanStack Virtual (déjà dans le projet) :

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);

const rowVirtualizer = useVirtualizer({
  count: paginated.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  overscan: 5,
});

return (
  <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
    <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
      {rowVirtualizer.getVirtualItems().map(virtualRow => (
        <LeadsTableRow
          key={paginated[virtualRow.index].id}
          row={paginated[virtualRow.index]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}
          // ...
        />
      ))}
    </div>
  </div>
);
```

### Debouncing des Updates

Pour les actions qui se déclenchent fréquemment :

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSelect = useDebouncedCallback(
  (id: string) => {
    toggleSelect(id);
  },
  100
);
```

## Tests

### Tester la Sélection Multiple

```typescript
// tests/leads/selection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { RawLeadsTable } from '@/components/leads/RawLeadsTable';

describe('Sélection Multiple', () => {
  it('sélectionne une ligne au clic', () => {
    const { container } = render(<RawLeadsTable data={mockData} />);
    const firstRow = container.querySelector('tbody tr');
    
    fireEvent.click(firstRow);
    expect(firstRow).toHaveClass('bg-blue-50');
  });

  it('sélectionne une plage avec Shift', () => {
    const { container } = render(<RawLeadsTable data={mockData} />);
    const rows = container.querySelectorAll('tbody tr');
    
    fireEvent.click(rows[0]);
    fireEvent.click(rows[2], { shiftKey: true });
    
    expect(rows[0]).toHaveClass('bg-blue-50');
    expect(rows[1]).toHaveClass('bg-blue-50');
    expect(rows[2]).toHaveClass('bg-blue-50');
  });
});
```

## Bonnes Pratiques

1. **Toujours afficher un feedback** : Utilisez des toasts, progress bars, animations
2. **Demander confirmation** : Pour les actions destructives (suppression)
3. **Gérer les erreurs** : Afficher des messages clairs en cas d'échec
4. **Optimiser les requêtes** : Utilisez des batch operations quand possible
5. **Tester les edge cases** : Sélection vide, sélection totale, erreurs réseau
6. **Accessibilité** : Utiliser les aria-labels, support clavier
7. **Performance** : Virtualisation pour >1000 lignes, debouncing
8. **UX cohérente** : Animations fluides, états visuels clairs

## Ressources

- [TanStack Table](https://tanstack.com/table/v8)
- [TanStack Virtual](https://tanstack.com/virtual/v3)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI](https://www.radix-ui.com/)
- [shadcn/ui](https://ui.shadcn.com/)
