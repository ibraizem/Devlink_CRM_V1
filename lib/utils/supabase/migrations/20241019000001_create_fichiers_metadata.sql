-- Création de la table fichiers_metadata pour stocker les métadonnées supplémentaires
CREATE TABLE IF NOT EXISTS public.fichiers_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fichier_id UUID NOT NULL REFERENCES public.fichiers_import(id) ON DELETE CASCADE,
    feuille TEXT,
    est_excel BOOLEAN DEFAULT false,
    feuilles_restantes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_fichiers_metadata_fichier_id ON public.fichiers_metadata(fichier_id);

-- Politique RLS pour la sécurité
ALTER TABLE public.fichiers_metadata ENABLE ROW LEVEL SECURITY;

-- Politique d'accès : les utilisateurs peuvent voir leurs propres métadonnées
CREATE POLICY "Les utilisateurs peuvent voir leurs propres métadonnées"
    ON public.fichiers_metadata
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.fichiers_import fi 
        WHERE fi.id = fichier_id AND fi.user_id = auth.uid()
    ));

-- Politique d'insertion : les utilisateurs peuvent créer des métadonnées pour leurs fichiers
CREATE POLICY "Les utilisateurs peuvent créer des métadonnées"
    ON public.fichiers_metadata
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.fichiers_import fi 
        WHERE fi.id = fichier_id AND fi.user_id = auth.uid()
    ));

-- Politique de mise à jour : les utilisateurs peuvent mettre à jour leurs métadonnées
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs métadonnées"
    ON public.fichiers_metadata
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.fichiers_import fi 
        WHERE fi.id = fichier_id AND fi.user_id = auth.uid()
    ));

-- Politique de suppression : les utilisateurs peuvent supprimer leurs métadonnées
CREATE POLICY "Les utilisateurs peuvent supprimer leurs métadonnées"
    ON public.fichiers_metadata
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.fichiers_import fi 
        WHERE fi.id = fichier_id AND fi.user_id = auth.uid()
    ));

-- Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour mettre à jour automatiquement le champ updated_at
CREATE TRIGGER update_fichiers_metadata_updated_at
BEFORE UPDATE ON public.fichiers_metadata
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
