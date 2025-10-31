// app/fichiers/services/fileService.ts
import { createClient } from '@/lib/utils/supabase/client';
import { FichierImport } from '@/lib/types/fichier';
import { SheetInfo } from '@/lib/types/file.types';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient();
const BUCKET_NAME = 'fichiers';

// Vérifier et créer le dossier utilisateur dans le bucket
const ensureBucketExists = async (userId: string) => {
  try {
    // Vérifier si le bucket existe en essayant de lister ses fichiers
    const { error: bucketCheckError } = await supabase.storage
      .from(BUCKET_NAME)
      .list();
      
    if (bucketCheckError) {
      console.error('Erreur d\'accès au bucket. Vérifiez qu\'il existe et que les politiques RLS sont correctement configurées:', bucketCheckError);
      throw new Error('Impossible d\'accéder au bucket. Vérifiez votre connexion et les permissions.');
    }

    // Créer un dossier pour l'utilisateur s'il n'existe pas
    const userFolderPath = `${userId}/`;
    
    // Vérifier d'abord si le dossier existe déjà
    const { data: existingFolders } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId);
      
    // Si le dossier n'existe pas, on le crée
    if (!existingFolders) {
      const { error: folderError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(userFolderPath, new Blob(), {
          upsert: true
        });

      if (folderError && !folderError.message.includes('already exists')) {
        console.error('Erreur lors de la création du dossier utilisateur:', folderError);
        throw new Error('Impossible de créer le dossier utilisateur.');
      }
    }

    return true;
  } catch (error) {
    console.error('Erreur dans ensureBucketExists:', error);
    throw error;
  }
};

// Types
type FileUploadOptions = {
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
  user_id: string;
};

type FileFilterOptions = {
  status?: 'actif' | 'inactif' | 'en_cours' | 'erreur' | 'all';
  fileType?: 'spreadsheet' | 'document' | 'image' | 'all';
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
  page?: number;
  pageSize?: number;
};

