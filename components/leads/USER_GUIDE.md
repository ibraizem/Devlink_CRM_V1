# Guide Utilisateur - Tableau de Leads Avancé

Bienvenue dans le nouveau système de gestion des leads ! Ce guide vous explique comment utiliser toutes les fonctionnalités avancées.

## 🎯 Vue d'Ensemble

Le tableau de leads offre maintenant une expérience de type Excel avec des interactions avancées pour gérer efficacement vos contacts.

## 🖱️ Menu Contextuel (Clic Droit)

### Comment l'utiliser ?

**Faites un clic droit** sur n'importe quelle cellule ou ligne du tableau pour ouvrir le menu contextuel.

### Actions Disponibles

#### Sur une Cellule
- **Copier la cellule** : Copie la valeur dans votre presse-papiers
- **Filtrer par cette valeur** : Affiche uniquement les leads avec cette valeur

#### Sur une Ligne Complète
- **Copier toute la ligne** : Copie toutes les informations du lead
- **Appeler** : Lance un appel vers ce contact
- **Envoyer un email** : Ouvre votre client email
- **Envoyer un message** : Envoie un SMS ou WhatsApp
- **Ajouter une note** : Ajoute une note au lead
- **Modifier** : Édite les informations du lead
- **Supprimer** : Supprime le lead (avec confirmation)

#### Changer le Statut
Un sous-menu vous permet de changer rapidement le statut :
- 🔵 **Nouveau** : Lead non encore contacté
- 🟡 **En cours** : Contact en cours
- 🟢 **Traité** : Lead converti
- 🔴 **Abandonné** : Lead perdu

### Astuces
- Le menu s'ouvre instantanément au clic droit
- Utilisez la souris ou les flèches du clavier pour naviguer
- Appuyez sur Échap pour fermer le menu

---

## 🔍 Recherche Globale

### Comment l'utiliser ?

**Raccourci :** Appuyez sur **⌘K** (Mac) ou **Ctrl+K** (Windows/Linux)

Ou cliquez sur la barre de recherche en haut du tableau.

### Fonctionnalités

1. **Recherche dans tous les champs** : La recherche parcourt nom, prénom, email, téléphone, entreprise, etc.

2. **Résultats en temps réel** : Les résultats s'affichent instantanément pendant que vous tapez

3. **Highlighting** : Les mots trouvés sont surlignés en jaune

4. **Score de pertinence** : Les résultats les plus pertinents apparaissent en premier

5. **Prévisualisation** : Vous voyez jusqu'à 3 champs correspondants pour chaque lead

### Navigation

- **↑↓** : Parcourir les résultats
- **Entrée** : Sélectionner un lead
- **Échap** : Fermer la recherche

### Exemple

Tapez "dupont" pour trouver tous les leads avec "dupont" dans n'importe quel champ :
- Jean Dupont (nom)
- contact@dupont.com (email)
- Dupont & Associés (entreprise)

---

## 🔧 Filtres par Colonne

### Comment l'utiliser ?

Cliquez sur le bouton **"Filtres"** dans la barre d'outils.

### Étapes

1. **Sélectionner une colonne** : Cliquez sur le nom de la colonne à filtrer

2. **Choisir les valeurs** : 
   - Cochez les valeurs que vous voulez voir
   - Utilisez la barre de recherche pour trouver rapidement une valeur
   - Les nombres entre parenthèses indiquent combien de fois chaque valeur apparaît

3. **Appliquer** : Le tableau se met à jour automatiquement

4. **Ajouter d'autres filtres** : Sélectionnez d'autres colonnes pour affiner

### Gérer les Filtres

- **Badges actifs** : En haut du tableau, vous voyez les filtres appliqués
- **Supprimer un filtre** : Cliquez sur ❌ sur le badge
- **Tout effacer** : Cliquez sur "Effacer tout"

### Exemple

**Objectif :** Trouver tous les leads de Paris en statut "En cours"

