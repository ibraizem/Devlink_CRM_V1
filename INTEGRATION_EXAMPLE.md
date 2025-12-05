# Exemple d'intégration du système de vues personnalisées

## Option 1: Remplacement complet dans app/leads/page.tsx

Pour intégrer le nouveau système de vues dans la page des leads existante, remplacez simplement l'import de `RawLeadsTable` par `RawLeadsTableWithViews`:

```tsx
// Remplacer cette ligne:
import { RawLeadsTable } from '@/components/leads/RawLeadsTable';

// Par celle-ci:
import { RawLeadsTableWithViews } from '@/components/leads/RawLeadsTableWithViews';
```

Puis dans le JSX, remplacez:

```tsx
<RawLeadsTable
  data={filteredLeads}
  columns={columns}
  onExport={handleExport}
  onRefresh={handleRefresh}
/>
```

Par:

```tsx
<RawLeadsTableWithViews
  data={filteredLeads}
  columns={columns}
  onExport={handleExport}
  onRefresh={handleRefresh}
/>
```

C'est tout! Le composant `RawLeadsTableWithViews` est un remplacement direct qui ajoute toutes les fonctionnalités de vues personnalisées.

## Option 2: Intégration progressive avec les deux composants

Si vous voulez offrir aux utilisateurs le choix entre l'ancienne et la nouvelle vue, vous pouvez utiliser un toggle:

```tsx
'use client';

import { useState } from 'react';
import { RawLeadsTable } from '@/components/leads/RawLeadsTable';
import { RawLeadsTableWithViews } from '@/components/leads/RawLeadsTableWithViews';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

export default function LeadsPage() {
  const [useAdvancedViews, setUseAdvancedViews] = useState(true);

  // ... reste du code ...

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-blue-800 font-bold tracking-tight">
              Espace Leads
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseAdvancedViews(!useAdvancedViews)}
            >
              {useAdvancedViews ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Vues avancées activées
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Vue simple
                </>
              )}
            </Button>
          </div>

          <div>
            <label className="text-sm font-medium">Fichier source</label>
            <FichierSelecteur
              onFichierSelect={(id) => setSelectedFileId(id)}
              fileLineCounts={fileLineCounts}
              availableFiles={availableFiles}
              selectedFileId={selectedFileId}
            />
          </div>

          <Card>
            {useAdvancedViews ? (
              <RawLeadsTableWithViews
                data={filteredLeads}
                columns={columns}
                onExport={handleExport}
                onRefresh={handleRefresh}
              />
            ) : (
              <RawLeadsTable
                data={filteredLeads}
                columns={columns}
                onExport={handleExport}
                onRefresh={handleRefresh}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
```

## Option 3: Utilisation autonome des composants

Vous pouvez aussi utiliser les composants individuellement pour créer votre propre interface:

```tsx
'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useLeadViews } from '@/hooks/useLeadViews';
import { ViewManager } from '@/components/leads/ViewManager';
import { ViewConfigPanel } from '@/components/leads/ViewConfigPanel';
import { AdvancedViewDialog } from '@/components/leads/AdvancedViewDialog';
import { applyFilters, applySorts } from '@/lib/utils/viewFilters';

export default function CustomLeadsView() {
  const { user } = useUser();
  const {
    userViews,
    sharedViews,
    templateViews,
    currentView,
    createView,
    updateView,
    deleteView,
    duplicateView,
    shareViewWithTeam,
    applyView,
    createFromTemplate,
  } = useLeadViews(user?.id || null);

  const [showConfig, setShowConfig] = useState(false);
  const [columns, setColumns] = useState(currentView?.columns || []);
  const [filters, setFilters] = useState(currentView?.filters || []);
  const [sorts, setSorts] = useState(currentView?.sorts || []);

  // Votre logique de données...
  const filteredData = applyFilters(rawData, filters);
  const sortedData = applySorts(filteredData, sorts);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <ViewManager
          userViews={userViews}
          sharedViews={sharedViews}
          templateViews={templateViews}
          currentView={currentView}
          onCreateView={createView}
          onUpdateView={updateView}
          onDeleteView={deleteView}
          onDuplicateView={duplicateView}
          onShareView={shareViewWithTeam}
          onApplyView={applyView}
          onCreateFromTemplate={createFromTemplate}
        />
        
        <Button onClick={() => setShowConfig(!showConfig)}>
          Configurer
        </Button>
      </div>

      {showConfig && (
        <ViewConfigPanel
          columns={columns}
          filters={filters}
          sorts={sorts}
          availableFields={availableFields}
          onColumnsChange={setColumns}
          onFiltersChange={setFilters}
          onSortsChange={setSorts}
        />
      )}

      {/* Votre tableau personnalisé */}
      <YourCustomTable data={sortedData} />
    </div>
  );
}
```

