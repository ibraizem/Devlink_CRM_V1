-- Migration pour ajouter une gestion sécurisée des colonnes personnalisées

-- Fonction sécurisée pour ajouter une colonne texte si elle n'existe pas déjà
CREATE OR REPLACE FUNCTION public.safe_add_text_column(
    p_schema_name text,
    p_table_name text,
    p_column_name text,
    p_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_column_exists boolean;
    v_sanitized_column_name text;
    v_column_prefix text;
BEGIN
    -- Vérifier que le nom de la colonne est valide et sécurisé
    IF p_column_name !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' THEN
        RAISE EXCEPTION 'Nom de colonne invalide: %', p_column_name;
    END IF;
    
    -- Vérifier que le préfixe de la colonne est autorisé
    v_column_prefix := split_part(p_column_name, '_', 1);
    IF v_column_prefix != 'custom' THEN
        RAISE EXCEPTION 'Les colonnes personnalisées doivent commencer par "custom_"';
    END IF;
    
    -- Vérifier que l'utilisateur a le droit de modifier cette table
    -- (ajoutez ici des vérifications de sécurité supplémentaires si nécessaire)
    
    -- Vérifier si la colonne existe déjà
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = p_schema_name 
          AND table_name = p_table_name
          AND column_name = p_column_name
    ) INTO v_column_exists;
    
    -- Ajouter la colonne si elle n'existe pas
    IF NOT v_column_exists THEN
        EXECUTE format(
            'ALTER TABLE %I.%I ADD COLUMN %I TEXT',
            p_schema_name,
            p_table_name,
            p_column_name
        );
        
        -- Enregistrer la colonne dans la table des métadonnées
        INSERT INTO public.user_custom_columns (user_id, column_name, display_name)
        VALUES (p_user_id, p_column_name, 
                regexp_replace(
                    regexp_replace(
                        initcap(replace(p_column_name, '_', ' ')),
                        '^Custom ', 
                        ''
                    ),
                    '\y(\w)',
                    '\U\1',
                    'g'
                )
        )
        ON CONFLICT (user_id, column_name) DO NOTHING;
    END IF;
END;
$$;

-- Ajouter les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.safe_add_text_column(text, text, text, uuid) TO authenticated;

-- Fonction pour obtenir les colonnes personnalisées d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_custom_columns(p_user_id uuid)
RETURNS TABLE(column_name text, display_name text)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT column_name, display_name
    FROM public.user_custom_columns
    WHERE user_id = p_user_id
    ORDER BY created_at;
$$;

-- Ajouter les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_user_custom_columns(uuid) TO authenticated;
