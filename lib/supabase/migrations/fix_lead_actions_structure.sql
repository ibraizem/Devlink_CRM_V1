-- Vérifier et corriger la structure de la table lead_actions

-- 1. Ajouter la colonne 'type' si elle n'existe pas
DO $$
BEGIN
    -- Vérifier si la colonne 'type' existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lead_actions' 
        AND column_name = 'type'
    ) THEN
        -- Si la colonne 'type_action' existe, la renommer en 'type'
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'lead_actions' 
            AND column_name = 'type_action'
        ) THEN
            ALTER TABLE lead_actions RENAME COLUMN type_action TO type;
        ELSE
            -- Sinon, ajouter la colonne 'type'
            ALTER TABLE lead_actions ADD COLUMN type text NOT NULL DEFAULT 'autre';
        END IF;
    END IF;
END $$;

-- 2. Ajouter les contraintes CHECK si elles n'existent pas
DO $$
BEGIN
    -- Vérifier si la contrainte CHECK existe déjà
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'lead_actions_type_check'
    ) THEN
        ALTER TABLE lead_actions 
        ADD CONSTRAINT lead_actions_type_check 
        CHECK (type IN ('lead_assigne', 'statut_change', 'note', 'rendezvous', 'appel', 'email', 'autre'));
    END IF;
END $$;

-- 3. S'assurer que les autres colonnes existent
DO $$
BEGIN
    -- Vérifier et ajouter 'agent_id' si nécessaire
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lead_actions' 
        AND column_name = 'agent_id'
    ) THEN
        ALTER TABLE lead_actions ADD COLUMN agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Vérifier et ajouter 'description' si nécessaire
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lead_actions' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE lead_actions ADD COLUMN description text;
    END IF;
    
    -- Vérifier et ajouter 'contenu' si nécessaire
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lead_actions' 
        AND column_name = 'contenu'
    ) THEN
        ALTER TABLE lead_actions ADD COLUMN contenu text;
    END IF;
    
    -- Vérifier et ajouter 'metadata' si nécessaire
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lead_actions' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE lead_actions ADD COLUMN metadata jsonb DEFAULT '{}';
    END IF;
    
    -- Vérifier et ajouter 'bulk_operation' si nécessaire
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lead_actions' 
        AND column_name = 'bulk_operation'
    ) THEN
        ALTER TABLE lead_actions ADD COLUMN bulk_operation boolean DEFAULT false;
    END IF;
    
    -- Vérifier et ajouter 'timestamp' si nécessaire
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lead_actions' 
        AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE lead_actions ADD COLUMN timestamp timestamptz DEFAULT now();
    END IF;
END $$;

-- 4. Activer RLS si ce n'est pas déjà fait
ALTER TABLE lead_actions ENABLE ROW LEVEL SECURITY;

-- Afficher la structure finale pour vérification
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'lead_actions' 
ORDER BY ordinal_position;
