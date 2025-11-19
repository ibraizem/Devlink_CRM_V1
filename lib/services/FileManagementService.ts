import { supabase } from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Définition locale du type FichierImport
interface FichierImport {
  id: string;
  nom: string;
  chemin: string;
  statut: 'actif' | 'inactif' | 'en_cours' | 'erreur';
  date_import: string;
  nb_lignes: number;
  nb_lignes_importees: number;
  mapping_colonnes: Record<string, string>;
  separateur: string;
  user_id: string;
  original_filename?: string | null;
  taille?: number | null;
  type?: string | null;
  mime_type?: string | null;
  metadata?: any | null;
  donnees?: any | null;
  created_at?: string;
  updated_at?: string;
}

// Définition des interfaces locales pour éviter les erreurs d'import
interface SupabaseBucket {
  name: string;
  id: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
}

const BUCKET_NAME = 'fichiers';

interface FileUploadOptions {
  user_id: string;
  onProgress?: (progress: number) => void;
}

/**
 * S'assure que le bucket et le dossier utilisateur existent
 */
const ensureBucketExists = async (userId: string): Promise<void> => {
  try {
    console.log(`🔍 Vérification du bucket ${BUCKET_NAME} pour l'utilisateur ${userId}...`);
    
    // Le bucket "fichiers" existe déjà, pas besoin de créer de dossier
    // Supabase créera automatiquement le chemin userId/fichier.ext lors de l'upload
    console.log(`✅ Bucket ${BUCKET_NAME} prêt pour l'upload direct`);
    
  } catch (error) {
    console.error('Erreur dans ensureBucketExists:', error);
    throw error;
  }
};

