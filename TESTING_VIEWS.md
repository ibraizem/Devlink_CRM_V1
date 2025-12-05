# Guide de test - Système de vues personnalisées

## Tests manuels

### Test 1: Création d'une vue basique

**Objectif**: Vérifier qu'une vue peut être créée et sauvegardée

**Étapes**:
1. Naviguez vers la page leads
2. Cliquez sur "Vues" → "Créer une nouvelle vue"
3. Entrez un nom: "Test Vue 1"
4. Entrez une description: "Vue de test"
5. Cliquez sur "Créer la vue"

**Résultat attendu**:
- ✅ Un message de succès s'affiche
- ✅ La vue apparaît dans "Mes vues"
- ✅ La vue est sélectionnée comme vue courante

---

### Test 2: Configuration des colonnes

**Objectif**: Vérifier la gestion des colonnes

**Étapes**:
1. Créez une nouvelle vue ou éditez une existante
2. Allez dans l'onglet "Colonnes"
3. Décochez "Email"
4. Réorganisez les colonnes par drag & drop
5. Définissez une largeur de 250px pour "Nom"
6. Sauvegardez

**Résultat attendu**:
- ✅ La colonne Email disparaît du tableau
- ✅ L'ordre des colonnes change
- ✅ La largeur de "Nom" est de 250px
- ✅ Les changements persistent après rechargement

---

### Test 3: Ajout de filtres

**Objectif**: Vérifier le système de filtrage

**Étapes**:
1. Ouvrez la configuration d'une vue
2. Onglet "Filtres"
3. Ajoutez: Statut = "nouveau"
4. Ajoutez: Score > 70 (condition: ET)
5. Sauvegardez et appliquez

**Résultat attendu**:
- ✅ Seuls les leads avec statut "nouveau" ET score > 70 sont affichés
- ✅ Le compteur de leads reflète le filtre
- ✅ Les filtres persistent après rechargement

---

### Test 4: Tri multi-colonnes

**Objectif**: Vérifier le tri complexe

**Étapes**:
1. Configuration → Onglet "Tri"
2. Ajoutez: Statut (croissant)
3. Ajoutez: Score (décroissant)
4. Appliquez

**Résultat attendu**:
- ✅ Les leads sont groupés par statut
- ✅ Dans chaque groupe, triés par score décroissant
- ✅ L'ordre persiste après changement de page

---

### Test 5: Partage de vue

**Objectif**: Vérifier le partage entre utilisateurs

**Étapes**:
1. Avec Utilisateur A:
   - Créez une vue "Vue Partagée"
   - Partagez avec l'équipe
2. Avec Utilisateur B:
   - Vérifiez la présence dans "Vues partagées"
   - Appliquez la vue

**Résultat attendu**:
- ✅ Utilisateur B voit la vue dans "Vues partagées"
- ✅ Utilisateur B peut appliquer la vue
- ✅ Utilisateur B ne peut pas modifier la vue originale
- ✅ Utilisateur B peut dupliquer la vue

---

### Test 6: Templates prédéfinis

**Objectif**: Vérifier les templates

**Étapes**:
1. Cliquez sur "Vues" → "Templates prédéfinis"
2. Sélectionnez "Nouveaux leads"

**Résultat attendu**:
- ✅ Une nouvelle vue est créée
- ✅ Les filtres du template sont appliqués
- ✅ Seuls les leads "nouveau" sont affichés
- ✅ La vue apparaît dans "Mes vues"

---

### Test 7: Duplication de vue

**Objectif**: Vérifier la duplication

**Étapes**:
1. Mes vues → Sélectionnez une vue
2. Menu (3 points) → "Dupliquer"

**Résultat attendu**:
- ✅ Une copie est créée avec "(copie)" dans le nom
- ✅ Toutes les configurations sont copiées
- ✅ Les deux vues sont indépendantes

---

### Test 8: Modification de vue

**Objectif**: Vérifier l'édition

**Étapes**:
1. Mes vues → Sélectionnez une vue
2. Menu → "Modifier"
3. Changez le nom et la description
4. Modifiez les filtres
5. Sauvegardez

**Résultat attendu**:
- ✅ Les changements sont sauvegardés
- ✅ Le nom mis à jour apparaît dans le menu
- ✅ Les nouveaux filtres sont appliqués

---

### Test 9: Suppression de vue

**Objectif**: Vérifier la suppression

**Étapes**:
1. Mes vues → Sélectionnez une vue de test
2. Menu → "Supprimer"
3. Confirmez

**Résultat attendu**:
- ✅ Une confirmation est demandée
- ✅ La vue disparaît de "Mes vues"
- ✅ Si c'était la vue courante, retour à la vue par défaut

---

### Test 10: Persistance

**Objectif**: Vérifier la sauvegarde des états

**Étapes**:
1. Créez une vue complexe avec filtres et tri
2. Appliquez la vue
3. Rafraîchissez la page (F5)

