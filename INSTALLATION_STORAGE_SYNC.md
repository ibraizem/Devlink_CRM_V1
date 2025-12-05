# Installation du Système de Synchronisation Storage

## Prérequis
- Compte Supabase avec un projet configuré
- Bucket Storage `fichiers` créé
- Variables d'environnement configurées:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Étapes d'Installation

### 1. Créer le Bucket Storage (si pas déjà fait)

Dans le dashboard Supabase:
1. Allez dans "Storage"
2. Créez un bucket nommé `fichiers`
3. Configurez les permissions:
   - Public: Non
   - File size limit: 50 MB (ou selon vos besoins)

### 2. Configurer les RLS Policies du Bucket

```sql
-- Policy pour lire ses propres fichiers
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'fichiers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy pour uploader ses propres fichiers
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fichiers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy pour supprimer ses propres fichiers
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'fichiers' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Exécuter les Migrations SQL

Connectez-vous à votre base de données Supabase et exécutez les migrations dans l'ordre:

#### a) Vérifier que la table `fichiers_import` existe
```sql
-- Si elle n'existe pas, exécutez:
-- lib/utils/supabase/migrations/20241019000000_create_fichiers_import.sql
```

#### b) Créer les nouvelles tables
```sql
-- Exécutez le contenu de:
-- lib/utils/supabase/migrations/20241020000000_create_storage_sync_tables.sql
```

### 4. Vérifier les Tables Créées

```sql
-- Vérifier que toutes les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'storage_files',
    'column_mappings',
    'import_history',
    'duplicate_records'
);
```

### 5. Tester la Configuration

1. Démarrez l'application: `yarn dev`
2. Accédez à `/fichiers/storage-sync`
3. Uploadez un fichier test dans le bucket via le dashboard Supabase
4. Cliquez sur "Détecter nouveaux" pour vérifier que le fichier est détecté

## Structure du Bucket

Les fichiers doivent être organisés par utilisateur:
```
bucket: fichiers/
├── {user_id_1}/
│   ├── fichier1.csv
│   ├── fichier2.xlsx
│   └── ...
├── {user_id_2}/
│   ├── fichier1.csv
│   └── ...
```

## Configuration des Permissions

### RLS sur les Tables

Toutes les tables ont déjà les policies RLS configurées dans la migration. Vérifiez qu'elles sont actives:

```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'storage_files',
    'column_mappings',
    'import_history',
    'duplicate_records'
);
```

Toutes les tables doivent avoir `rowsecurity = true`.

## Dépannage

### Erreur: "Bucket not found"
**Solution**: Créez le bucket `fichiers` dans le dashboard Supabase

### Erreur: "Permission denied"
**Solution**: Vérifiez les RLS policies du bucket et des tables

### Erreur: "Files not detected"
**Solution**: Assurez-vous que les fichiers sont dans le dossier `{user_id}/`

### Erreur lors de la migration SQL
**Solution**: Vérifiez que:
1. Vous avez les droits admin sur la base de données
2. La fonction `update_updated_at_column()` existe
3. L'extension `uuid-ossp` est activée

```sql
-- Activer uuid-ossp si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Vérification Post-Installation

### 1. Test de Détection
```sql
-- Insérer un fichier test manuellement
INSERT INTO public.storage_files (
    storage_path,
    bucket_name,
    nom_fichier,
    est_importe,
    user_id
) VALUES (
    'test-user-id/test.csv',
    'fichiers',
    'test.csv',
    false,
    'test-user-id'
);
```

### 2. Test de Mapping
```sql
-- Insérer un mapping test
INSERT INTO public.column_mappings (
    nom,
    description,
    mapping,
    user_id
) VALUES (
    'Test Mapping',
    'Mapping de test',
    '{"nom": {"source_column": "nom", "target_column": "nom", "type": "text", "required": true}}'::jsonb,
    'test-user-id'
);
```

### 3. Nettoyer les Tests
```sql
-- Supprimer les données de test
DELETE FROM public.storage_files WHERE user_id = 'test-user-id';
DELETE FROM public.column_mappings WHERE user_id = 'test-user-id';
```

## Maintenance

### Nettoyage Régulier

Pour nettoyer les anciens imports:

```sql
-- Supprimer les imports de plus de 3 mois
DELETE FROM public.import_history 
WHERE created_at < NOW() - INTERVAL '3 months'
AND rollback_effectue = false;

-- Supprimer les doublons orphelins
DELETE FROM public.duplicate_records 
WHERE import_history_id NOT IN (SELECT id FROM public.import_history);
```

### Monitoring

Requêtes utiles pour le monitoring:

```sql
-- Statistiques globales
SELECT 
    COUNT(*) as total_imports,
    SUM(nb_lignes_importees) as total_lignes,
    AVG(nb_lignes_doublons::float / NULLIF(nb_lignes_total, 0)) as taux_doublons
FROM public.import_history
WHERE statut = 'termine';

-- Imports récents avec erreurs
SELECT 
    ih.created_at,
    fi.nom as fichier,
    ih.nb_lignes_erreurs,
    ih.erreurs
FROM public.import_history ih
JOIN public.fichiers_import fi ON fi.id = ih.fichier_id
WHERE ih.statut = 'erreur'
ORDER BY ih.created_at DESC
LIMIT 10;

-- Fichiers les plus importés
SELECT 
    sf.nom_fichier,
    COUNT(ih.id) as nb_imports,
    SUM(ih.nb_lignes_importees) as total_lignes
FROM public.storage_files sf
JOIN public.import_history ih ON ih.fichier_id = sf.fichier_id
GROUP BY sf.nom_fichier
ORDER BY nb_imports DESC;
```

## Support

Pour toute question ou problème, consultez:
- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Documentation Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- Fichier `STORAGE_SYNC.md` pour la documentation complète