1. Cliquez sur "Filtres"
2. Sélectionnez la colonne "Ville"
3. Cochez "Paris"
4. Sélectionnez la colonne "Statut"
5. Cochez "En cours"
6. ✅ Le tableau affiche uniquement les leads correspondants

---

## 📥 Export Multi-Format

### Comment l'utiliser ?

1. **Sélectionner des leads** (optionnel) : Cochez les leads que vous voulez exporter
2. Cliquez sur le bouton **"Exporter"**

### Choisir le Format

#### CSV (Recommandé pour Excel)
- Compatible avec Excel, Google Sheets, Numbers
- Peut être ouvert dans un éditeur de texte
- Idéal pour partager ou importer ailleurs

#### Excel (.xlsx)
- Fichier Excel natif
- Mise en forme automatique
- Largeurs de colonnes ajustées
- Idéal pour analyses complexes

#### JSON
- Format structuré pour développeurs
- Idéal pour intégrations et automatisations
- Peut être utilisé par d'autres applications

### Personnaliser l'Export

1. **Sélectionner les colonnes** :
   - Cochez les colonnes à inclure dans l'export
   - Utilisez "Tout sélectionner" ou "Tout désélectionner"

2. **En-têtes** :
   - Activez pour inclure les noms de colonnes (recommandé)
   - Désactivez pour avoir uniquement les données

3. **Données** :
   - **Leads sélectionnés** : Exporte uniquement votre sélection
   - **Tous les leads** : Exporte toutes les données visibles

### Nom du Fichier

Le fichier téléchargé aura automatiquement :
- Un nom basé sur le contenu : `export_leads_`
- La date et l'heure : `2024-12-05_14h30`
- L'extension appropriée : `.csv`, `.xlsx`, ou `.json`

### Exemple d'Utilisation

**Scénario :** Vous voulez envoyer une liste de contacts à un collègue

1. Filtrez les leads pertinents (ex: Statut = "Nouveau")
2. Sélectionnez quelques leads avec les checkboxes
3. Cliquez sur "Exporter"
4. Choisissez "Excel"
5. Décochez les colonnes sensibles (ex: Notes internes)
6. Cliquez sur "Exporter (15)" → Le fichier est téléchargé !

---

## 🖥️ Mode Plein Écran

### Comment l'utiliser ?

**Raccourci :** Appuyez sur **Ctrl+F** (ou **⌘F** sur Mac)

Ou cliquez sur le bouton **"Plein écran"**.

### Fonctionnalités

- **Affichage maximisé** : Le tableau occupe tout l'écran
- **Plus de lignes visibles** : Voyez plus de leads en même temps
- **Moins de distractions** : Focus uniquement sur vos données

### Navigation

- **Échap** : Quitter le mode plein écran
- **Shift+?** : Afficher tous les raccourcis clavier
- **Bouton "Quitter"** : Dans le coin en haut à droite

### Raccourcis Disponibles

Appuyez sur **Shift+?** en mode plein écran pour voir tous les raccourcis :

| Raccourci | Action |
|-----------|--------|
| `Ctrl+F` | Activer/Désactiver le plein écran |
| `Échap` | Quitter le plein écran |
| `Shift+?` | Afficher/Masquer les raccourcis |
| `⌘K` ou `Ctrl+K` | Ouvrir la recherche globale |

### Astuce

Combinez le mode plein écran avec les autres fonctionnalités :
- Utilisez **Ctrl+F** pour agrandir
- Puis **Ctrl+K** pour rechercher
- Puis **clic droit** sur un résultat pour une action rapide
- Puis **Échap** pour quitter

---

## 💡 Cas d'Usage Courants

### 1. Trouver et Appeler un Contact Rapidement

1. Appuyez sur **Ctrl+K**
2. Tapez le nom du contact
3. **Clic droit** sur le résultat
4. Sélectionnez **"Appeler"**

⏱️ Temps : 5 secondes !

### 2. Exporter les Nouveaux Leads du Mois

1. Cliquez sur **"Filtres"**
2. Filtrez par **Statut = "Nouveau"**
3. Filtrez par **Date de création = Ce mois-ci**
4. Cliquez sur **"Exporter"**
5. Sélectionnez **CSV** et **Toutes les colonnes**
6. **Télécharger** ✅

