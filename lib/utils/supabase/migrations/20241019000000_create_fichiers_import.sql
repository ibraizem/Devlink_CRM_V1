-- Création de la table fichiers_import
CREATE TABLE IF NOT EXISTS public.fichiers_import (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    chemin TEXT NOT NULL,
    statut TEXT NOT NULL CHECK (statut IN ('actif', 'inactif', 'en_cours', 'erreur')),
    date_import TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nb_lignes INTEGER DEFAULT 0,
    nb_lignes_importees INTEGER DEFAULT 0,
    mapping_colonnes JSONB NOT NULL DEFAULT '{}'::jsonb,
    separateur TEXT DEFAULT ',',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création d'un index pour améliorer les performances des requêtes
CREATE INDEX idx_fichiers_import_user_id ON public.fichiers_import(user_id);
CREATE INDEX idx_fichiers_import_statut ON public.fichiers_import(statut);

-- Politique RLS pour la sécurité
ALTER TABLE public.fichiers_import ENABLE ROW LEVEL SECURITY;

-- Politique d'accès : les utilisateurs ne peuvent voir que leurs propres fichiers
CREATE POLICY "Les utilisateurs peuvent voir leurs propres fichiers"
    ON public.fichiers_import
    FOR SELECT
    USING (auth.uid() = user_id);

-- Politique d'insertion : les utilisateurs peuvent créer des fichiers
CREATE POLICY "Les utilisateurs peuvent créer des fichiers"
    ON public.fichiers_import
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Politique de mise à jour : les utilisateurs peuvent mettre à jour leurs propres fichiers
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres fichiers"
    ON public.fichiers_import
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Politique de suppression : les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres fichiers"
    ON public.fichiers_import
    FOR DELETE
    USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour mettre à jour automatiquement le champ updated_at
CREATE TRIGGER update_fichiers_import_updated_at
BEFORE UPDATE ON public.fichiers_import
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
