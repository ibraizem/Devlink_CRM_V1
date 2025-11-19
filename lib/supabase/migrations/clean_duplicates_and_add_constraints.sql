-- Nettoyer les doublons existants puis ajouter les contraintes d'unicité

-- 1. Nettoyer les doublons dans teams
-- Garder la première occurrence (la plus ancienne) et supprimer les autres
WITH ranked_teams AS (
    SELECT id, name, created_by, created_at,
           ROW_NUMBER() OVER (PARTITION BY name, created_by ORDER BY created_at) as rn
    FROM teams
)
DELETE FROM teams 
WHERE id IN (
    SELECT id FROM ranked_teams WHERE rn > 1
);

-- 2. Nettoyer les doublons dans campaigns  
-- Garder la première occurrence (la plus ancienne) et supprimer les autres
WITH ranked_campaigns AS (
    SELECT id, name, created_by, created_at,
           ROW_NUMBER() OVER (PARTITION BY name, created_by ORDER BY created_at) as rn
    FROM campaigns
)
DELETE FROM campaigns 
WHERE id IN (
    SELECT id FROM ranked_campaigns WHERE rn > 1
);

-- 3. Ajouter les contraintes d'unicité (par utilisateur)
-- Permettre aux différents utilisateurs d'avoir des noms identiques
ALTER TABLE teams ADD CONSTRAINT unique_team_name_per_user UNIQUE(name, created_by);
ALTER TABLE campaigns ADD CONSTRAINT unique_campaign_name_per_user UNIQUE(name, created_by);

-- 4. Afficher un résumé du nettoyage
DO $$
DECLARE
    teams_count integer;
    campaigns_count integer;
BEGIN
    SELECT COUNT(*) INTO teams_count FROM teams;
    SELECT COUNT(*) INTO campaigns_count FROM campaigns;
    
    RAISE NOTICE 'Nettoyage terminé: % équipes, % campagnes restantes', teams_count, campaigns_count;
END $$;
