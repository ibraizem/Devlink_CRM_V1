-- Création de la table pour les colonnes personnalisées par utilisateur
CREATE TABLE IF NOT EXISTS public.user_custom_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    column_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, column_name)
);

-- Index pour améliorer les performances
CREATE INDEX idx_user_custom_columns_user_id ON public.user_custom_columns(user_id);

-- Politiques RLS
ALTER TABLE public.user_custom_columns ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres colonnes personnalisées
CREATE POLICY "Les utilisateurs peuvent voir leurs propres colonnes personnalisées"
    ON public.user_custom_columns
    FOR SELECT
    USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leurs propres colonnes personnalisées
CREATE POLICY "Les utilisateurs peuvent créer des colonnes personnalisées"
    ON public.user_custom_columns
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres colonnes personnalisées
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs colonnes personnalisées"
    ON public.user_custom_columns
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres colonnes personnalisées
CREATE POLICY "Les utilisateurs peuvent supprimer leurs colonnes personnalisées"
    ON public.user_custom_columns
    FOR DELETE
    USING (auth.uid() = user_id);

-- Fonction pour obtenir les colonnes personnalisées d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_custom_columns(p_user_id UUID)
RETURNS TABLE(column_name TEXT, display_name TEXT) AS $$
BEGIN
    RETURN QUERY 
    SELECT uc.column_name, uc.display_name
    FROM user_custom_columns uc
    WHERE uc.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
