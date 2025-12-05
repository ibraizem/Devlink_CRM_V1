# Système de Sélection Multiple Avancé

## Vue d'ensemble

Le système de sélection multiple permet aux utilisateurs de sélectionner et manipuler plusieurs leads simultanément avec une interface intuitive et des raccourcis clavier.

## Fonctionnalités

### 1. Modes de Sélection

#### Sélection Simple (Click)
- Cliquer sur une checkbox ou une ligne pour sélectionner/désélectionner
- La ligne sélectionnée s'affiche avec un fond bleu clair

#### Sélection Multiple (Ctrl/Cmd + Click)
- Maintenir Ctrl (Windows/Linux) ou Cmd (Mac) et cliquer
- Permet d'ajouter ou retirer des éléments de la sélection

#### Sélection en Plage (Shift + Click)
- Cliquer sur un élément, puis maintenir Shift et cliquer sur un autre
- Sélectionne tous les éléments entre les deux clics
- Fonctionne uniquement sur la page courante

#### Sélection de Page (Checkbox en-tête)
- Cliquer sur la checkbox dans l'en-tête du tableau
- Sélectionne/désélectionne toutes les lignes de la page courante
- Affiche un état indéterminé (opacité réduite) si certaines lignes sont sélectionnées

#### Sélection Totale (Toutes les pages)
- Bouton "Tout sélectionner" dans la barre d'actions groupées
- Sélectionne TOUTES les lignes (même celles sur d'autres pages)
- Affiche le nombre total de lignes sélectionnées

### 2. Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Click` | Sélectionner/désélectionner une ligne |
| `Ctrl+Click` / `Cmd+Click` | Ajouter à la sélection |
| `Shift+Click` | Sélectionner une plage |
| `Ctrl+A` / `Cmd+A` | Tout sélectionner (toutes les pages) |
| `Escape` | Désélectionner tout |

### 3. Barre d'Actions Groupées

La barre flottante apparaît automatiquement en bas de l'écran dès qu'au moins une ligne est sélectionnée.

#### Informations Affichées
- Nombre de lignes sélectionnées
- Bouton "Tout sélectionner" si toutes les lignes ne sont pas sélectionnées
- Indication "(Toutes les lignes)" si tout est sélectionné

#### Actions Disponibles

##### Assigner
- Attribuer les leads sélectionnés à un utilisateur
- Ouvre une modale avec liste déroulante des utilisateurs
- Icône : 👤 UserPlus

##### Changer le Statut
- Menu déroulant avec 4 statuts :
  - Nouveau (🔵 bleu)
  - En cours (🟡 jaune)
  - Traité (🟢 vert)
  - Abandonné (🔴 rouge)
- Change le statut de tous les leads sélectionnés
- Icône : 🏷️ Tag

##### Envoyer Email
- Ouvre une modale pour composer un email
- Champs : Objet, Message
- Support des variables de personnalisation : {nom}, {prenom}, {email}
- Icône : ✉️ Mail

##### Envoyer SMS
- Ouvre une modale pour composer un SMS
- Limite de 160 caractères avec compteur
- Support des variables de personnalisation : {nom}, {prenom}
- Icône : 💬 MessageSquare

##### Exporter
- Exporte les leads sélectionnés en CSV
- Inclut toutes les colonnes visibles
- Icône : 📥 Download

##### Supprimer
- Supprime tous les leads sélectionnés
- Demande confirmation avant suppression
- Action irréversible
- Icône : 🗑️ Trash2 (en rouge)

##### Désélectionner
- Bouton ✖️ à droite de la barre
- Efface toute la sélection

### 4. Indicateurs Visuels

#### Lignes Sélectionnées
- Fond bleu clair (`bg-blue-50`)
- Checkbox cochée

#### Lignes Non-Sélectionnées
- Fond blanc
- Effet hover gris clair (`hover:bg-gray-100`)

#### En-tête de Tableau
- Checkbox vide : Aucune sélection
- Checkbox cochée : Toute la page sélectionnée
- Checkbox semi-transparente : Sélection partielle

#### Barre d'Actions
- Fond primaire avec texte clair
- Animation d'entrée/sortie (fade + slide)
- Ombre portée importante pour contraste
- Position fixe en bas, centrée

### 5. Gestion de la Pagination

#### Sélection par Page
- La sélection via la checkbox d'en-tête ne concerne que la page courante
- Changer de page conserve les sélections des autres pages

#### Sélection Totale
- Le bouton "Tout sélectionner" sélectionne TOUTES les lignes filtrées
- Utile pour les opérations sur l'ensemble du dataset

#### Navigation
- Les sélections persistent lors de la navigation entre pages
- La barre d'actions reste visible quelle que soit la page

### 6. États et Gestion

#### Hook `useLeadsTable`
Le hook gère :
- État de sélection (`Set<string>` d'IDs)
- Index de la dernière ligne sélectionnée (pour Shift+Click)
- Fonctions : `toggleSelect`, `toggleSelectAll`, `selectAllPages`, `clearSelection`
- Détection des états : `isAllPageSelected`, `isSomePageSelected`

#### Composants

**RawLeadsTable**
- Composant principal du tableau
- Gère les modales d'actions groupées
- Coordonne la sélection et les actions

**LeadsTableHeader**
- En-tête avec checkbox de sélection de page
- Support de l'état indéterminé

**LeadsTableRow**
- Ligne avec gestion des événements de sélection
- Support Shift/Ctrl/Cmd

**BulkActionsBar**
- Barre d'actions flottante
- Affichage conditionnel avec animation
- Gestion de toutes les actions groupées

**Modales d'Actions**
- `BulkAssignModal` : Attribution à un utilisateur
- `BulkEmailModal` : Envoi d'emails
- `BulkSmsModal` : Envoi de SMS

**SelectionHelpTooltip**
- Tooltip d'aide dans la toolbar
- Affiche les raccourcis clavier disponibles

## Exemples d'Utilisation

### Sélectionner 5 leads consécutifs
1. Cliquer sur le premier lead
2. Maintenir Shift
3. Cliquer sur le 5ème lead
4. → Les 5 leads sont sélectionnés

### Sélectionner des leads non-consécutifs
1. Cliquer sur un lead
2. Maintenir Ctrl/Cmd
3. Cliquer sur d'autres leads
4. → Chaque lead cliqué s'ajoute à la sélection

### Tout sélectionner et exporter
1. Appuyer sur Ctrl+A (ou cliquer "Tout sélectionner")
2. Cliquer sur "Exporter" dans la barre d'actions
3. → CSV généré avec tous les leads

### Changer le statut de plusieurs leads
1. Sélectionner les leads souhaités
2. Cliquer sur "Statut" dans la barre d'actions
3. Choisir un nouveau statut
4. → Tous les leads sont mis à jour

## Bonnes Pratiques

1. **Performance** : La sélection utilise un `Set<string>` pour des opérations O(1)
2. **Accessibilité** : Tous les boutons ont des `aria-label`
3. **UX** : Feedback visuel immédiat sur chaque action
4. **Sécurité** : Confirmation avant les actions destructives
5. **Persistance** : Les sélections sont conservées en navigation
6. **Shortcuts** : Les raccourcis ne s'activent pas dans les champs de saisie

## Architecture Technique

```
useLeadsTable (Hook)
  ├─ État de sélection (Set<string>)
  ├─ Fonctions de sélection
  └─ Raccourcis clavier (useEffect)

RawLeadsTable (Composant Principal)
  ├─ LeadsTableToolbar
  │   └─ SelectionHelpTooltip
  ├─ BulkActionsBar (conditionnel)
  ├─ Table
  │   ├─ LeadsTableHeader
  │   │   └─ Checkbox (sélection page)
  │   └─ LeadsTableRow (x N)
  │       └─ Checkbox (sélection ligne)
  └─ Modales
      ├─ BulkAssignModal
      ├─ BulkEmailModal
      └─ BulkSmsModal
```

## Améliorations Futures

- [ ] Filtrer la sélection (garder seulement les leads d'un certain statut)
- [ ] Inverser la sélection
- [ ] Sauvegarder des sélections comme "groupes"
- [ ] Historique des sélections récentes
- [ ] Drag & Drop pour sélection visuelle
- [ ] Actions personnalisées via plugins
