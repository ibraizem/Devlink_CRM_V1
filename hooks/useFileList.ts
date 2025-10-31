import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { fileService } from '@/lib/services/fileService';
import { FichierImport } from '@/lib/types/fichier';
import { useAuth } from './useAuth';

type FileAction = {
  type: 'upload' | 'delete' | 'toggle_status';
  fileId: string;
  fileName: string;
  timestamp: number;
  details: Record<string, any>;
};

export const useFileList = () => {
  const [files, setFiles] = useState<FichierImport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [actionHistory, setActionHistory] = useState<FileAction[]>([]);
  const [isUndoAvailable, setIsUndoAvailable] = useState(false);
  const lastActionRef = useRef<FileAction | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout>();

  // Charger la liste des fichiers avec pagination
  const loadFiles = useCallback(async (page = 1, pageSize = 20, filters = {}) => {
    if (!user?.id) {
      setError('Utilisateur non connecté');
      return { data: [], count: 0 };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: fileData, count } = await fileService.getFiles(
        user.id,
        filters,
        page,
        pageSize
      );
      
      setFiles(prev => page === 1 ? fileData : [...prev, ...fileData]);
      return { data: fileData, count };
    } catch (err) {
      console.error('Erreur lors du chargement des fichiers:', err);
      setError('Erreur lors du chargement des fichiers');
      toast.error('Erreur lors du chargement des fichiers');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ajouter une action à l'historique
  const addToHistory = useCallback((action: Omit<FileAction, 'timestamp'>) => {
    const newAction = {
      ...action,
      timestamp: Date.now(),
    };
    
    setActionHistory(prev => [newAction, ...prev].slice(0, 50)); // Garder les 50 dernières actions
    lastActionRef.current = newAction;
    setIsUndoAvailable(true);
    
    // Réinitialiser le timeout existant
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    // Désactiver le bouton d'annulation après 5 secondes
    undoTimeoutRef.current = setTimeout(() => {
      setIsUndoAvailable(false);
    }, 5000);
  }, []);

  // Annuler la dernière action
  const undoLastAction = useCallback(async () => {
    const lastAction = lastActionRef.current;
    if (!lastAction) return false;

    try {
      switch (lastAction.type) {
        case 'delete':
          await fileService.restoreFile(lastAction.details.fileData);
          await loadFiles();
          toast.success('Fichier restauré avec succès');
          break;
          
        case 'toggle_status':
          await fileService.updateFileStatus(
            lastAction.fileId, 
            lastAction.details.previousStatus
          );
          await loadFiles();
          toast.success('Action annulée avec succès');
          break;
          
        case 'upload':
          await fileService.deleteFile(
            lastAction.fileId, 
            lastAction.details.filePath
          );
          await loadFiles();
          toast.success('Téléversement annulé');
          break;
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'action:', error);
      toast.error('Erreur lors de l\'annulation de l\'action');
      return false;
    } finally {
      setIsUndoAvailable(false);
    }
  }, [loadFiles]);

  // Activer/Désactiver un fichier
  const toggleFileStatus = useCallback(async (id: string, currentStatus: 'actif' | 'inactif') => {
    const newStatus = currentStatus === 'actif' ? 'inactif' : 'actif';
    const file = files.find(f => f.id === id);
    
    try {
      await fileService.updateFileStatus(id, newStatus);
      
      // Mettre à jour l'état local immédiatement pour un retour visuel rapide
      setFiles(prevFiles =>
        prevFiles.map(file =>
          file.id === id ? { ...file, statut: newStatus } : file
        )
      );
      
      // Ajouter à l'historique
      if (file) {
        addToHistory({
          type: 'toggle_status',
          fileId: id,
          fileName: file.original_filename || file.nom,
          details: {
            previousStatus: currentStatus,
            newStatus
          }
        });
      }
      
      toast.success(`Fichier ${newStatus === 'actif' ? 'activé' : 'désactivé'} avec succès`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
      throw error;
    }
  }, [files, addToHistory]);

  // Supprimer un fichier
  const deleteFile = useCallback(async (id: string, filePath: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return false;

    try {
      // Sauvegarder les données du fichier pour annulation
      const fileData = { ...file };
      
      await fileService.deleteFile(id, filePath);
      
      // Mettre à jour l'état local immédiatement
      setFiles(prev => prev.filter(f => f.id !== id));
      
      // Retirer de la sélection
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      
      // Ajouter à l'historique
      addToHistory({
        type: 'delete',
        fileId: id,
        fileName: file.original_filename || file.nom,
        details: { fileData, filePath }
      });
      
      toast.success('Fichier supprimé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du fichier');
      return false;
    }
  }, [files, addToHistory]);

  const { user } = useAuth();
  
  // Téléverser un fichier
  const uploadFile = useCallback(async (file: File, onProgress?: (progress: number) => void) => {
    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      throw new Error('User not authenticated');
    }
    
    try {
      const uploadedFile = await fileService.uploadFile(file, {
        user_id: user.id,
        onProgress
      });
      
      // Mettre à jour l'état local
      setFiles(prev => [uploadedFile, ...prev]);
      
      // Ajouter à l'historique
      addToHistory({
        type: 'upload',
        fileId: uploadedFile.id,
        fileName: uploadedFile.original_filename || uploadedFile.nom,
        details: {
          filePath: uploadedFile.chemin,
          fileSize: file.size
        }
      });
      
      toast.success('Fichier téléversé avec succès');
      return uploadedFile;
    } catch (error) {
      console.error('Erreur lors du téléversement:', error);
      toast.error('Erreur lors du téléversement du fichier');
      throw error;
    }
  }, [addToHistory]);

  // Nettoyer les timeouts à la destruction du composant
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  return {
    files,
    isLoading,
    error,
    selectedFiles,
    setSelectedFiles,
    actionHistory,
    isUndoAvailable,
    loadFiles,
    toggleFileStatus,
    deleteFile,
    uploadFile,
    undoLastAction,
    addToHistory,
    user // Exposer l'utilisateur si nécessaire
  };
};
