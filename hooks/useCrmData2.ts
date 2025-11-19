import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FichierImport } from '@/lib/types/fichier';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase/client';

export type LeadStatus = 'nouveau' | 'en_cours' | 'traite' | 'abandonne';

interface UseCrmDataReturn {
  rawLeads: any[];
  allRawLeads: any[];
  columnHeaders: string[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  loadRawLeads: (fileIds: string[]) => Promise<void>;
  onRefresh: () => void;
  selectedFiles: string[];
  availableFiles: FichierImport[];
  onFileToggle: (fileId: string) => void;
  onClearSelection: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function useCrmData(): UseCrmDataReturn {
  const { user } = useAuth();
  const userId = user?.id || '';
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [availableFiles, setAvailableFiles] = useState<FichierImport[]>([]);
  const [rawLeads, setRawLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 200, // Augmenté à 200 lignes par défaut
    total: 0
  });
  
  const { toast } = useToast();

  // Charger les fichiers actifs
  const loadActiveFiles = useCallback(async () => {
    if (!userId) return;
    setIsLoadingFiles(true);
    try {
      const { data: files, error } = await supabase
        .from('fichiers_import')
        .select('*')
        .eq('user_id', userId)
        .eq('statut', 'actif')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAvailableFiles(files || []);
    } catch (err) {
      console.error('Erreur lors du chargement des fichiers:', err);
      setError('Erreur lors du chargement des fichiers');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les fichiers actifs',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFiles(false);
    }
  }, [userId, toast]);

  // Charger les données brutes des fichiers sélectionnés
  const loadRawLeads = useCallback(async (fileIds: string[]) => {
    if (!fileIds || !fileIds.length) {
      setRawLeads([]);
      return;
    }

    setIsLoading(true);
    const allLeads: any[] = [];

    try {
      // Récupérer les fichiers un par un pour éviter les problèmes avec .in()
      for (const fileId of fileIds) {
        try {
          console.log(`Tentative de récupération du fichier avec l'ID:`, fileId);
          
          // Vérifier que l'ID est un UUID valide
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(fileId)) {
            console.error(`ID de fichier invalide: ${fileId}`);
            toast({
              title: 'Erreur',
              description: `L'identifiant du fichier est invalide`,
              variant: 'destructive',
            });
            continue;
          }
          
          console.log('Tentative de récupération du fichier...');
          let file = null;
          
          // Essayer d'abord avec une requête simple
          try {
            const { data, error } = await supabase.rpc('get_fichier_by_id', { file_id: fileId });
            
            if (error) {
              console.error('Erreur RPC:', error);
              throw error;
            }
            
            file = data;
            console.log('Fichier récupéré via RPC:', file);
            
            if (!file) {
              throw new Error('Fichier non trouvé via RPC');
            }
          } catch (rpcError) {
            console.log('Échec de la méthode RPC, tentative avec une requête directe...', rpcError);
            
            // Si la méthode RPC échoue, essayer une requête directe
            const { data, error } = await supabase
              .from('fichiers_import')
              .select('*')
              .eq('id', fileId)
              .maybeSingle();
              
            if (error) {
              console.error('Erreur requête directe:', error);
              throw error;
            }
            
            file = data;
            console.log('Fichier récupéré via requête directe:', file);
          }
          
          if (!file) {
            console.warn(`Aucun fichier trouvé avec l'ID: ${fileId}`);
            toast({
              title: 'Fichier introuvable',
              description: `Le fichier sélectionné n'existe plus`,
              variant: 'destructive',
            });
            continue;
          }

          // Télécharger le fichier depuis le stockage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('fichiers')
            .download(file.chemin);

          if (downloadError) {
            console.error(`Erreur lors du téléchargement du fichier ${file.nom}:`, downloadError);
            continue;
          }

          if (!fileData) {
            console.warn(`Aucune donnée pour le fichier: ${file.nom}`);
            continue;
          }

          // Fonction utilitaire pour traiter les lignes CSV
  const processLines = (lines: string[], headers: string[]): Record<string, any>[] => {
    return lines.map(line => {
      const values = line.split(',');
      return headers.reduce((obj: Record<string, any>, header: string, index: number) => {
        obj[header] = values[index]?.trim() || '';
        return obj;
      }, {} as Record<string, any>);
    });
  };

  // Parser le fichier en fonction de son type
  let parsedData: Record<string, any>[] = [];
  
  // Récupérer le type MIME en toute sécurité
  const fileMimeType = file.mime_type || '';
  const fileExtension = file.chemin ? file.chemin.split('.').pop()?.toLowerCase() : '';
  
  try {
            // Vérifier si c'est un fichier CSV
            if ((fileMimeType === 'text/csv' || fileExtension === 'csv')) {
              const text = await fileData.text();
              // Parser le CSV
              const lines = text.split('\n').filter(line => line.trim() !== '');
              if (lines.length >= 2) {
                const headers = lines[0].split(',').map(h => h.trim());
                parsedData = processLines(lines.slice(1), headers);
              }
            } 
            // Vérifier si c'est un fichier Excel
            else if (
              (fileMimeType.includes('spreadsheetml') || 
               fileMimeType.includes('excel') ||
               fileMimeType.includes('xlsx') ||
               fileMimeType.includes('xls') ||
               fileExtension === 'xlsx' || 
               fileExtension === 'xls')
            ) {
              try {
                // Importer dynamiquement xlsx uniquement si nécessaire
                const XLSX = await import('xlsx');
                const data = new Uint8Array(await fileData.arrayBuffer());
                
                // Lire le fichier Excel
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Vérifier qu'il y a au moins une feuille
                if (workbook.SheetNames.length === 0) {
                  throw new Error('Aucune feuille trouvée dans le fichier Excel');
                }
                
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                parsedData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                
                console.log('Données Excel parsées avec succès:', parsedData);
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors du parsing Excel';
                console.error('Erreur lors du parsing du fichier Excel:', error);
                throw new Error(`Erreur lors de la lecture du fichier Excel: ${errorMessage}`);
              }
            } else {
              console.warn(`Format de fichier non supporté: ${fileMimeType || fileExtension || 'inconnu'}`);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Format de fichier non supporté ou corrompu';
            console.error('Erreur lors du parsing du fichier:', error);
            toast({
              title: 'Erreur',
              description: `Erreur lors du traitement du fichier: ${errorMessage}`,
              variant: 'destructive',
            });
            continue;
          }

          // Ajouter des métadonnées aux données extraites
          const leadsWithMetadata = parsedData.map((row: Record<string, any>) => ({
            ...row,
            _fileId: file.id,
            _fileName: file.nom,
            _filePath: file.chemin
          }));

          allLeads.push(...leadsWithMetadata);
          
        } catch (fileError) {
          console.error(`Erreur lors du traitement du fichier ID ${fileId}:`, fileError);
          toast({
            title: 'Erreur',
            description: `Erreur lors du traitement d'un fichier`,
            variant: 'destructive',
          });
          continue;
        }
      }

      console.log('Données brutes chargées:', allLeads);
      
      // Mettre à jour l'état avec les données chargées
      setRawLeads(allLeads);
      setPagination(prev => ({
        ...prev,
        total: allLeads.length,
        page: 1 // Réinitialiser à la première page
      }));
    } catch (err) {
      console.error('Erreur lors du chargement des données brutes:', err);
      setError('Erreur lors du chargement des données brutes');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données des fichiers sélectionnés',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Gestion de la sélection des fichiers
  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) ? 
        prev.filter(id => id !== fileId) : 
        [...prev, fileId]
    );
  }, []);

