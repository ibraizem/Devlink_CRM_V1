-- Table pour stocker les mappings de colonnes réutilisables
CREATE TABLE IF NOT EXISTS public.column_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom TEXT NOT NULL,
    description TEXT,
    mapping JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'historique des imports avec possibilité de rollback
CREATE TABLE IF NOT EXISTS public.import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fichier_id UUID REFERENCES public.fichiers_import(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    statut TEXT NOT NULL CHECK (statut IN ('en_attente', 'en_cours', 'termine', 'erreur', 'annule')),
    nb_lignes_total INTEGER DEFAULT 0,
    nb_lignes_importees INTEGER DEFAULT 0,
    nb_lignes_doublons INTEGER DEFAULT 0,
    nb_lignes_erreurs INTEGER DEFAULT 0,
    mapping_utilise JSONB,
    erreurs JSONB,
    peut_rollback BOOLEAN DEFAULT true,
    rollback_effectue BOOLEAN DEFAULT false,
    rollback_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour suivre les fichiers dans le Storage et leur état de synchronisation
CREATE TABLE IF NOT EXISTS public.storage_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    storage_path TEXT NOT NULL UNIQUE,
    bucket_name TEXT NOT NULL DEFAULT 'fichiers',
    nom_fichier TEXT NOT NULL,
    taille INTEGER,
    content_type TEXT,
    checksum TEXT,
    est_importe BOOLEAN DEFAULT false,
    fichier_id UUID REFERENCES public.fichiers_import(id) ON DELETE SET NULL,
    import_history_id UUID REFERENCES public.import_history(id) ON DELETE SET NULL,
    derniere_detection TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour stocker les doublons détectés
CREATE TABLE IF NOT EXISTS public.duplicate_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_history_id UUID REFERENCES public.import_history(id) ON DELETE CASCADE,
    ligne_numero INTEGER,
    donnees JSONB NOT NULL,
    raison_doublon TEXT,
    hash_donnees TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour améliorer les performances
CREATE INDEX idx_column_mappings_user_id ON public.column_mappings(user_id);
CREATE INDEX idx_import_history_fichier_id ON public.import_history(fichier_id);
CREATE INDEX idx_import_history_user_id ON public.import_history(user_id);
CREATE INDEX idx_import_history_statut ON public.import_history(statut);
CREATE INDEX idx_storage_files_bucket_path ON public.storage_files(bucket_name, storage_path);
CREATE INDEX idx_storage_files_est_importe ON public.storage_files(est_importe);
CREATE INDEX idx_storage_files_user_id ON public.storage_files(user_id);
CREATE INDEX idx_duplicate_records_import_id ON public.duplicate_records(import_history_id);
CREATE INDEX idx_duplicate_records_hash ON public.duplicate_records(hash_donnees);

-- RLS Policies
ALTER TABLE public.column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duplicate_records ENABLE ROW LEVEL SECURITY;

-- Policies pour column_mappings
CREATE POLICY "Les utilisateurs peuvent voir leurs propres mappings"
    ON public.column_mappings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer des mappings"
    ON public.column_mappings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres mappings"
    ON public.column_mappings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres mappings"
    ON public.column_mappings FOR DELETE
    USING (auth.uid() = user_id);

-- Policies pour import_history
CREATE POLICY "Les utilisateurs peuvent voir leur propre historique"
    ON public.import_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leur historique"
    ON public.import_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre historique"
    ON public.import_history FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies pour storage_files
CREATE POLICY "Les utilisateurs peuvent voir leurs propres fichiers storage"
    ON public.storage_files FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer des fichiers storage"
    ON public.storage_files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres fichiers storage"
    ON public.storage_files FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres fichiers storage"
    ON public.storage_files FOR DELETE
    USING (auth.uid() = user_id);

-- Policies pour duplicate_records
CREATE POLICY "Les utilisateurs peuvent voir leurs propres doublons"
    ON public.duplicate_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.import_history ih
            WHERE ih.id = import_history_id AND ih.user_id = auth.uid()
        )
    );

CREATE POLICY "Les utilisateurs peuvent créer des doublons"
    ON public.duplicate_records FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.import_history ih
            WHERE ih.id = import_history_id AND ih.user_id = auth.uid()
        )
    );

-- Trigger pour updated_at
CREATE TRIGGER update_column_mappings_updated_at
BEFORE UPDATE ON public.column_mappings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_history_updated_at
BEFORE UPDATE ON public.import_history
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storage_files_updated_at
BEFORE UPDATE ON public.storage_files
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
