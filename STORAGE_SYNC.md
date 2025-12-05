# Système d'Import et Synchronisation depuis Supabase Storage

## Vue d'ensemble

Le système d'import et synchronisation permet de détecter automatiquement les nouveaux fichiers dans le bucket Supabase Storage, de prévisualiser les données avant import, de configurer des mappings de colonnes réutilisables, de détecter les doublons et de gérer l'historique des imports avec possibilité de rollback.

## Fonctionnalités

### 1. Détection Automatique des Fichiers
- Scanne le bucket `fichiers` pour détecter les nouveaux fichiers
- Affiche les fichiers non encore importés
- Stocke les métadonnées dans la table `storage_files`

### 2. Prévisualisation avant Import
- Affiche un aperçu des 50 premières lignes du fichier
- Détecte automatiquement les colonnes
- Suggère un mapping intelligent basé sur les noms de colonnes

### 3. Mapping Intelligent des Colonnes
- Détection automatique des types (texte, nombre, email, téléphone, date)
- Transformation des données (majuscules, minuscules, trim, capitalize)
- Validation des champs requis
- Valeurs par défaut configurables
- Sauvegarde et réutilisation des mappings

### 4. Import Incrémental avec Détection de Doublons
- Détection de doublons basée sur un hash de champs sélectionnés
- Import par lots configurable (batch size)
- Option pour ignorer les erreurs et continuer l'import
- Suivi de la progression en temps réel

### 5. Historique et Rollback
- Historique complet des imports avec statistiques
- Possibilité d'annuler un import (rollback)
- Détails des erreurs et doublons pour chaque import
- Consultation des données en doublon

## Architecture

### Tables de Base de Données

#### `storage_files`
Stocke les fichiers détectés dans le Storage
```sql
- id (UUID, PK)
- storage_path (TEXT, chemin complet dans Storage)
- bucket_name (TEXT, nom du bucket)
- nom_fichier (TEXT)
- taille (INTEGER)
- content_type (TEXT)
- checksum (TEXT)
- est_importe (BOOLEAN)
- fichier_id (UUID, FK vers fichiers_import)
- import_history_id (UUID, FK vers import_history)
- derniere_detection (TIMESTAMP)
- user_id (UUID, FK vers auth.users)
```

#### `column_mappings`
Stocke les mappings de colonnes réutilisables
```sql
- id (UUID, PK)
- nom (TEXT)
- description (TEXT)
- mapping (JSONB, configuration complète du mapping)
- user_id (UUID, FK vers auth.users)
```

#### `import_history`
Historique des imports avec possibilité de rollback
```sql
- id (UUID, PK)
- fichier_id (UUID, FK vers fichiers_import)
- user_id (UUID, FK vers auth.users)
- statut (TEXT: en_attente, en_cours, termine, erreur, annule)
- nb_lignes_total (INTEGER)
- nb_lignes_importees (INTEGER)
- nb_lignes_doublons (INTEGER)
- nb_lignes_erreurs (INTEGER)
- mapping_utilise (JSONB)
- erreurs (JSONB, liste des erreurs)
- peut_rollback (BOOLEAN)
- rollback_effectue (BOOLEAN)
- rollback_at (TIMESTAMP)
```

#### `duplicate_records`
Stocke les doublons détectés
```sql
- id (UUID, PK)
- import_history_id (UUID, FK vers import_history)
- ligne_numero (INTEGER)
- donnees (JSONB, données de la ligne en doublon)
- raison_doublon (TEXT)
- hash_donnees (TEXT, hash pour comparaison)
```

### Services

#### `storageSyncService`
- `detectNewFiles()`: Détecte les nouveaux fichiers dans Storage
- `getUnimportedFiles()`: Récupère les fichiers non importés
- `previewFile()`: Prévisualise un fichier
- `suggestColumnMapping()`: Suggère un mapping automatique
- `calculateRowHash()`: Calcule le hash d'une ligne pour détecter les doublons
- `markAsImported()`: Marque un fichier comme importé
- `getSyncStats()`: Récupère les statistiques de synchronisation

#### `importService`
- `startImport()`: Lance un import avec détection de doublons
- `parseFile()`: Parse un fichier Excel ou CSV
- `transformRow()`: Transforme une ligne selon le mapping
- `rollbackImport()`: Annule un import
- `getImportHistory()`: Récupère l'historique
- `getDuplicates()`: Récupère les doublons d'un import

#### `columnMappingService`
- `createMapping()`: Crée un mapping réutilisable
- `getMappings()`: Récupère tous les mappings
- `getMapping()`: Récupère un mapping spécifique
- `updateMapping()`: Met à jour un mapping
- `deleteMapping()`: Supprime un mapping
- `duplicateMapping()`: Duplique un mapping
- `validateMapping()`: Valide un mapping
- `applyMapping()`: Applique un mapping sur des données

### Composants UI

#### `StorageSyncPanel`
Panneau principal de synchronisation
- Affiche les statistiques (total, importés, en attente)
- Liste les fichiers non importés
- Bouton de détection de nouveaux fichiers