  // Effet pour charger les fichiers actifs au montage
  useEffect(() => {
    loadActiveFiles();
  }, [loadActiveFiles]);

  // Effet pour charger les données brutes lorsque les fichiers sélectionnés changent
  useEffect(() => {
    if (selectedFileIds.length > 0) {
      loadRawLeads(selectedFileIds);
    } else {
      setRawLeads([]);
    }
  }, [selectedFileIds, loadRawLeads]);

  // Gestion du changement de page
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      page
    }));
  }, []);

  // Gestion du changement de taille de page
  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize,
      page: 1
    }));
  }, []);

  // Retourner toutes les données sans pagination côté client
  const paginatedLeads = useMemo(() => {
    return rawLeads; // Retourne toutes les données sans découpage
  }, [rawLeads]);

  // Extraire les en-têtes de colonnes uniques de tous les fichiers
  const columnHeaders = useMemo(() => {
    const headers = new Set<string>();
    rawLeads.forEach(lead => {
      Object.keys(lead).forEach(key => {
        if (!key.startsWith('_')) { // Exclure les métadonnées internes
          headers.add(key);
        }
      });
    });
    return Array.from(headers);
  }, [rawLeads]);

  return {
    // Données brutes
    rawLeads: paginatedLeads,
    allRawLeads: rawLeads,
    columnHeaders,
    
    // État de chargement et erreurs
    isLoading: isLoading || isLoadingFiles,
    error,
    
    // Pagination
    pagination: {
      ...pagination,
      total: rawLeads.length
    },
    
    // Fonctions
    loadRawLeads,
    onRefresh: () => selectedFileIds.length > 0 ? loadRawLeads(selectedFileIds) : loadActiveFiles(),
    
    // Pour la sélection de fichiers
    selectedFiles: selectedFileIds,
    availableFiles,
    onFileToggle: toggleFileSelection,
    onClearSelection: () => setSelectedFileIds([]),
    
    // Gestion de la pagination
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  };
}