**Résultat attendu**:
- ✅ La vue courante est toujours sélectionnée
- ✅ Les filtres sont appliqués
- ✅ Le tri est maintenu
- ✅ Les colonnes visibles sont identiques

---

## Tests de cas limites

### Test 11: Vue sans colonnes

**Étapes**:
1. Créez une vue
2. Décochez toutes les colonnes
3. Tentez de sauvegarder

**Résultat attendu**:
- ✅ Au moins 3 colonnes essentielles restent visibles
- OU
- ✅ Un message d'erreur empêche la sauvegarde

---

### Test 12: Filtres contradictoires

**Étapes**:
1. Ajoutez: Statut = "nouveau" (ET)
2. Ajoutez: Statut = "traite" (ET)
3. Appliquez

**Résultat attendu**:
- ✅ Aucun lead n'est affiché (filtre impossible)
- ✅ Message informatif: "Aucun lead ne correspond"

---

### Test 13: Performance avec beaucoup de filtres

**Étapes**:
1. Créez une vue avec 10+ filtres
2. Appliquez sur un dataset de 1000+ leads

**Résultat attendu**:
- ✅ Le filtrage s'effectue en moins de 2 secondes
- ✅ Pas de freeze de l'interface
- ✅ Pagination fonctionne correctement

---

### Test 14: Noms spéciaux

**Étapes**:
1. Créez des vues avec:
   - Caractères spéciaux: "Vue @#$%"
   - Émojis: "Vue 🎯"
   - Très long nom: "Vue avec un nom extrêmement long..."

**Résultat attendu**:
- ✅ Tous les noms sont acceptés
- ✅ L'affichage est correct dans le menu
- ✅ Pas de corruption en base de données

---

### Test 15: Partage et permissions

**Étapes**:
1. Utilisateur A partage une vue
2. Utilisateur B tente de supprimer la vue partagée
3. Utilisateur B tente de modifier la vue partagée

**Résultat attendu**:
- ✅ B ne peut pas supprimer (ou erreur claire)
- ✅ B ne peut pas modifier (ou erreur claire)
- ✅ B peut dupliquer et modifier sa copie

---

## Checklist de validation

Avant de déployer en production, vérifiez:

### Base de données
- [ ] Table `lead_views` créée
- [ ] Indexes créés
- [ ] Trigger `updated_at` fonctionne
- [ ] RLS policies actives
- [ ] Permissions correctes

### Fonctionnalités
- [ ] Création de vues
- [ ] Modification de vues
- [ ] Suppression de vues
- [ ] Duplication de vues
- [ ] Partage avec équipe
- [ ] Application de vues
- [ ] Templates disponibles

### Interface
- [ ] Menu "Vues" accessible
- [ ] Dialogs s'ouvrent correctement
- [ ] Configuration panel responsive
- [ ] Drag & drop colonnes fonctionne
- [ ] Messages de succès/erreur clairs
- [ ] Loading states visibles

### Performance
- [ ] Chargement vues < 500ms
- [ ] Application filtres < 1s (1000 leads)
- [ ] Tri < 500ms (1000 leads)
- [ ] Pas de re-renders inutiles

### Compatibilité
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile (responsive)

### Données
- [ ] Filtres appliqués correctement
- [ ] Tri respecté
- [ ] Colonnes visibles/cachées OK
- [ ] Export CSV inclut filtres
- [ ] Pagination cohérente

## Tests automatisés (pour plus tard)

Exemples de tests à implémenter:

```typescript
// test/viewService.test.ts
describe('viewService', () => {
  it('should create a view', async () => {
    const view = await viewService.createView({
      name: 'Test',
      user_id: 'user123',
      columns: [],
      filters: [],
      sorts: [],
    });
    expect(view.id).toBeDefined();
    expect(view.name).toBe('Test');
  });

  it('should apply filters correctly', () => {
    const data = [
      { id: '1', statut: 'nouveau', score: 80 },
      { id: '2', statut: 'traite', score: 60 },
    ];
    const filters = [
      { field: 'statut', operator: 'equals', value: 'nouveau' },
    ];
    const result = applyFilters(data, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should sort data correctly', () => {
    const data = [
      { id: '1', score: 60 },
      { id: '2', score: 80 },
    ];
    const sorts = [
      { field: 'score', direction: 'desc' },
    ];
    const result = applySorts(data, sorts);
    expect(result[0].id).toBe('2');
  });
});
```

## Rapport de bug

Si vous trouvez un bug, incluez:

1. **Description**: Que se passe-t-il ?
2. **Étapes pour reproduire**: Comment reproduire le bug ?
3. **Résultat attendu**: Que devrait-il se passer ?
4. **Résultat actuel**: Que se passe-t-il vraiment ?
5. **Environnement**:
   - Navigateur et version
   - Données de test utilisées
   - Logs console
   - Screenshots si pertinent

## Support

Pour des questions sur les tests:
- Consultez `CUSTOM_VIEWS_SYSTEM.md`
- Vérifiez `INTEGRATION_EXAMPLE.md`
- Examinez le code source dans `components/leads/`
