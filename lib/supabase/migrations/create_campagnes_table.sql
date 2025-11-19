-- Création de la table campagnes
CREATE TABLE IF NOT EXISTS public.campagnes (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
    nom text NOT NULL,
    description text,
    statut text NOT NULL DEFAULT 'draft'::text,
    date_debut timestamp with time zone NULL,
    date_fin timestamp with time zone NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    metadata jsonb NULL,
    budget numeric NULL,
    objectifs text[],
    canaux text[],
    CONSTRAINT campagnes_pkey PRIMARY KEY (id),
    CONSTRAINT campagnes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT campagnes_statut_check CHECK (
        (
            statut = ANY (ARRAY['draft'::text, 'active'::text, 'paused'::text, 'completed'::text, 'cancelled'::text])
        )
    )
) TABLESPACE pg_default;

-- Indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_campagnes_user_id ON public.campagnes USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_campagnes_statut ON public.campagnes USING btree (statut) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_campagnes_date_debut ON public.campagnes USING btree (date_debut) TABLESPACE pg_default;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_campagnes_updated_at 
    BEFORE UPDATE ON public.campagnes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Données de test pour vérifier que tout fonctionne
INSERT INTO public.campagnes (nom, description, statut, user_id)
VALUES 
    ('Campagne Test 1', 'Première campagne de test', 'draft', 'a36fcbdb-5820-415a-9177-e4f0920fde31'),
    ('Campagne Test 2', 'Deuxième campagne de test', 'active', 'a36fcbdb-5820-415a-9177-e4f0920fde31')
ON CONFLICT DO NOTHING;
