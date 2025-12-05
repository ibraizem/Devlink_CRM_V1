# Guide de migration - Système de vues personnalisées

## 🎯 Objectif

Ce guide vous aide à migrer de l'ancien système `RawLeadsTable` vers le nouveau système `RawLeadsTableWithViews` avec vues personnalisées.

## 📊 Comparaison des systèmes

### Ancien système (RawLeadsTable)
- ❌ Configuration locale (non persistante)
- ❌ Colonnes visibles gérées manuellement
- ❌ Filtres basiques (recherche uniquement)
- ❌ Tri simple (une colonne à la fois)
- ❌ Pas de partage de configuration
- ❌ Réinitialisation à chaque rechargement

### Nouveau système (RawLeadsTableWithViews)
- ✅ Vues sauvegardées en base de données
- ✅ Gestion avancée des colonnes (ordre, largeur)
- ✅ Filtres multiples avec opérateurs variés
- ✅ Tri multi-colonnes avec priorité
- ✅ Partage de vues entre utilisateurs
- ✅ Persistance automatique

## 🚀 Migration en 5 étapes

### Étape 1: Préparer la base de données

**1.1. Créer la table lead_views**

```bash
# Via Supabase Dashboard
# 1. SQL Editor → New Query
# 2. Copier-coller le contenu de lead_views_table.sql
# 3. Run
```

**1.2. Vérifier la création**

```sql
-- Vérifier que la table existe
SELECT * FROM lead_views LIMIT 1;

-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename = 'lead_views';
```

**Résultat attendu**: Table créée avec 6 policies RLS

---

### Étape 2: Sauvegarder les configurations actuelles

**2.1. Identifier les configurations personnalisées**

Dans votre code actuel avec `RawLeadsTable`, recherchez:

```tsx
// Colonnes personnalisées
const [visibleColumns, setVisibleColumns] = useState([...]);

// Filtres personnalisés
const [statusFilter, setStatusFilter] = useState('');
const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

// Tri personnalisé
const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
```

**2.2. Noter ces configurations**

Créez un document temporaire listant:
- Colonnes actuellement visibles
- Filtres actifs
- Tris appliqués
- Configuration par utilisateur/rôle

**Exemple:**
```
Télépros:
- Colonnes: nom, prénom, téléphone, statut
- Filtre: statut = "nouveau"
- Tri: créé_le (décroissant)

Managers:
- Colonnes: nom, email, téléphone, score, agent, statut
- Filtre: score > 50
- Tri: score (décroissant), créé_le (décroissant)
```

---

### Étape 3: Remplacer le composant

**3.1. Mise à jour de l'import**

```tsx
// Avant
import { RawLeadsTable } from '@/components/leads/RawLeadsTable';

// Après
import { RawLeadsTableWithViews } from '@/components/leads/RawLeadsTableWithViews';
```

**3.2. Mise à jour de l'utilisation**

```tsx
// Avant
<RawLeadsTable
  data={filteredLeads}
  columns={columns}
  onExport={handleExport}
  onRefresh={handleRefresh}
/>

// Après (exactement pareil!)
<RawLeadsTableWithViews
  data={filteredLeads}
  columns={columns}
  onExport={handleExport}
  onRefresh={handleRefresh}
/>
```

**3.3. Supprimer les états devenus inutiles**

```tsx
// Ces états peuvent être supprimés
const [visibleColumns, setVisibleColumns] = useState([...]);
const [sortKey, setSortKey] = useState('');
const [sortDir, setSortDir] = useState('asc');
// Les filtres basiques peuvent rester pour la recherche globale
```

**3.4. Tester**

```bash
yarn dev
# Ouvrir http://localhost:3000/leads
# Vérifier que le nouveau bouton "Vues" apparaît
```

---

### Étape 4: Créer les vues équivalentes

**4.1. Créer des vues pour chaque configuration**

Pour chaque configuration identifiée à l'étape 2:

1. Cliquez sur **"Créer une vue"**
2. Configurez les colonnes
3. Ajoutez les filtres
4. Configurez le tri
5. Donnez un nom descriptif
6. Sauvegardez

**4.2. Exemple pratique**

Pour recréer la config "Télépros":

```tsx
// L'utilisateur fait cela via l'interface, mais voici l'équivalent code:
await createView({
  name: 'Vue Télépros',
  description: 'Vue optimisée pour les télépros',
  user_id: userId,
  columns: [
    { key: 'nom', visible: true, order: 0 },
    { key: 'prenom', visible: true, order: 1 },
    { key: 'telephone', visible: true, order: 2 },
    { key: 'statut', visible: true, order: 3 },
  ],
  filters: [
    { field: 'statut', operator: 'equals', value: 'nouveau' },
  ],
  sorts: [
    { field: 'created_at', direction: 'desc' },
  ],
});
```

