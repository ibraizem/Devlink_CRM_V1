import { supabase } from '@/lib/supabase/client';

interface FileObject {
  name: string;
  // Ajoutez d'autres propriétés si nécessaire
}

interface StorageResponse<T = any> {
  data: T;
  error: Error | null;
}

interface PublicUrlResponse {
  publicUrl: string;
}

export const avatarService = {
  /**
   * Téléverse un nouvel avatar pour un utilisateur
   */
  uploadAvatar: async (userId: string, file: File): Promise<{ publicUrl: string; filePath: string }> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      // Format simple: {userId}/{fileName} 
      const filePath = `${userId}/${fileName}`;

      // 1. Supprimer l'ancien avatar s'il existe
      await avatarService.deleteUserAvatar(userId);

      // 2. Télécharger le nouvel avatar
      const { error: uploadError } = await supabase.storage
        .from('user_avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        }) as unknown as StorageResponse;

      if (uploadError) throw uploadError;

      // 3. Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('user_avatars')
        .getPublicUrl(filePath);

      return { publicUrl, filePath };
    } catch (error) {
      console.error('Erreur lors du téléversement de l\'avatar:', error);
      throw error;
    }
  },

  /**
   * Supprime l'avatar d'un utilisateur
   */
  deleteUserAvatar: async (userId: string) => {
    try {
      // Lister tous les fichiers de l'utilisateur dans le dossier {userId}
      const { data: files, error: listError } = await supabase.storage
        .from('user_avatars')
        .list(userId, {
          search: `${userId}-`
        }) as unknown as StorageResponse<FileObject[]>;

      if (listError) throw listError;

      // Supprimer tous les fichiers trouvés
      if (files && files.length > 0) {
        const filesToRemove = files.map(file => `${userId}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from('user_avatars')
          .remove(filesToRemove) as unknown as StorageResponse;

        if (deleteError) throw deleteError;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avatar:', error);
      throw error;
    }
  },

  /**
   * Obtient l'URL publique d'un avatar
   */
  getAvatarUrl: (filePath: string): string | null => {
    if (!filePath) return null;
    
    const { data: { publicUrl } } = supabase.storage
      .from('user_avatars')
      .getPublicUrl(filePath) as unknown as StorageResponse<PublicUrlResponse>;
      
    return publicUrl;
  }
};