// Définition du type pour les colonnes personnalisées
export interface CustomColumn {
  id: string;
  user_id: string;
  column_name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export const fileService = {
  // ====================================
  // Gestion des fichiers
  // ====================================

  /**
   * Récupère la liste des fichiers avec filtrage et pagination
   */
  getFiles: async (
    userId: string,
    filters: FileFilterOptions = {},
    page = 1,
    pageSize = 20
  ): Promise<{ data: FichierImport[]; count: number }> => {
    try {
      let query = supabase
        .from('fichiers_import')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (filters.status && filters.status !== 'all') {
        query = query.eq('statut', filters.status);
      }

      if (filters.searchQuery) {
        query = query.ilike('original_filename', `%${filters.searchQuery}%`);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Erreur lors du chargement des fichiers:', error);
        throw new Error('Erreur lors du chargement des fichiers');
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Erreur dans getFiles:', error);
      throw error;
    }
  },

  /**
   * Téléverse un fichier avec suivi de progression
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

      // Téléverser le fichier avec suivi de progression
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Erreur de téléversement:', uploadError);
        throw new Error(`Échec du téléversement: ${uploadError.message}`);
      }

      // Création de l'entrée DB - en respectant la structure de la table fichiers_import
      const fileRecord = await fileService.createFileRecord({
        // Champs obligatoires de la table
        nom: file.name,
        chemin: filePath,
        statut: 'actif',
        date_import: new Date().toISOString(),
        nb_lignes: 0,
        nb_lignes_importees: 0,
        mapping_colonnes: {},
        separateur: ',',
        user_id,
        // Champs supplémentaires requis par le type FichierImport
        chemin_fichier: filePath,
        mime_type: file.type,
        original_filename: file.name,
        taille: file.size,
        type: file.type,
      });

      return fileRecord;
    } catch (error) {
      console.error('Erreur lors du téléversement du fichier:', error);
      try {
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      } catch (cleanupError) {
        console.error('Erreur lors du nettoyage du fichier:', cleanupError);
      }
      throw error instanceof Error ? error : new Error('Une erreur inconnue est survenue lors du téléchargement');
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
        
        // Champs non inclus précédemment
        metadata: null // Champ JSONB optionnel
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
          hint: error.hint,
          error: JSON.stringify(error, Object.getOwnPropertyNames(error))
        });
        
        // Essayer d'obtenir plus d'informations sur les contraintes de la table
        try {
          const { data: tableInfo } = await supabase
            .rpc('get_table_info', { table_name: 'fichiers_import' })
            .single();
          console.log('Structure de la table:', tableInfo);
        } catch (infoError) {
          console.error('Impossible de récupérer les informations de la table:', infoError);
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('Aucune donnée retournée lors de la création du fichier');
      }

      console.log('Enregistrement créé avec succès:', data);
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
  updateFileStatus: async (id: string, status: 'actif' | 'inactif' | 'supprime'): Promise<FichierImport> => {
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
   * Supprime un fichier
   */
  deleteFile: async (id: string, filePath: string): Promise<void> => {
    // Supprimer le fichier du stockage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (storageError) {
      console.error('Erreur lors de la suppression du fichier du stockage:', storageError);
      throw storageError;
    }

    // Marquer comme supprimé dans la base de données
    const { error: dbError } = await supabase
      .from('fichiers_import')
      .update({
        statut: 'supprime',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (dbError) {
      console.error('Erreur lors de la mise à jour du statut de suppression:', dbError);
      throw dbError;
    }
  },

  /**
   * Restaure un fichier supprimé
   */
  restoreFile: async (id: string): Promise<FichierImport> => {
    const { data, error } = await supabase
      .from('fichiers_import')
      .update({
        statut: 'actif',
        deleted_at: null,
        updated_at: new Date().toISOString(),
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

  // ====================================
  // Gestion des colonnes personnalisées
  // ====================================

  /**
   * Récupère les colonnes personnalisées d'un utilisateur
   */
  getCustomColumns: async (userId: string): Promise<CustomColumn[]> => {
    try {
      const { data, error } = await supabase
        .from('user_custom_columns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des colonnes personnalisées:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erreur inattendue dans getCustomColumns:', error);
      throw error;
    }
  },

  /**
   * Ajoute une nouvelle colonne personnalisée
   */
  addCustomColumn: async (column: Omit<CustomColumn, 'id' | 'created_at' | 'updated_at'>): Promise<CustomColumn> => {
    const { data, error } = await supabase
      .from('user_custom_columns')
      .insert([{
        ...column,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'ajout de la colonne personnalisée:', error);
      throw error;
    }

    return data;
  },

  /**
   * Met à jour une colonne personnalisée
   */
  updateCustomColumn: async (
    columnId: string,
    updates: Partial<Omit<CustomColumn, 'id' | 'user_id' | 'created_at'>>
  ): Promise<CustomColumn> => {
    const { data, error } = await supabase
      .from('user_custom_columns')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', columnId)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour de la colonne personnalisée:', error);
      throw error;
    }

    return data;
  },

  /**
   * Supprime une colonne personnalisée
   */
  deleteCustomColumn: async (columnId: string): Promise<void> => {
    const { error } = await supabase
      .from('user_custom_columns')
      .delete()
      .eq('id', columnId);

    if (error) {
      console.error('Erreur lors de la suppression de la colonne personnalisée:', error);
      throw error;
    }
  },

  // ====================================
  // Traitement des fichiers
  // ====================================

  /**
   * Lit les en-têtes d'un fichier Excel
   */
  readFileHeaders: async (file: File): Promise<SheetInfo[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheets: SheetInfo[] = [];

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const headers = jsonData[0] as string[] || [];
            
            sheets.push({
              name: sheetName,
              rowCount: jsonData.length - 1, // Exclure l'en-tête
              headers: headers.map(h => h?.toString() || '')
            });
          });

          resolve(sheets);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Importe les données d'un fichier
   */
  importData: async (
    file: File, 
    mapping: Record<string, string>, 
    options?: { sheetIndex?: number }
  ): Promise<{ rowCount: number }> => {
    const jsonData = await fileService.readFileAsJson(file, options?.sheetIndex);
    const mappedData = fileService.mapData(jsonData, mapping);
    
    // Ici, vous pouvez ajouter la logique pour enregistrer les données dans votre base de données
    // Par exemple :
    // const { error } = await supabase.from('leads').insert(mappedData);
    // if (error) throw error;
    
    return { rowCount: mappedData.length };
  },

  /**
   * Lit un fichier et le convertit en JSON
   */
  readFileAsJson: async (file: File, sheetIndex = 0): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[sheetIndex];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Convertir en tableau d'objets avec les en-têtes comme clés
          if (jsonData.length < 2) {
            resolve([]);
            return;
          }
          
          const headers = (jsonData[0] as string[]).map(h => h?.toString() || '');
          const result = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            const obj: Record<string, any> = {};
            
            headers.forEach((header, index) => {
              if (header && row[index] !== undefined) {
                obj[header] = row[index];
              }
            });
            
            if (Object.keys(obj).length > 0) {
              result.push(obj);
            }
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Mappe les données selon la configuration
   */
  mapData: (data: any[], mapping: Record<string, string>): any[] => {
    return data.map((row: any) => {
      const mappedRow: any = {};
      
      Object.entries(mapping).forEach(([source, target]) => {
        if (row[source] !== undefined) {
          mappedRow[target] = row[source];
        }
      });
      
      return mappedRow;
    });
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

  // ====================================
  // Utilitaires
  // ====================================

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
      console.error('Erreur lors du téléchargement du fichier:', error);
      throw new Error(`Erreur lors du téléchargement: ${error.message}`);
    }

    return data;
  }
};

export type { FichierImport };