**4.3. Créer depuis les templates**

Pour gagner du temps, utilisez les templates:

1. **"Nouveaux leads"** → Pour statut = nouveau
2. **"Leads en cours"** → Pour statut = en_cours
3. **"Leads avec téléphone"** → Pour téléphone non vide
4. Puis personnalisez selon vos besoins

---

### Étape 5: Former les utilisateurs

**5.1. Guide utilisateur rapide**

Créez un guide interne (ou utilisez QUICKSTART_CUSTOM_VIEWS.md):

```
📧 Email aux utilisateurs:

Bonjour,

Nous avons mis à jour le système de gestion des leads avec de nouvelles fonctionnalités!

🎯 Nouvelles fonctionnalités:
- Sauvegarde de vos configurations préférées
- Filtres avancés multiples
- Tri sur plusieurs colonnes
- Partage de configurations avec l'équipe

📚 Comment démarrer:
1. Allez sur la page Leads
2. Cliquez sur le bouton "Vues"
3. Sélectionnez un template ou créez votre vue

💡 Vos anciennes habitudes:
- Au lieu de reconfigurer à chaque fois, créez une vue
- Vos vues sont automatiquement sauvegardées
- Vous pouvez créer plusieurs vues pour différents usages

📖 Documentation: [lien vers QUICKSTART_CUSTOM_VIEWS.md]

Bonne utilisation!
```

**5.2. Session de formation**

Organisez une démo de 15-30 minutes:

1. **Demo (10 min)**:
   - Créer une vue simple
   - Utiliser un template
   - Partager une vue

2. **Pratique (10 min)**:
   - Chaque utilisateur crée sa première vue
   - Aide individuelle si besoin

3. **Q&R (10 min)**:
   - Répondre aux questions
   - Astuces et bonnes pratiques

---

## 🔄 Migration progressive (optionnel)

Si vous préférez une migration progressive:

### Option A: Toggle entre ancien et nouveau

```tsx
'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RawLeadsTable } from '@/components/leads/RawLeadsTable';
import { RawLeadsTableWithViews } from '@/components/leads/RawLeadsTableWithViews';

export default function LeadsPage() {
  const [useNewSystem, setUseNewSystem] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Switch
          id="new-system"
          checked={useNewSystem}
          onCheckedChange={setUseNewSystem}
        />
        <Label htmlFor="new-system">
          {useNewSystem ? 'Nouveau système (vues)' : 'Ancien système'}
        </Label>
      </div>

      {useNewSystem ? (
        <RawLeadsTableWithViews {...props} />
      ) : (
        <RawLeadsTable {...props} />
      )}
    </div>
  );
}
```

### Option B: Feature flag

```tsx
// lib/features.ts
export const FEATURES = {
  CUSTOM_VIEWS: process.env.NEXT_PUBLIC_ENABLE_CUSTOM_VIEWS === 'true',
};

// page.tsx
import { FEATURES } from '@/lib/features';

{FEATURES.CUSTOM_VIEWS ? (
  <RawLeadsTableWithViews {...props} />
) : (
  <RawLeadsTable {...props} />
)}
```

### Option C: Par rôle utilisateur

```tsx
const { user } = useAuth();
const isManager = user?.role === 'manager' || user?.role === 'admin';

{isManager ? (
  <RawLeadsTableWithViews {...props} />
) : (
  <RawLeadsTable {...props} />
)}
```

---

## 📋 Checklist de migration

### Pré-migration
- [ ] Lire la documentation (IMPLEMENTATION_SUMMARY_VIEWS.md)
- [ ] Identifier les configurations actuelles
- [ ] Planifier la migration (date, équipe)
- [ ] Préparer la formation utilisateurs

### Migration base de données
- [ ] Backup de la base de données
- [ ] Exécuter lead_views_table.sql
- [ ] Vérifier la création de la table
- [ ] Vérifier les policies RLS
- [ ] Tester les permissions

### Migration code
- [ ] Mettre à jour les imports
- [ ] Remplacer les composants
- [ ] Supprimer les états inutiles
- [ ] Tester en local
- [ ] Tester en staging
- [ ] Code review

### Migration des vues
- [ ] Créer les vues équivalentes
- [ ] Tester chaque vue
- [ ] Partager les vues d'équipe
- [ ] Documenter les vues créées

