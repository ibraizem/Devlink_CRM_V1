# Configuration des fonctions Supabase pour la synchronisation

## ⚠️ Correction importante - Colonne `fichier_id` manquante

L'erreur `column "fichier_id" does not exist` a été corrigée. Le script ajoute maintenant automatiquement :
- La colonne `fichier_id` à la table `leads` 
- La colonne `source_import` pour tracer l'origine des leads
- Les colonnes manquantes `nb_lignes_importees` et `donnees` à `fichiers_import`
- Les index nécessaires pour les performances

## Instructions

Pour résoudre l'erreur `400 Bad Request` lors de l'appel à `manual_sync_all_leads`, vous devez exécuter le script SQL suivant dans votre base de données Supabase.

## Étapes

1. **Ouvrir l'éditeur SQL Supabase**
   - Allez dans votre projet Supabase
   - Cliquez sur "SQL Editor" dans le menu latéral
   - Cliquez sur "New query"

2. **Exécuter le script principal**
   - Copiez tout le contenu du fichier `sync_leads_trigger.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" pour exécuter le script

3. **Vérifier l'installation (optionnel)**
   - Copiez le contenu du fichier `test_sync_fix.sql`
   - Exécutez-le pour vérifier que tout est correctement installé

## Fonctions créées

Le script crée les fonctions RPC suivantes :

### `manual_sync_all_leads()`
- **Description** : Synchronise tous les fichiers actifs avec leurs leads
- **Retour** : Nombre de fichiers traités
- **Usage** : `SELECT manual_sync_all_leads();`

### `manual_sync_file_leads(p_file_id UUID)`
- **Description** : Synchronise un fichier spécifique avec ses leads
- **Paramètres** : `p_file_id` (UUID) - ID du fichier à synchroniser
- **Retour** : Nombre de leads synchronisés
- **Usage** : `SELECT manual_sync_file_leads('votre-file-id');`

### `update_file_with_leads_data(p_file_id UUID, p_leads_data JSONB)`
- **Description** : Met à jour un fichier avec des données de leads
- **Paramètres** : 
  - `p_file_id` (UUID) - ID du fichier
  - `p_leads_data` (JSONB) - Données des leads
- **Retour** : Boolean
- **Usage** : `SELECT update_file_with_leads_data('votre-file-id', '[{"nom": "Doe", ...}]');`

### `cleanup_orphaned_leads()`
- **Description** : Nettoie les leads orphelins
- **Retour** : Nombre de leads supprimés
- **Usage** : `SELECT cleanup_orphaned_leads();`

## Colonnes ajoutées automatiquement

### Table `leads`
- `fichier_id` (UUID) - Référence au fichier d'importation
- `source_import` (TEXT) - Origine du lead ('manuel', 'fichier_import', etc.)

### Table `fichiers_import` 
- `nb_lignes_importees` (INTEGER) - Nombre de lignes réellement importées
- `donnees` (JSONB) - Données structurées des leads

## Tables créées

### `sync_logs`
Table pour journaliser les synchronisations avec les colonnes :
- `id` (UUID) - Clé primaire
- `sync_type` (VARCHAR) - Type de synchronisation
- `file_id` (UUID) - ID du fichier (optionnel)
- `files_processed` (INTEGER) - Nombre de fichiers traités
- `leads_before` (INTEGER) - Nombre de leads avant
- `leads_after` (INTEGER) - Nombre de leads après
- `sync_date` (TIMESTAMP) - Date de synchronisation
- `error_message` (TEXT) - Message d'erreur (optionnel)
- `user_id` (UUID) - ID de l'utilisateur (optionnel)

## Index créés

Pour optimiser les performances :
- `idx_leads_fichier_id` sur `leads(fichier_id)`
- `idx_leads_source_import` sur `leads(source_import)`
- `idx_leads_campaign_id` sur `leads(campaign_id)`
- `idx_fichiers_import_statut` sur `fichiers_import(statut)`
- `idx_campaign_files_file_id` sur `campaign_files(file_id)`
- `idx_sync_logs_sync_date` sur `sync_logs(sync_date)`

## Triggers créés

Les triggers suivants sont créés automatiquement :

- `trigger_sync_leads_on_insert` - Déclenché lors de l'insertion dans `fichiers_import`
- `trigger_sync_leads_on_update` - Déclenché lors de la mise à jour dans `fichiers_import`
- `trigger_sync_leads_on_delete` - Déclenché lors de la suppression dans `fichiers_import`
- `trigger_sync_leads_on_campaign_file_insert` - Déclenché lors de l'association fichier-campagne
- `trigger_sync_leads_on_campaign_file_delete` - Déclenché lors de la dissociation fichier-campagne

## Vérification

Après avoir exécuté le script, vous pouvez vérifier que les fonctions sont bien créées :

```sql
-- Lister toutes les fonctions RPC
SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%sync%' OR proname LIKE '%manual%';

-- Vérifier les triggers
SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname LIKE '%sync%';

-- Vérifier les colonnes ajoutées
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name IN ('fichier_id', 'source_import');
```

## Dépannage

Si vous rencontrez des erreurs après l'exécution :

1. **Vérifiez que les tables existent** : `leads`, `fichiers_import`, `campaign_files`
2. **Vérifiez les permissions** : L'utilisateur doit avoir les droits nécessaires
3. **Vérifiez les colonnes** : Le script ajoute les colonnes manquantes automatiquement
4. **Exécutez le script de test** : Utilisez `test_sync_fix.sql` pour diagnostiquer

## Notes importantes

- Le script utilise `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` pour éviter les erreurs
- Les fonctions incluent une validation des données pour éviter les erreurs
- Les triggers sont configurés pour s'exécuter `AFTER` les opérations DML
- La table `sync_logs` permet de suivre l'historique des synchronisations
- Les index sont créés avec `IF NOT EXISTS` pour éviter les conflits
