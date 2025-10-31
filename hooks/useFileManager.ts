import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { FichierImport } from '@/lib/types/fichier';
import { fileService } from '@/lib/services/fileService';

type FileData = FichierImport & {
  type: string;
  file_path?: string;
};

type ActionHistory = {
  id: string;
  type: 'upload' | 'delete' | 'toggle_status';
  fileId: string;
  fileName: string;
  timestamp: Date;
  details: Record<string, any>;
};

export function useFileManager() {
  const supabase = createClient();
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [actionHistory, setActionHistory] = useState<ActionHistory[]>([]);
  const [isUndoAvailable, setIsUndoAvailable] = useState(false);
  const [lastAction, setLastAction] = useState<ActionHistory | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Fonction pour rafraîchir la liste des fichiers
  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('fichiers_import')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des fichiers :', err);
      setError('Erreur lors du chargement des fichiers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fonction pour ajouter une action à l'historique
  const addToHistory = useCallback((action: Omit<ActionHistory, 'id' | 'timestamp'>) => {
    const newAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    setActionHistory(prev => [newAction, ...prev].slice(0, 50));
    setLastAction(newAction);
    setIsUndoAvailable(true);
    
    // Désactiver le bouton d'annulation après 5 secondes
    setTimeout(() => {
      setIsUndoAvailable(false);
    }, 5000);
  }, []);

  // Fonction pour annuler la dernière action
  const undoLastAction = useCallback(async () => {
    if (!lastAction) return;
    
    try {
      const supabase = createClient();
      
      switch (lastAction.type) {
        case 'delete':
          await supabase
            .from('fichiers_import')
            .insert([lastAction.details.fileData]);
          toast.success('Fichier restauré avec succès');
          break;
          
        case 'toggle_status':
          await supabase
            .from('fichiers_import')
            .update({ statut: lastAction.details.previousStatus })
            .eq('id', lastAction.fileId);
          toast.success('Action annulée avec succès');
          break;
          
        case 'upload':
          await supabase.storage
            .from('fichiers')
            .remove([lastAction.details.filePath]);
            
          await supabase
            .from('fichiers_import')
            .delete()
            .eq('id', lastAction.fileId);
            
          toast.success('Téléversement annulé');
          break;
      }
      
      await fetchFiles();
      
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'action:', error);
      toast.error('Erreur lors de l\'annulation de l\'action');
    } finally {
      setIsUndoAvailable(false);
    }
  }, [lastAction, fetchFiles]);

  // Gestion de la sélection/désélection d'un fichier
  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      return newSelection;
    });
  }, []);

  // Sélectionner/désélectionner tous les fichiers
  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(file => file.id)));
    }
    setIsAllSelected(!isAllSelected);
  }, [files, isAllSelected]);

  // Nettoyer un nom de colonne
  const cleanColumnName = useCallback((name: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9]/g, '_') // Remplace les caractères spéciaux par des underscores
      .replace(/_+/g, '_') // Évite les underscores multiples
      .replace(/^_+|_+$/g, '') // Supprime les underscores en début et fin
      .trim();
  }, []);

  // Mapper les noms de colonnes
  const mapToDatabaseColumn = useCallback((columnName: string): string | null => {
    if (!columnName) return null;
    
    const columnMap: Record<string, string> = {
      // Dénomination entreprise
      'denomination': 'denomination_entreprise',
      'denomination_entreprise': 'denomination_entreprise',
      'raison_sociale': 'denomination_entreprise',
      'raison_social': 'denomination_entreprise',
      'societe': 'denomination_entreprise',
      'entreprise': 'denomination_entreprise',
      
      // Activité
      'metier': 'activite',
      'activite': 'activite',
      'secteur': 'activite',
      
      // Adresse
      'adresse': 'adresse',
      'rue': 'adresse',
      'voie': 'adresse',
      'code_postal': 'code_postal',
      'cp': 'code_postal',
      'zip': 'code_postal',
      'ville': 'ville',
      'localite': 'ville',
      'pays': 'pays',
      
      // Contacts
      'nom': 'nom',
      'prenom': 'prenom',
      'email': 'email',
      'mail': 'email',
      'courriel': 'email',
      'telephone': 'telephone',
      'tel': 'telephone',
      'phone': 'telephone',
      'telephone_2': 'telephone_2',
      'tel_2': 'telephone_2',
      'portable': 'telephone_2',
      'mobile': 'telephone_2',
      
      // Autres champs
      'site_web': 'site_web',
      'site': 'site_web',
      'web': 'site_web',
      'url': 'site_web',
      'source': 'source',
      'origine': 'source',
      'notes': 'notes',
      'commentaire': 'notes',
      'remarque': 'notes',
      'fonction': 'fonction',
      'poste': 'fonction',
      'role': 'fonction'
    };

    return columnMap[columnName.toLowerCase()] || null;
  }, []);

  // Gérer l'upload d'un fichier
  const handleFileUpload = useCallback(async (file: File, options: { mapping?: Record<string, string> } = {}) => {
    const mapping = options.mapping || {};
    let fichierData: any = null;
    const supabase = createClient();
    
    try {
      setIsUploading(true);
      setUploadError(null);

      // 1. Vérifier que l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // 2. Créer un chemin de fichier unique
      const filePath = `uploads/${Date.now()}_${file.name.replace(/^uploads\//, '')}`;
      
      // 3. Créer une entrée dans fichiers_import
      const { data: newFichier, error: fichierError } = await supabase
        .from('fichiers_import')
        .insert({
          nom: file.name,
          chemin: filePath,
          statut: 'en_cours',
          user_id: user.id,
          mapping_colonnes: mapping,
          nb_lignes: 0,
          nb_lignes_importees: 0,
          separateur: file.name.endsWith('.csv') ? ',' : null,
          original_filename: file.name,
          taille: file.size,
          type: file.type || 'application/octet-stream',
          metadata: {
            fileType: file.type.startsWith('image/') ? 'image' : 'document',
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            fileSize: file.size,
            mimeType: file.type
          }
        })
        .select()
        .single();

      if (fichierError) throw fichierError;
      fichierData = newFichier;

      // 4. Téléverser le fichier vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('fichiers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Erreur lors du téléversement du fichier: ${uploadError.message}`);
      }

      // 5. Lire le fichier Excel/CSV pour obtenir les métadonnées
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir en JSON pour obtenir les en-têtes
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = (jsonData[0] as string[]).map((h: any) => String(h || '').trim());
      const dataRows = jsonData.slice(1).filter((row: any) => row && row.length > 0);
      
      // 6. Mettre à jour les métadonnées du fichier
      await supabase
        .from('fichiers_import')
        .update({ 
          chemin: filePath,
          nb_lignes: dataRows.length,
          updated_at: new Date().toISOString() 
        })
        .eq('id', fichierData.id);
      
      // 7. Mettre à jour le statut du fichier dans la base de données
      const { error: updateError } = await supabase
        .from('fichiers_import')
        .update({
          statut: 'actif',
          updated_at: new Date().toISOString()
        })
        .eq('id', fichierData.id);

      if (updateError) {
        console.error('Erreur lors de la mise à jour du statut du fichier:', updateError);
        throw updateError;
      }

      // 5. Les données sont stockées dans Supabase Storage, pas besoin d'insérer dans une table séparée

      // 6. Rafraîchir la liste des fichiers
      await fetchFiles();
      
    } catch (err) {
      console.error('Erreur lors de l\'import du fichier :', err);
      setUploadError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
      
      // En cas d'erreur, mettre à jour le statut
      if (fichierData) {
        try {
          await supabase
            .from('fichiers_import')
            .update({
              statut: 'erreur',
              updated_at: new Date().toISOString()
            })
            .eq('id', fichierData.id);
        } catch (updateError) {
          console.error('Erreur lors de la mise à jour du statut d\'erreur :', updateError);
        }
      }
    } finally {
      setIsUploading(false);
    }
  }, [cleanColumnName, fetchFiles, mapToDatabaseColumn]);


  // Charger les fichiers au montage du composant
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Réinitialiser la sélection quand la liste des fichiers change
  useEffect(() => {
    setSelectedFiles(new Set());
    setIsAllSelected(false);
  }, [files]);
  
  // Les fonctions cleanColumnName et mapToDatabaseColumn ont été déplacées plus haut dans le fichier
  // pour être définies une seule fois et utilisées dans toute l'application

  // Charger les fichiers pour un utilisateur spécifique via le service
  const loadFiles = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      // Pass empty filters as second argument and get the data property from the response
      const { data } = await fileService.getFiles(userId, {}, 1, 20);
      // Map FichierImport[] to FileData[]
      const fileData = data.map(file => ({
        ...file,
        type: file.nom?.split('.').pop()?.toLowerCase() || 'file',
        file_path: file.chemin_fichier
      }));
      setFiles(fileData);
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
      setError('Erreur lors du chargement des fichiers');
      toast.error('Impossible de charger les fichiers. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Supprimer un fichier via le service
  const deleteFile = useCallback(async (id: string) => {
    const fileToDelete = files.find(f => f.id === id);
    if (!fileToDelete) return false;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return false;
    
    try {
      // Get the file path from the file object
      const filePath = fileToDelete.chemin || '';
      await fileService.deleteFile(id, filePath);
      setFiles(prev => prev.filter(file => file.id !== id));
      
      // Ajouter à l'historique
      addToHistory({
        type: 'delete',
        fileId: id,
        fileName: fileToDelete.nom || 'Fichier inconnu',
        details: {}
      });
      
      toast.success('Fichier supprimé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Impossible de supprimer le fichier');
      return false;
    }
  }, [files, addToHistory]);

  // Mettre à jour le statut d'un fichier
  const updateFileStatus = useCallback(async (id: string, newStatus: 'actif' | 'inactif' | 'en_cours' | 'erreur') => {
    try {
      // Récupérer l'ancien statut pour l'historique
      const currentFile = files.find(file => file.id === id);
      if (!currentFile) {
        throw new Error('Fichier non trouvé');
      }

      // Vérifier que le nouveau statut est valide
      const validStatuses: ('actif' | 'inactif' | 'en_cours' | 'erreur')[] = ['actif', 'inactif', 'en_cours', 'erreur'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Statut invalide: ${newStatus}. Doit être l'un des suivants: ${validStatuses.join(', ')}`);
      }

      // Mettre à jour le statut dans la base de données
      const { error } = await supabase
        .from('fichiers_import')
        .update({ 
          statut: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setFiles(prev => 
        prev.map(file => 
          file.id === id ? { ...file, statut: newStatus } : file
        )
      );

      // Ajouter à l'historique
      addToHistory({
        type: 'toggle_status',
        fileId: id,
        fileName: currentFile.nom,
        details: {
          previousStatus: currentFile.statut,
          newStatus
        }
      });
      
      toast.success(`Statut du fichier mis à jour avec succès: ${newStatus}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du fichier:', error);
      toast.error(`Impossible de mettre à jour le statut du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      return false;
    }
  }, [files, addToHistory]);

  // Mettre à jour le nom d'un fichier
  const updateFileName = useCallback(async (id: string, name: string) => {
    try {
      // Mettre à jour le nom dans la base de données
      const { error } = await supabase
        .from('fichiers_import')
        .update({ nom: name })
        .eq('id', id);
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setFiles(prev => 
        prev.map(file => 
          file.id === id ? { ...file, nom: name } : file
        )
      );
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom du fichier:', error);
      toast.error('Impossible de mettre à jour le nom du fichier');
      return false;
    }
  }, []);

  return {
    // État
    files,
    isLoading,
    isUploading,
    error,
    uploadError,
    selectedFiles,
    isAllSelected,
    isUndoAvailable,
    editingId,
    newName,
    
    // Actions
    fetchFiles,
    loadFiles,
    handleFileUpload,
    toggleFileSelection,
    toggleSelectAll,
    undoLastAction,
    deleteFile,
    updateFileName,
    updateFileStatus,
    setError,
    setUploadError,
    setEditingId,
    setNewName
  };
}
