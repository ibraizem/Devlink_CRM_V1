-- Ajout de contraintes d'unicité pour éviter les doublons

-- Ajouter une contrainte d'unicité sur le nom des équipes
-- Note: UNIQUE(name) empêchera totalement les doublons
-- Si vous voulez permettre des doublons avec des created_by différents, utilisez:
-- ALTER TABLE teams ADD CONSTRAINT unique_team_name_per_user UNIQUE(name, created_by);

-- Pour les équipes: unicité du nom (global)
ALTER TABLE teams ADD CONSTRAINT unique_team_name UNIQUE(name);

-- Pour les campagnes: unicité du nom (global)  
ALTER TABLE campaigns ADD CONSTRAINT unique_campaign_name UNIQUE(name);

-- Si vous préférez permettre les doublons entre différents utilisateurs:
-- ALTER TABLE teams DROP CONSTRAINT IF EXISTS unique_team_name;
-- ALTER TABLE teams ADD CONSTRAINT unique_team_name_per_user UNIQUE(name, created_by);
-- ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS unique_campaign_name;  
-- ALTER TABLE campaigns ADD CONSTRAINT unique_campaign_name_per_user UNIQUE(name, created_by);
