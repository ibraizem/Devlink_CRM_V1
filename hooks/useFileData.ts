import { useState, useEffect } from 'react';
import { createClient } from '../lib/utils/supabase/client';

export type FichierDonnee = {
  id: string;
  fichier_id: string;
  created_at: string;
  updated_at: string;
  denomination_entreprise: string | null;
  activite: string | null;
  ville: string | null;
  code_postal: string | null;
  telephone: string | null;
  telephone_2: string | null;
  [key: string]: any; // Pour les colonnes personnalisées
};

export function useFileData() {
  const [data, setData] = useState<FichierDonnee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchFileData = async () => {
    try {
      setLoading(true);
      console.log('Récupération des données depuis Supabase...');
      
      // Vérifier la connexion à Supabase
      console.log('Vérification de la connexion Supabase...');
      const { data: userData, error: authError } = await supabase.auth.getUser();
      console.log('Utilisateur authentifié:', userData?.user?.email || 'Non connecté', authError);
      
      // Récupérer les données
      console.log('Récupération des données de la table fichier_donnees...');
      const { data: fileData, error: fetchError, status, count } = await supabase
        .from('fichier_donnees')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      console.log('Statut de la requête:', status);
      console.log('Nombre de lignes récupérées:', count);
      
      if (fetchError) {
        console.error('Erreur de requête Supabase:', fetchError);
        throw fetchError;
      }
      
      console.log('Données brutes reçues de Supabase:', fileData);
      
      // Vérifier la structure des données
      if (fileData && fileData.length > 0) {
        console.log('=== PREMIER ÉLÉMENT ===');
        console.log('Contenu complet:', fileData[0]);
        console.log('Clés disponibles:', Object.keys(fileData[0]));
        console.log('Valeurs des champs principaux:', {
          id: fileData[0].id,
          denomination_entreprise: fileData[0].denomination_entreprise,
          telephone: fileData[0].telephone,
          created_at: fileData[0].created_at,
          fichier_id: fileData[0].fichier_id
        });
      } else {
        console.log('Aucune donnée trouvée dans la table fichier_donnees');
      }
      
      setData(fileData || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des données:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFileData();
  }, []);

  return { data, loading, error, refresh: fetchFileData };
}