#### `ImportPreviewModal`
Modal de prévisualisation
- Onglet: Aperçu des données (tableau)
- Onglet: Configuration du mapping
- Validation avant import

#### `ColumnMappingEditor`
Éditeur de mapping
- Configuration par colonne (type, transformation, valeur par défaut)
- Validation en temps réel
- Sauvegarde du mapping

#### `SavedMappingsPanel`
Gestion des mappings sauvegardés
- Liste des mappings
- Actions: Sélectionner, Dupliquer, Supprimer

#### `ImportWizard`
Assistant d'import
- Configuration des options (détection doublons, batch size, etc.)
- Suivi de la progression
- Résumé des résultats

#### `ImportHistoryPanel`
Historique des imports
- Liste des imports avec statistiques
- Détails des erreurs et doublons
- Bouton de rollback

## Utilisation

### 1. Accéder à la page de synchronisation
```
/fichiers/storage-sync
```

### 2. Détecter les nouveaux fichiers
Cliquez sur "Détecter nouveaux" pour scanner le bucket Storage

### 3. Sélectionner un fichier
Cliquez sur un fichier pour voir la prévisualisation

### 4. Configurer le mapping
- Dans l'onglet "Configuration mapping", ajustez les paramètres
- Optionnel: Sauvegardez le mapping pour le réutiliser
- Ou sélectionnez un mapping existant dans la liste

### 5. Configurer l'import
- Activez/désactivez la détection de doublons
- Sélectionnez les champs à comparer
- Configurez les options d'erreur
- Ajustez la taille des lots

### 6. Lancer l'import
Suivez la progression en temps réel

### 7. Consulter l'historique
Dans l'onglet "Historique", consultez tous vos imports passés

### 8. Rollback (si nécessaire)
Cliquez sur "Annuler" dans l'historique pour annuler un import

## Configuration de Mappings Intelligents

### Patterns de détection automatique
Le système détecte automatiquement les colonnes selon ces patterns:

- **Nom**: nom, name, lastname, surname → type: text
- **Prénom**: prenom, firstname → type: text
- **Email**: email, e-mail, mail, courriel → type: email
- **Téléphone**: tel, telephone, phone, mobile, portable → type: phone
- **Entreprise**: entreprise, company, societe, organization → type: text
- **Adresse**: adresse, address, rue, street → type: text
- **Ville**: ville, city, town → type: text
- **Code Postal**: code postal, zip, postal → type: text
- **Pays**: pays, country → type: text
- **Statut**: statut, status, etat, state → type: text
- **Montant**: montant, amount, prix, price → type: number
- **Date**: date, created, cree → type: date

### Transformations disponibles
- **trim**: Supprime les espaces en début et fin
- **uppercase**: Convertit en MAJUSCULES
- **lowercase**: Convertit en minuscules
- **capitalize**: Première lettre en majuscule

## Détection de Doublons

### Algorithme
1. Calcul d'un hash SHA-256 basé sur les champs sélectionnés
2. Comparaison avec les hashes des données existantes
3. Si doublon détecté: stockage dans `duplicate_records`
4. Si unique: insertion dans `fichier_donnees`

### Configuration
- Sélectionnez les champs à comparer (ex: email, téléphone)
- Le système normalise les valeurs (trim + lowercase) avant comparaison
- Les doublons sont enregistrés mais pas importés

## Rollback

### Conditions
- L'import doit avoir le statut "terminé"
- Le flag `peut_rollback` doit être à true
- Le rollback ne doit pas avoir déjà été effectué

### Processus
1. Suppression de toutes les données importées
2. Mise à jour du statut de l'historique
3. Réinitialisation du statut du fichier
4. Mise à jour de la table storage_files

## Performance

### Optimisations
- Import par lots (batch) configurable
- Traitement asynchrone avec progression
- Index sur les tables pour les recherches
- Hash pour détection rapide des doublons

### Recommandations
- Batch size: 100-500 lignes selon la complexité des données
- Pour les gros fichiers (>10 000 lignes): batch size = 100
- Pour les petits fichiers (<1 000 lignes): batch size = 500

## Sécurité

### Row Level Security (RLS)
Toutes les tables sont protégées par RLS:
- Les utilisateurs ne voient que leurs propres données
- Les politiques filtrent par `user_id`

### Validation
- Validation des types de données
- Vérification des champs requis
- Validation des emails et téléphones
- Gestion des erreurs sans crash

## Migration

Pour créer les tables nécessaires, exécutez:
```sql
-- Voir le fichier: lib/utils/supabase/migrations/20241020000000_create_storage_sync_tables.sql
```

## Troubleshooting

### Problème: Fichiers non détectés
**Solution**: Vérifiez que les fichiers sont dans le dossier `{user_id}/` du bucket

### Problème: Erreur lors de l'import
**Solution**: Consultez l'historique pour voir les erreurs détaillées

### Problème: Doublons non détectés
**Solution**: Vérifiez que les bons champs sont sélectionnés pour la comparaison

### Problème: Rollback impossible
**Solution**: Vérifiez que l'import est terminé et n'a pas déjà été annulé
