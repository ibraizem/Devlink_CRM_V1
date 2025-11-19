    -- Finalisation de la table lead_actions avec RLS et index

    -- 1. Ajouter la contrainte CHECK sur le type si elle n'existe pas
    DO $$
    BEGIN
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

    -- 2. Créer les index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_lead_actions_lead_id ON lead_actions(lead_id);
    CREATE INDEX IF NOT EXISTS idx_lead_actions_agent_id ON lead_actions(agent_id);
    CREATE INDEX IF NOT EXISTS idx_lead_actions_timestamp ON lead_actions(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_lead_actions_type ON lead_actions(type);

    -- 3. Créer le trigger pour updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
    NEW.updated_at = now();
    RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_lead_actions_updated_at ON lead_actions;
    CREATE TRIGGER update_lead_actions_updated_at 
    BEFORE UPDATE ON lead_actions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- 4. Créer les politiques RLS
    DROP POLICY IF EXISTS "Users can view lead actions for their leads" ON lead_actions;
    DROP POLICY IF EXISTS "Users can insert lead actions" ON lead_actions;
    DROP POLICY IF EXISTS "Users can update their own lead actions" ON lead_actions;
    DROP POLICY IF EXISTS "Admins full access to lead_actions" ON lead_actions;

    -- Politique 1: Les utilisateurs peuvent voir les actions de leurs propres leads
    CREATE POLICY "Users can view lead actions for their leads" ON lead_actions
    FOR SELECT USING (
        auth.uid() = agent_id OR 
        EXISTS (
        SELECT 1 FROM users_profile 
        WHERE users_profile.id = auth.uid() 
        AND users_profile.role = 'admin'
        )
    );

    -- Politique 2: Les utilisateurs peuvent insérer des actions
    CREATE POLICY "Users can insert lead actions" ON lead_actions
    FOR INSERT WITH CHECK (auth.uid() = agent_id);

    -- Politique 3: Les utilisateurs peuvent mettre à jour leurs propres actions
    CREATE POLICY "Users can update their own lead actions" ON lead_actions
    FOR UPDATE USING (auth.uid() = agent_id);

    -- Politique 4: Les admins peuvent tout faire
    CREATE POLICY "Admins full access to lead_actions" ON lead_actions
    FOR ALL USING (
        EXISTS (
        SELECT 1 FROM users_profile 
        WHERE users_profile.id = auth.uid() 
        AND users_profile.role = 'admin'
        )
    );

    -- 5. S'assurer que RLS est activé
    ALTER TABLE lead_actions ENABLE ROW LEVEL SECURITY;

    -- 6. Commentaires pour documentation
    COMMENT ON TABLE lead_actions IS 'Historique des actions effectuées sur les leads';
    COMMENT ON COLUMN lead_actions.type IS 'Type d''action: lead_assigne, statut_change, note, rendezvous, appel, email, autre';
    COMMENT ON COLUMN lead_actions.metadata IS 'Données supplémentaires en JSON pour flexibilité';

    -- 7. Vérification finale
    SELECT 
    'Table structure OK' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'lead_actions') as column_count,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'lead_actions') as index_count,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'lead_actions') as policy_count;