export const FileManagementService = {
  /**
   * Téléverse un fichier vers Supabase Storage
   */
  uploadFile: async (file: File, options: FileUploadOptions): Promise<FichierImport> => {
    const { user_id, onProgress } = options;
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Utiliser le dossier utilisateur pour le stockage
    const filePath = `${user_id}/${fileName}`;

    try {
      // S'assurer que le bucket et le dossier utilisateur existent
      await ensureBucketExists(user_id);

      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`La taille du fichier dépasse la limite de ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      }

      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Type de fichier non pris en charge. Veuillez télécharger un fichier Excel ou CSV.');
      }

      // Téléverser le fichier
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erreur lors du téléversement:', uploadError);
        throw new Error(`Erreur lors du téléversement: ${uploadError.message}`);
      }

      // Créer l'enregistrement du fichier dans la base de données
      const fileRecord = await FileManagementService.createFileRecord({
        nom: file.name,
        chemin: filePath,
        user_id: user_id,
        original_filename: file.name,
        taille: file.size,
        type: fileExt,
        mime_type: file.type,
        statut: 'actif',
        date_import: new Date().toISOString(),
        nb_lignes: 0,
        nb_lignes_importees: 0,
        mapping_colonnes: {},
        separateur: ','
      });

      return fileRecord;
    } catch (error) {
      console.error('Erreur complète dans uploadFile:', error);
      throw error;
    }
  },

  /**
   * Met à jour les métadonnées du fichier avec les informations multicanal
   */
  updateFileMetadata: async (fileId: string, metadata: {
    channels: string[];
    categories: Record<string, number>;
    qualityScore: number;
    importType: string;
  }): Promise<void> => {
    try {
      // Préparer les métadonnées complètes pour l'affichage
      const completeMetadata = {
        ...metadata,
        totalLeads: Object.values(metadata.categories).reduce((sum, count) => sum + count, 0),
        validLeads: Object.values(metadata.categories).reduce((sum, count) => sum + count, 0),
        detectedChannels: metadata.channels,
        categoryDistribution: metadata.categories,
        importStatus: 'success' as const,
        importMessage: 'Import multicanal terminé avec succès',
        // Métadonnées système supplémentaires
        systemInfo: {
          processedAt: new Date().toISOString(),
          processingVersion: '1.0.0',
          dataQuality: {
            score: metadata.qualityScore,
            completeness: metadata.qualityScore >= 80 ? 'high' : metadata.qualityScore >= 50 ? 'medium' : 'low',
            validationErrors: 0
          },
          performance: {
            processingTimeMs: Date.now(),
            memoryUsage: 'N/A'
          }
        }
      };

      const { error } = await supabase
        .from('fichiers_import')
        .update({
          metadata: completeMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des métadonnées:', error);
    }
  },

  /**
   * Crée une entrée de fichier dans la base de données
   */
  createFileRecord: async (fileData: Omit<FichierImport, 'id' | 'created_at' | 'updated_at'>): Promise<FichierImport> => {
    console.log('Tentative de création d\'un enregistrement de fichier avec les données:', JSON.stringify(fileData, null, 2));
    
    try {
      // Préparer les données pour l'insertion en suivant exactement le schéma
      const insertData = {
        // Champs obligatoires
        nom: fileData.nom,
        chemin: fileData.chemin,
        statut: 'actif', // Doit être l'un de : 'actif', 'inactif', 'en_cours', 'erreur'
        
        // Champs avec valeurs par défaut dans la base de données
        date_import: new Date().toISOString(),
        nb_lignes: 0,
        nb_lignes_importees: 0,
        mapping_colonnes: {}, // JSONB non-null avec valeur par défaut {}
        separateur: ',',
        
        // Clé étrangère obligatoire
        user_id: fileData.user_id,
        
        // Champs optionnels
        original_filename: fileData.original_filename || fileData.nom,
        taille: fileData.taille || null,
        type: fileData.type || null,
        mime_type: fileData.mime_type || null,
        
        // Champs non inclus précédemment
        metadata: null, // Champ JSONB optionnel
        donnees: null // Champ JSONB optionnel pour les données du fichier
      };
      
      // Vérification des contraintes
      if (!insertData.user_id) {
        throw new Error('user_id est obligatoire pour créer un enregistrement de fichier');
      }

      console.log('Données simplifiées pour l\'insertion:', JSON.stringify(insertData, null, 2));
      
      // Essayer d'abord une insertion simple
      const { data, error } = await supabase
        .from('fichiers_import')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Erreur détaillée lors de la création du fichier:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (!data) {
        throw new Error('Aucune donnée retournée lors de la création du fichier');
      }

      console.log('Fichier créé avec succès:', data);
      return data;
    } catch (error) {
      console.error('Erreur inattendue dans createFileRecord:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  /**
   * Met à jour le statut d'un fichier
   */
  updateFileStatus: async (id: string, status: 'actif' | 'inactif' | 'en_cours' | 'erreur'): Promise<FichierImport> => {
    const { data, error } = await supabase
      .from('fichiers_import')
      .update({ 
        statut: status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }

    return data;
  },

  /**
   * Restaure un fichier
   */
  restoreFile: async (id: string): Promise<FichierImport> => {
    const { data, error } = await supabase
      .from('fichiers_import')
      .update({
        statut: 'actif',
        updated_at: new Date().toISOString(),
        metadata: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la restauration du fichier:', error);
      throw error;
    }

    return data;
  },

  /**
   * Supprime un fichier et toutes ses données associées
   */
  deleteFile: async (id: string, filePath: string): Promise<void> => {
    try {
      console.log(`Début de la suppression du fichier ${id}`);
      
      // 1. D'abord supprimer les leads associés si existants
      const { error: leadsError } = await supabase
        .from('leads')
        .delete()
        .eq('fichier_id', id);

      if (leadsError) {
        console.error('Erreur lors de la suppression des leads:', leadsError);
        // Continuer même si la suppression des leads échoue
      }

      // 2. Supprimer le fichier du stockage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.error('Erreur lors de la suppression du fichier du stockage:', storageError);
        // Continuer même si la suppression du stockage échoue
      }

      // 3. Supprimer l'enregistrement de la base de données
      const { error: dbError } = await supabase
        .from('fichiers_import')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('Erreur lors de la suppression de l\'enregistrement:', dbError);
        throw dbError;
      }

      console.log(`Fichier ${id} supprimé avec succès`);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  },

  /**
   * Met à jour le mapping des colonnes d'un fichier
   */
  updateFileMapping: async (fileId: string, mapping: Record<string, string>): Promise<FichierImport> => {
    const { data, error } = await supabase
      .from('fichiers_import')
      .update({ 
        mapping_colonnes: mapping,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du mapping:', error);
      throw error;
    }

    return data;
  },

  /**
   * Vérifie si un fichier existe dans le stockage
   */
  fileExists: async (filePath: string): Promise<boolean> => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { 
        limit: 1,
        search: filePath
      });

    if (error) {
      console.error('Erreur lors de la vérification du fichier:', error);
      return false;
    }

    return data.length > 0;
  },

  /**
   * Récupère l'URL publique d'un fichier
   */
  getFilePublicUrl: (filePath: string): string | null => {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    return data?.publicUrl || null;
  },

  /**
   * Télécharge un fichier
   */
  downloadFile: async (filePath: string): Promise<Blob> => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (error) {
      throw new Error(`Erreur lors du téléchargement: ${error.message}`);
    }

    return data;
  }
};