import { useState, useEffect } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export interface ActiveFileData {
  updated_at: Date;
  type: string;
  id: string;
  nom: string;
  chemin: string;
  mapping_colonnes: Record<string, string>;
  data: any[];
  rawData?: any[]; // Ajout des données brutes du fichier
  metadata?: {
    fileType?: string;
    originalName?: string;
    [key: string]: any;
  };
}

export function useActiveFile() {
  const [activeFile, setActiveFile] = useState<ActiveFileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchActiveFile = async () => {
    let file;
    try {
      setLoading(true);
      
      // Récupérer le premier fichier actif
      const { data: fichiers, error: fileError } = await supabase
        .from('fichiers_import')
        .select('*')
        .eq('statut', 'actif')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (fileError) {
        console.error('Erreur lors de la récupération du fichier actif:', fileError);
        throw fileError;
      }
      
      if (!fichiers || fichiers.length === 0) {
        console.log('Aucun fichier actif trouvé');
        setActiveFile(null);
        return;
      }
      
      file = fichiers[0];


      // Vérifier que le chemin du fichier est valide
      if (!file.chemin) {
        throw new Error('Chemin du fichier manquant');
      }

      console.log('Tentative de téléchargement du fichier:', file.chemin);
      
      // Le chemin stocké dans la base de données devrait déjà être le bon
      // car il est enregistré lors de l'upload avec le bon format
      const filePath = file.chemin;
      
      console.log('Tentative de téléchargement avec le chemin:', filePath);
      
      // D'abord, vérifier si le fichier existe
      // Pour le list, nous devons extraire le répertoire et le nom du fichier
      const pathParts = filePath.split('/');
      const fileName = pathParts.pop();
      const directory = pathParts.join('/');
      
      console.log('Recherche du fichier:', { directory, fileName });
      
      const { data: fileList, error: listError } = await supabase.storage
        .from('fichiers')
        .list(directory || undefined, {
          search: fileName
        });
      
      console.log('Résultat de la recherche du fichier:', { 
        fileList, 
        listError,
        directory,
        fileName
      });
      
      if (listError) {
        console.error('Erreur lors de la recherche du fichier:', listError);
        throw new Error(`Erreur lors de la vérification du fichier: ${listError.message}`);
      }
      
      if (!fileList || fileList.length === 0) {
        throw new Error(`Le fichier n'a pas été trouvé dans le stockage: ${filePath}`);
      }
      
      console.log('Téléchargement du fichier...', { bucket: 'fichiers', path: filePath });
      
      // Télécharger le fichier avec le chemin exact
      const { data: downloadedFile, error: downloadError } = await supabase.storage
        .from('fichiers')
        .download(filePath);

      if (downloadError) {
        console.error('Erreur lors du téléchargement du fichier:', {
          error: downloadError,
          message: downloadError.message,
          chemin: filePath,
          bucket: 'fichiers',
          originalPath: file.chemin
        });
        throw new Error(`Impossible de télécharger le fichier: ${downloadError.message}`);
      }

      if (!downloadedFile) {
        throw new Error('Aucune donnée reçue lors du téléchargement');
      }

      // Lire le contenu du fichier
      const arrayBuffer = await downloadedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setActiveFile({
        id: file.id,
        nom: file.nom || file.original_filename || 'Fichier sans nom',
        chemin: file.chemin,
        mapping_colonnes: file.mapping_colonnes || {},
        data: [], // Les données sont chargées à la demande
        rawData: jsonData, // Stocker les données brutes
        metadata: file.metadata || {},
        updated_at: file.updated_at ? new Date(file.updated_at) : new Date(),
        type: file.metadata?.type || 'application/octet-stream'
      });
      
      console.log('Fichier actif chargé:', file);
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur inconnue';
      const errorDetails = {
        message: errorMessage,
        stack: err.stack,
        file: file ? { id: file.id, chemin: file.chemin } : 'Aucun fichier chargé',
        code: err.code,
        details: err.details
      };
      console.error('Erreur dans useActiveFile:', errorDetails);
      
      // Gestion spécifique des erreurs 406
      if (err.code === 'PGRST116') {
        setError('Plusieurs fichiers actifs trouvés. Veuillez n\'en garder qu\'un seul en statut "actif".');
        toast.error('Plusieurs fichiers actifs trouvés. Veuillez vérifier vos fichiers.');
      } else {
        setError(`Impossible de charger le fichier: ${errorMessage}`);
        toast.error(`Erreur lors du chargement du fichier: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveFile();
  }, []);

  const refresh = async () => {
    await fetchActiveFile();
  };

  return {
    activeFile,
    loading,
    error,
    refresh
  };
}
