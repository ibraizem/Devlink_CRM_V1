# 🚀 Installation Complète de la Base de Données CRM

## 📋 Vue d'Ensemble

Ce guide décrit l'installation complète et sécurisée de l'architecture de la base de données pour votre CRM, incluant:
- ✅ Politiques RLS (Row-Level Security) sécurisées
- ⚡ Triggers protégés contre la récursion infinie
- 🔧 Fonctions RPC pour les opérations manuelles
- 📊 Tables optimisées avec index appropriés

## 🗂️ Fichiers d'Installation

### 1. `setup_complete_rls.sql`
Configure les politiques RLS pour les trois tables principales:
- **fichiers_import**: Les utilisateurs voient uniquement leurs propres fichiers
- **leads**: Accès basé sur les campagnes, assignations ou fichiers importés
- **lead_actions**: Accès aux actions des leads accessibles

### 2. `setup_safe_triggers.sql`
Crée l'architecture de synchronisation sécurisée:
- **Protection anti-récursion**: Variable de session pour éviter les boucles infinies
- **Table de liaison**: `campaign_file_links` pour associer fichiers et campagnes
- **Logs de synchronisation**: `sync_logs` pour tracer toutes les opérations
- **Fonctions RPC**: `manual_sync_file()` et `get_file_statistics()`

### 3. `setup_lead_actions.sql`
Configure la gestion complète des actions:
- **Structure complète**: Types, statuts, priorités, assignations
- **Actions automatiques**: Création d'actions par défaut sur nouveaux leads
- **Fonctions RPC**: CRUD complet sur les actions
- **Index optimisés**: Performance garantie

### 4. `setup_complete_database.sql`
Script d'installation complet qui:
- Combine tous les scripts précédents
- Inclut la validation de l'installation
- Crée des tests automatiques
- Génère un rapport d'état

## 🛠️ Installation Étape par Étape

### Prérequis
- Accès administrateur à votre base Supabase
- Les tables `fichiers_import`, `leads`, `lead_actions` doivent exister
- Les tables `campaigns`, `team_campaigns`, `team_members` doivent exister

### Étape 1: Exécution des Scripts

**Option A: Installation Complète (Recommandée)**
```sql
-- Exécuter dans l'éditeur SQL Supabase
-- Copier-coller le contenu de setup_complete_database.sql
```

**Option B: Installation Modulaire**
```sql
-- 1. Configuration RLS
-- Exécuter setup_complete_rls.sql

-- 2. Configuration Triggers
-- Exécuter setup_safe_triggers.sql

-- 3. Configuration Actions
-- Exécuter setup_lead_actions.sql
```

### Étape 2: Validation

Après l'exécution, vérifiez dans la console:
- ✅ 15/15 étapes réussies
- 🎉 Message "INSTALLATION COMPLÈTE RÉUSSIE"

## 🔍 Validation de l'Installation

### Tests Automatiques
Le script `setup_complete_database.sql` inclut des tests automatiques qui:
- Créent un fichier de test si les tables sont vides
- Vérifient que les triggers fonctionnent
- Valident la création automatique des leads

### Vérification Manuelle

```sql
-- Vérifier les politiques RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('fichiers_import', 'leads', 'lead_actions');

-- Vérifier les triggers
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%sync%';

-- Vérifier les fonctions RPC
SELECT proname 
FROM pg_proc 
WHERE proname IN ('manual_sync_file', 'create_lead_action', 'get_file_statistics');
```

## 🚀 Utilisation

### Import de Fichiers
L'import fonctionne maintenant automatiquement:
1. Uploadez un fichier via l'interface
2. Le trigger crée automatiquement les leads dans la table `leads`
3. Les logs sont enregistrés dans `sync_logs`
4. Les actions par défaut sont créées pour chaque lead

### Opérations Manuelles

```sql
-- Synchroniser manuellement un fichier
SELECT * FROM manual_sync_file('votre-fichier-id');

-- Obtenir les statistiques d'un fichier
SELECT * FROM get_file_statistics('votre-fichier-id');

-- Créer une action sur un lead
SELECT * FROM create_lead_action(
    'lead-id',
    'appel',
    'Premier appel',
    'Contacter le lead pour qualification',
    'haute',
    NOW() + INTERVAL '1 day'
);

-- Lister les actions d'un lead
SELECT * FROM get_lead_actions('lead-id');
```

## 🔒 Sécurité

### Politiques RLS
- **Isolation stricte**: Chaque utilisateur ne voit que ses données
- **Héritage de permissions**: Accès via campagnes, équipes ou fichiers
- **Validation automatique**: Protection contre les insertions invalides

### Protection Anti-Récursion
- **Variable de session**: `myapp.is_in_trigger` empêche les boucles
- **Gestion d'erreurs**: Logs détaillés en cas de problème
- **Rollback automatique**: Nettoyage en cas d'erreur

## 📊 Performance

### Index Optimisés
- Index sur tous les champs de recherche fréquents
- Index composites pour les requêtes complexes
- Index sur les timestamps pour les rapports temporels

### Monitoring
- Table `sync_logs` pour tracer les performances
- Métadonnées JSON pour informations additionnelles
- Logs d'erreurs détaillés

## 🐛 Dépannage

### Erreurs Courantes

**"stack depth limit exceeded"**
- ✅ Résolu avec la protection anti-récursion
- ✅ Variable de session empêche les boucles infinies

**"row-level security policy violation"**
- ✅ Politiques RLS correctement configurées
- ✅ Héritage via campagnes et équipes

**"relation does not exist"**
- Vérifiez que les tables de base existent
- Exécutez les scripts dans l'ordre correct

### Vérification

```sql
-- État général des tables
SELECT * FROM get_file_statistics('votre-fichier-id');

-- Logs récents
SELECT * FROM sync_logs 
ORDER BY sync_date DESC 
LIMIT 10;

-- Leads non synchronisés
SELECT COUNT(*) FROM leads 
WHERE source_import = 'fichier_import' 
AND updated_at < NOW() - INTERVAL '1 hour';
```

## 🔄 Maintenance

### Nettoyage Régulier
```sql
-- Nettoyer les vieux logs (30 jours)
DELETE FROM sync_logs 
WHERE sync_date < NOW() - INTERVAL '30 days';

-- Archiver les actions terminées
UPDATE lead_actions 
SET statut = 'archivee' 
WHERE statut = 'terminee' 
AND updated_at < NOW() - INTERVAL '90 days';
```

### Monitoring
```sql
-- Performance des synchronisations
SELECT 
    DATE_TRUNC('day', sync_date) as jour,
    COUNT(*) as nb_sync,
    AVG(leads_after - leads_before) as moy_leads,
    COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as erreurs
FROM sync_logs 
GROUP BY jour 
ORDER BY jour DESC 
LIMIT 30;
```

## 📞 Support

En cas de problème:
1. Vérifiez les logs dans `sync_logs`
2. Testez avec un fichier simple
3. Exécutez le script de validation
4. Contactez le support avec les messages d'erreur exacts

---

**🎯 L'installation est maintenant prête pour une utilisation en production !**
