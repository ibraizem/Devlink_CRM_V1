-- lib/utils/supabase/migrations/20241029000000_storage_policies.sql
-- Activer RLS sur le schéma de stockage
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres fichiers
CREATE POLICY "Les utilisateurs peuvent voir leurs propres fichiers"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'fichiers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs de téléverser des fichiers
CREATE POLICY "Les utilisateurs peuvent téléverser des fichiers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'fichiers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs de mettre à jour leurs propres fichiers
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres fichiers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'fichiers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres fichiers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'fichiers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);