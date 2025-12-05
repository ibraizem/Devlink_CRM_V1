# Quick Start - Système de Sélection Multiple

## 🎯 Utilisation Rapide

### Sélectionner des Leads

```
Click               → Sélectionner 1 ligne
Ctrl/Cmd + Click    → Ajouter à la sélection
Shift + Click       → Sélectionner plage
Checkbox en-tête    → Sélectionner la page
Ctrl+A              → Tout sélectionner
Escape              → Désélectionner tout
```

### Actions Groupées Disponibles

Dès qu'au moins 1 ligne est sélectionnée, une barre apparaît en bas avec :

| Action | Icône | Description |
|--------|-------|-------------|
| **Assigner** | 👤 | Attribuer à un utilisateur |
| **Statut** | 🏷️ | Changer le statut |
| **Email** | ✉️ | Envoyer un email |
| **SMS** | 💬 | Envoyer un SMS |
| **Export** | 📥 | Exporter en CSV |
| **Supprimer** | 🗑️ | Supprimer (avec confirmation) |

## 📁 Fichiers Principaux

```
components/leads/
├── RawLeadsTable.tsx          # Composant principal
├── BulkActionsBar.tsx         # Barre d'actions
└── Bulk*Modal.tsx             # Modales d'actions

hooks/
└── useLeadsTable.ts           # Hook de sélection

lib/services/
└── leadService.ts             # Services backend
```

## 💻 Exemple d'Utilisation

```typescript
import { RawLeadsTable } from '@/components/leads';

function MyPage() {
  const { data, columns } = useCrmData2(fileIds);
  
  return (
    <RawLeadsTable
      data={data}
      columns={columns}
      onExport={(ids) => console.log('Export:', ids)}
      onRefresh={() => console.log('Refresh')}
    />
  );
}
```

## 📖 Documentation Complète

- **[README.md](./components/leads/README.md)** - Documentation utilisateur
- **[SELECTION_SYSTEM.md](./components/leads/SELECTION_SYSTEM.md)** - Technique
- **[EXTENDING_SELECTION.md](./components/leads/EXTENDING_SELECTION.md)** - Extension
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Résumé

## ✨ Fonctionnalités Clés

✅ Sélection multiple (Shift/Ctrl)  
✅ Barre d'actions flottante  
✅ 6 actions groupées  
✅ Progress tracking  
✅ Confirmations  
✅ Animations fluides  
✅ Raccourcis clavier  

## 🚀 Status

**Version** : 1.0.0  
**Status** : ✅ Production Ready  
**Documentation** : ✅ Complète  
**Tests** : ✅ Validés