### 3. Changer le Statut de Plusieurs Leads

1. Cochez les leads concernés
2. **Clic droit** sur un des leads sélectionnés
3. **Changer le statut** → **"En cours"**
4. Tous les leads sélectionnés sont mis à jour !

### 4. Analyser les Leads par Ville

1. Cliquez sur **"Filtres"**
2. Sélectionnez **"Ville"**
3. Regardez les compteurs pour chaque ville
4. Cochez les villes qui vous intéressent
5. Analysez ou exportez les résultats

### 5. Présentation en Réunion

1. Préparez vos filtres (statut, date, etc.)
2. Appuyez sur **Ctrl+F** pour le plein écran
3. Parcourez les leads avec votre équipe
4. **Clic droit** pour des actions en direct
5. Appuyez sur **Échap** pour revenir

---

## 🎓 Conseils et Astuces

### Productivité

1. **Mémorisez les raccourcis** : Ctrl+K pour rechercher, Ctrl+F pour plein écran
2. **Utilisez le clic droit** : Plus rapide que les boutons d'action
3. **Filtrez avant d'exporter** : Pour des exports ciblés
4. **Copiez les cellules** : Clic droit → Copier → Collez ailleurs

### Organisation

1. **Changez les statuts rapidement** : Clic droit → Changer le statut
2. **Ajoutez des notes** : Clic droit → Ajouter une note
3. **Filtrez par valeur** : Clic droit sur une cellule → Filtrer par cette valeur

### Collaboration

1. **Exportez pour partager** : Format Excel ou CSV pour les collègues
2. **JSON pour développeurs** : Pour intégrations automatiques
3. **Sélectionnez les colonnes** : N'exportez que les infos nécessaires

---

## ❓ Foire Aux Questions

### Le menu contextuel ne s'ouvre pas ?

- Assurez-vous de faire un **clic droit** (pas un clic gauche)
- Sur Mac : **Ctrl+Clic** ou clic avec deux doigts

### La recherche ne trouve pas mon lead ?

- Vérifiez l'orthographe
- Essayez une recherche partielle (ex: "dup" au lieu de "dupont")
- La recherche est sensible aux accents

### Mes filtres ne marchent pas ?

- Vérifiez que vous avez bien coché des valeurs
- Cliquez sur "Appliquer" si nécessaire
- Essayez de cliquer sur "Effacer tout" et recommencez

### L'export Excel ne s'ouvre pas ?

- Assurez-vous d'avoir Excel ou une application compatible
- Essayez le format CSV qui s'ouvre dans tous les tableurs
- Sur Mac, utilisez Numbers ou Google Sheets

### Comment quitter le mode plein écran ?

- Appuyez sur **Échap**
- Ou cliquez sur le bouton **"Quitter"** en haut à droite

---

## 📱 Sur Mobile et Tablette

Les fonctionnalités avancées sont optimisées pour mobile :

- **Menu contextuel** : Appui long sur une cellule
- **Recherche** : Bouton de recherche agrandi
- **Filtres** : Interface adaptée au tactile
- **Export** : Dialog plein écran
- **Plein écran** : Utilise tout l'écran disponible

---

## 🆘 Besoin d'Aide ?

Si vous avez des questions ou des problèmes :

1. Consultez ce guide
2. Demandez à votre administrateur
3. Consultez la documentation technique (pour développeurs)

---

## 🎉 Profitez des Fonctionnalités !

Vous avez maintenant tous les outils pour gérer vos leads efficacement. N'hésitez pas à expérimenter et trouver votre workflow idéal !

**Astuce finale :** Combinez toutes les fonctionnalités :
1. 🔍 **Recherchez** avec Ctrl+K
2. 🔧 **Filtrez** pour affiner
3. 🖱️ **Clic droit** pour agir rapidement
4. 📥 **Exportez** pour partager
5. 🖥️ **Plein écran** pour présenter

Bonne gestion de vos leads ! 🚀
