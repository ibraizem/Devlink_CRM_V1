# Guide de démarrage rapide - Vues personnalisées

## 🚀 Installation en 3 étapes

### 1. Créer la table en base de données

Connectez-vous à votre dashboard Supabase et exécutez le script SQL:

```bash
# Via Supabase Dashboard
# 1. Allez dans "SQL Editor"
# 2. Cliquez sur "New Query"
# 3. Copiez-collez le contenu de lead_views_table.sql
# 4. Cliquez sur "Run"
```

Ou via psql:
```bash
psql -h your-db-host -U your-user -d your-database -f lead_views_table.sql
```

### 2. Vérifier les dépendances

Les dépendances sont déjà installées dans le projet. Si besoin:

```bash
yarn install
```

### 3. Intégrer dans votre page

**Option A: Remplacement simple** (recommandé)

Dans `app/leads/page.tsx`, remplacez:

```tsx
import { RawLeadsTable } from '@/components/leads/RawLeadsTable';
```

Par:

```tsx
import { RawLeadsTableWithViews } from '@/components/leads/RawLeadsTableWithViews';
```

Et dans le JSX:

```tsx
// Avant
<RawLeadsTable
  data={filteredLeads}
  columns={columns}
  onExport={handleExport}
  onRefresh={handleRefresh}
/>

// Après
<RawLeadsTableWithViews
  data={filteredLeads}
  columns={columns}
  onExport={handleExport}
  onRefresh={handleRefresh}
/>
```

**C'est tout!** 🎉

## 🎯 Utilisation rapide

### Créer votre première vue

1. Allez sur la page leads
2. Cliquez sur le bouton **"Vues"** dans la toolbar
3. Sélectionnez **"Créer une nouvelle vue"**
4. Donnez un nom à votre vue
5. Configurez:
   - **Colonnes**: Sélectionnez lesquelles afficher et dans quel ordre
   - **Filtres**: Ajoutez des conditions de filtrage
   - **Tri**: Définissez l'ordre de tri
6. Cliquez sur **"Créer la vue"**

### Utiliser un template prédéfini

1. Cliquez sur **"Vues"**
2. Dans la section **"Templates prédéfinis"**, choisissez:
   - 🌟 Nouveaux leads
   - ⏰ Leads en cours
   - ✅ Leads traités
   - ❌ Leads abandonnés
   - 📞 Leads avec téléphone
   - 📧 Leads avec email
   - ⭐ Leads prioritaires
3. Le template est appliqué instantanément!

### Partager une vue

1. Cliquez sur **"Vues"** → **"Mes vues"**
2. Survolez une vue et cliquez sur les **3 points**
3. Sélectionnez **"Partager"**
4. Activez **"Partager avec l'équipe"**
5. Cliquez sur **"Partager"**

## 📋 Exemples de vues utiles

### Vue "Leads à appeler aujourd'hui"

**Colonnes**: Nom, Prénom, Téléphone, Statut, Dernière activité
**Filtres**:
- Statut = "nouveau" OU "en_cours"
- Téléphone n'est pas vide
**Tri**: Dernière activité (croissant)

### Vue "Leads chauds prioritaires"

**Colonnes**: Nom, Email, Score, Statut, Entreprise
**Filtres**:
- Score > 70
- Statut = "nouveau"
**Tri**: Score (décroissant)

### Vue "Leads à relancer"

**Colonnes**: Nom, Email, Téléphone, Statut, Dernière activité
**Filtres**:
- Statut = "en_cours"
- Dernière activité < (date d'il y a 7 jours)
**Tri**: Dernière activité (croissant)

## 🎨 Personnalisation avancée

### Ajuster la largeur des colonnes

1. Dans la configuration de la vue
2. Onglet **"Colonnes"**
3. Pour chaque colonne, définissez une largeur en pixels
4. Exemple: Nom (200px), Email (250px), Téléphone (150px)

### Créer des filtres complexes

Exemple: Leads nouveaux OU en cours, avec email ET téléphone

```
Filtre 1: Statut = "nouveau"
Filtre 2: Statut = "en_cours" [OU]
Filtre 3: Email n'est pas vide [ET]
Filtre 4: Téléphone n'est pas vide [ET]
```

### Tri multi-niveaux

1. Onglet **"Tri"**
2. Ajoutez plusieurs tris:
   - Tri 1: Statut (croissant)
   - Tri 2: Score (décroissant)
   - Tri 3: Date de création (décroissant)

Les leads seront triés d'abord par statut, puis par score, puis par date.

## 🔧 Dépannage rapide

### La table n'existe pas
```
❌ Erreur: relation "lead_views" does not exist
```
→ Exécutez le script SQL `lead_views_table.sql`

### Pas de bouton "Vues"
```
❌ Le composant ne s'affiche pas
```
→ Vérifiez que vous utilisez `RawLeadsTableWithViews` et non `RawLeadsTable`

### Les vues ne se sauvegardent pas
```
❌ Erreur lors de la sauvegarde
```
→ Vérifiez:
1. Que vous êtes connecté (Clerk)
2. Les policies RLS dans Supabase
3. La console navigateur pour les erreurs

### Erreur d'authentification
```
❌ User ID is null
```
→ Vérifiez que Clerk est correctement configuré (voir `AGENTS.md`)

## 📚 Ressources

- **Documentation complète**: `CUSTOM_VIEWS_SYSTEM.md`
- **Guide d'intégration**: `INTEGRATION_EXAMPLE.md`
- **Script SQL**: `lead_views_table.sql`
- **Code source**: `components/leads/`

## 💡 Astuces pro

1. **Nommage**: Utilisez des noms descriptifs comme "Leads chauds septembre 2024"
2. **Organisation**: Créez une vue par type d'action (appels, emails, relances)
3. **Partage**: Ne partagez que les vues stables avec toute l'équipe
4. **Templates**: Commencez par les templates et personnalisez-les
5. **Colonnes**: 5-8 colonnes visibles est un bon compromis pour la lisibilité
6. **Filtres**: Testez d'abord avec des filtres simples, puis ajoutez la complexité
7. **Sauvegarde**: Dupliquez une vue avant de faire des changements importants

## 🎓 Prochaines étapes

Une fois à l'aise avec les bases:

1. Créez des vues pour chaque étape de votre workflow
2. Partagez les vues utiles avec votre équipe
3. Utilisez les templates comme base pour vos vues personnalisées
4. Combinez filtres et tris pour des vues très ciblées
5. Explorez les opérateurs de filtrage avancés

**Bon travail avec vos vues personnalisées!** 🚀