## Migration depuis RawLeadsTable

Si vous avez des customisations sur `RawLeadsTable`, voici comment les migrer:

### 1. Props personnalisées

Les deux composants acceptent les mêmes props de base:
- `data`: Tableau de leads
- `columns`: Configuration des colonnes
- `onExport`: Fonction d'export
- `onRefresh`: Fonction de rafraîchissement

### 2. Gestion des colonnes

**Avant (RawLeadsTable):**
```tsx
const [visibleColumns, setVisibleColumns] = useState(['name', 'email']);
```

**Après (RawLeadsTableWithViews):**
Les colonnes visibles sont gérées automatiquement par la vue courante. Vous n'avez plus besoin de gérer cet état manuellement.

### 3. Filtres et tri

**Avant:**
```tsx
const [sortKey, setSortKey] = useState('');
const [sortDir, setSortDir] = useState('asc');
```

**Après:**
Ces états sont également gérés automatiquement par le système de vues.

### 4. Conservation des fonctionnalités

Toutes les fonctionnalités de `RawLeadsTable` sont conservées dans `RawLeadsTableWithViews`:
- ✅ Recherche globale
- ✅ Sélection multiple
- ✅ Export CSV
- ✅ Actions sur les leads (call, note, edit, delete)
- ✅ Pagination
- ✅ Tri des colonnes

Plus les nouvelles fonctionnalités:
- ✨ Vues personnalisées sauvegardables
- ✨ Filtres avancés multiples
- ✨ Tri complexe multi-colonnes
- ✨ Gestion avancée des colonnes
- ✨ Partage de vues
- ✨ Templates prédéfinis

## Testez en local

1. Créez la table en base de données:
```bash
# Via Supabase Dashboard SQL Editor
# Copiez-collez le contenu de lead_views_table.sql
```

2. Les dépendances sont déjà installées (vérifiez package.json)

3. Modifiez votre page leads:
```bash
# Éditez app/leads/page.tsx
# Remplacez RawLeadsTable par RawLeadsTableWithViews
```

4. Testez:
```bash
yarn dev
```

5. Naviguez vers http://localhost:3000/leads

Vous devriez voir:
- Un nouveau bouton "Vues" dans la toolbar
- Un bouton "Créer une vue"
- La possibilité de créer, modifier et partager des vues
- Des templates prédéfinis disponibles

## Dépannage

### Erreur: "Table lead_views does not exist"
→ Exécutez le script SQL `lead_views_table.sql` dans votre base de données

### Erreur: "Module not found: @dnd-kit/..."
→ Les dépendances sont déjà dans package.json, exécutez `yarn install`

### Les vues ne se sauvegardent pas
→ Vérifiez les policies RLS dans Supabase (voir lead_views_table.sql)

### L'authentification ne fonctionne pas
→ Vérifiez que Clerk est correctement configuré (voir AGENTS.md)

## Support

Pour toute question ou problème, consultez:
- `CUSTOM_VIEWS_SYSTEM.md` - Documentation complète du système
- `lead_views_table.sql` - Script de création de la table
- Les composants dans `components/leads/` - Code source commenté
