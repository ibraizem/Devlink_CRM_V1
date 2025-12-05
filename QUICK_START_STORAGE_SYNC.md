# Quick Start - Système de Synchronisation Storage

## 🚀 Démarrage Rapide

### Étape 1: Exécuter les Migrations (5 min)

1. Ouvrez le dashboard Supabase
2. Allez dans "SQL Editor"
3. Créez une nouvelle query
4. Copiez-collez le contenu de:
   ```
   lib/utils/supabase/migrations/20241020000000_create_storage_sync_tables.sql
   ```
5. Exécutez la query

### Étape 2: Vérifier le Bucket (1 min)

1. Dans Supabase, allez dans "Storage"
2. Vérifiez que le bucket `fichiers` existe
3. Si non, créez-le avec:
   - Nom: `fichiers`
   - Public: Non
   - File size limit: 50MB

### Étape 3: Tester (2 min)

1. Démarrez l'app: `yarn dev`
2. Allez sur: `http://localhost:3000/fichiers/storage-sync`
3. Uploadez un fichier test dans Supabase Storage (dans le dossier de votre user_id)
4. Cliquez sur "Détecter nouveaux"
5. Sélectionnez le fichier détecté
6. Configurez et lancez l'import

## 📁 Fichiers Importants

- **Documentation**: `STORAGE_SYNC.md`
- **Installation**: `INSTALLATION_STORAGE_SYNC.md`
- **Code**: `IMPLEMENTATION_SUMMARY.md`
- **Liste fichiers**: `FICHIERS_IMPLEMENTATION.md`

## ✅ Vérification

### La migration a fonctionné ?
```sql
-- Exécutez dans Supabase SQL Editor:
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
Vous devriez voir 4 tables.

### Le bucket est configuré ?
Allez dans Storage > fichiers, vous devriez pouvoir uploader un fichier.

### L'app fonctionne ?
```bash
yarn dev
# Puis ouvrez http://localhost:3000/fichiers/storage-sync
```

## 🎯 Fonctionnalités Principales

1. **Détection Auto**: Scanne votre bucket Storage
2. **Prévisualisation**: Voir les données avant import
3. **Mapping Smart**: Configuration automatique des colonnes
4. **Import Incrémental**: Par lots avec progression
5. **Détection Doublons**: Hash SHA-256 sur champs sélectionnés
6. **Historique**: Tous vos imports avec stats
7. **Rollback**: Annuler un import si besoin

## 🔧 Problèmes Fréquents

### Fichiers non détectés
➡️ Vérifiez qu'ils sont dans `{user_id}/` dans le bucket

### Erreur RLS
➡️ Vérifiez que les migrations ont été exécutées

### Import bloqué
➡️ Vérifiez la console pour les erreurs

## 📞 Support

- Voir `STORAGE_SYNC.md` pour documentation complète
- Voir `INSTALLATION_STORAGE_SYNC.md` pour troubleshooting
- Vérifier les logs dans la console navigateur

## 🎉 C'est Tout !

Le système est prêt à l'emploi. Bonne utilisation !
