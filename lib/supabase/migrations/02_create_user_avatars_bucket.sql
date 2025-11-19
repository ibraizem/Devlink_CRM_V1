-- Créer le bucket user_avatars pour les avatars des utilisateurs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user_avatars',
  'user_avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Politiques RLS pour le bucket user_avatars
-- 1. Les utilisateurs peuvent lire leurs propres avatars
CREATE POLICY "Users can view own avatar" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user_avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Les utilisateurs peuvent uploader leurs propres avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user_avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Les utilisateurs peuvent mettre à jour leurs propres avatars
CREATE POLICY "Users can update own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user_avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Les utilisateurs peuvent supprimer leurs propres avatars
CREATE POLICY "Users can delete own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user_avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Tout le monde peut voir les avatars publics (pour les afficher dans l'interface)
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user_avatars'
);