### Formation
- [ ] Préparer le guide utilisateur
- [ ] Planifier la session de formation
- [ ] Réaliser la démo
- [ ] Recueillir les feedbacks

### Post-migration
- [ ] Monitorer les erreurs
- [ ] Répondre aux questions
- [ ] Ajuster selon feedbacks
- [ ] Documenter les learnings

---

## 🐛 Problèmes courants et solutions

### Problème 1: Les anciennes configurations ont disparu

**Cause**: Normal, elles n'étaient pas persistées

**Solution**: Recréer les vues importantes (voir Étape 4)

---

### Problème 2: Certains utilisateurs ne voient pas le bouton "Vues"

**Cause**: Peut-être encore sur l'ancien composant

**Solution**: 
1. Vérifier l'import dans le code
2. Clear cache navigateur
3. Hard refresh (Ctrl+Shift+R)

---

### Problème 3: Erreur "Table lead_views does not exist"

**Cause**: Script SQL pas exécuté

**Solution**:
```bash
# Exécuter le script
psql < lead_views_table.sql
```

---

### Problème 4: Les vues ne se sauvegardent pas

**Cause**: Problème de permissions RLS

**Solution**:
```sql
-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename = 'lead_views';

-- Réexécuter le script si nécessaire
```

---

### Problème 5: Les filtres ne fonctionnent pas comme avant

**Cause**: Syntaxe différente

**Solution**: Utiliser les opérateurs appropriés:
- Avant: recherche simple
- Après: opérateur "contains" pour recherche dans texte

---

## 📊 Validation post-migration

### Tests fonctionnels
- [ ] Créer une vue
- [ ] Modifier une vue
- [ ] Supprimer une vue
- [ ] Partager une vue
- [ ] Utiliser un template
- [ ] Appliquer des filtres
- [ ] Trier sur plusieurs colonnes

### Tests de performance
- [ ] Chargement initial < 1s
- [ ] Application d'une vue < 500ms
- [ ] Filtrage de 1000+ leads < 2s
- [ ] Pas de lag lors du drag & drop

### Tests utilisateurs
- [ ] 5 utilisateurs créent leur première vue
- [ ] Recueillir les feedbacks
- [ ] Mesurer le taux d'adoption
- [ ] Ajuster selon besoins

---

## 🎓 Retour d'expérience

### Collecte de données

Après 1 semaine:
- Nombre de vues créées par utilisateur
- Vues les plus utilisées
- Problèmes rencontrés
- Suggestions d'amélioration

### Ajustements possibles

Selon les feedbacks:
- Créer des templates additionnels
- Ajuster les vues partagées
- Former sur des fonctionnalités méconnues
- Optimiser les performances

---

## 📞 Support post-migration

### Canaux de support

1. **Documentation**: QUICKSTART_CUSTOM_VIEWS.md
2. **FAQ interne**: À créer selon questions récurrentes
3. **Support IT**: Pour problèmes techniques
4. **Champion utilisateur**: Personne ressource dans chaque équipe

### FAQ post-migration

**Q: Puis-je retrouver mes anciens filtres?**
R: Non, mais vous pouvez les recréer facilement avec les templates

**Q: Combien de vues puis-je créer?**
R: Autant que nécessaire, pas de limite

**Q: Comment partager ma vue avec toute l'équipe?**
R: Menu de la vue → Partager → Activer "Partager avec l'équipe"

**Q: Puis-je revenir à l'ancien système?**
R: Oui temporairement si vous avez gardé le code (voir Option A)

---

## ✅ Critères de succès

La migration est réussie quand:

1. **Technique**:
   - ✅ Tous les tests passent
   - ✅ Aucune erreur en production
   - ✅ Performance acceptable

2. **Utilisateurs**:
   - ✅ 80%+ des utilisateurs ont créé ≥1 vue
   - ✅ Feedbacks positifs
   - ✅ Pas de demandes de rollback

3. **Business**:
   - ✅ Productivité maintenue ou améliorée
   - ✅ Moins de questions support
   - ✅ Adoption progressive

---

## 🎉 Conclusion

La migration vers le système de vues personnalisées apporte:
- ✅ Plus de flexibilité
- ✅ Meilleure productivité
- ✅ Configuration persistante
- ✅ Collaboration améliorée

**Durée estimée de migration**: 2-4 heures (technique) + 1-2 jours (adoption utilisateurs)

**Bon courage pour la migration!** 🚀
