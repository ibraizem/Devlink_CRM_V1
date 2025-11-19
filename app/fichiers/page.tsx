'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { RefreshCw, Save, Check, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { FichierImport } from '@/lib/types/fichier';
import { FileListe } from '@/components/fichiers/FileListe';
import dynamic from 'next/dynamic';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { FileUploader } from '@/components/fichiers/FileUploader';
import { FilePreviewModal } from '@/components/fichiers/FilePreviewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useLeads } from '@/hooks/useLeads';
import { fileService } from '@/lib/services/fileService';
import { campaignService } from '@/lib/services/campaignService';

const Sidebar = dynamic(() => import('@/components/Sidebar'), {
  ssr: false,
  loading: () => <div>Chargement de la barre latérale...</div>
});

// Fonction helper pour valider le statut
const validateStatus = (status: string): 'actif' | 'inactif' | 'en_cours' | 'erreur' => {
  const validStatuses = ['actif', 'inactif', 'en_cours', 'erreur'] as const;
  if (validStatuses.includes(status as any)) {
    return status as 'actif' | 'inactif' | 'en_cours' | 'erreur';
  }
  throw new Error('Statut invalide');
};

function FichiersPage() {
  // Activer la synchronisation temps réel
  useRealtimeSync();
  const { leads, refreshLeads } = useLeads();
  
  // États pour la gestion des onglets
  const [activeTab, setActiveTab] = useState<'fichiers' | 'import'>('fichiers');
  const [fichiers, setFichiers] = useState<FichierImport[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'completed' | 'error' | 'cancelled'>('idle');
  
  // États pour l'aperçu des données
  const [previewData, setPreviewData] = useState<{
    fichierId: string;
    data: any[];
    columns: { header: string; accessor: string }[];
    isLoading: boolean;
    error: string | null;
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editingFile, setEditingFile] = useState<FichierImport | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('');
  const [campaignPagination, setCampaignPagination] = useState({ page: 1, pageSize: 50, totalCount: 0 });
  const [campaignsCache, setCampaignsCache] = useState<Map<string, any[]>>(new Map());
  
  const { user } = useCurrentUser();
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les campagnes avec optimisation
  const fetchCampaigns = useCallback(async (searchTerm?: string, statusFilter?: string, page: number = 1) => {
    try {
      setIsLoadingCampaigns(true);
      
      // Créer une clé de cache
      const cacheKey = `${searchTerm || ''}-${statusFilter || ''}-${page}`;
      
      // Vérifier le cache en premier
      if (campaignsCache.has(cacheKey) && !searchTerm && !statusFilter) {
        const cachedData = campaignsCache.get(cacheKey);
        if (cachedData) {
          setCampaigns(cachedData);
          setIsLoadingCampaigns(false);
          return;
        }
      }
      
      // Utiliser campaignService avec filtres
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      
      const result = await campaignService.getCampaigns(page, campaignPagination.pageSize, filters);
      
      setCampaigns(result.data || []);
      setCampaignPagination(prev => ({
        ...prev,
        totalCount: result.count || 0,
        page
      }));
      
      // Mettre en cache seulement si pas de recherche/filtre
      if (!searchTerm && !statusFilter) {
        setCampaignsCache(prev => new Map(prev.set(cacheKey, result.data || [])));
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des campagnes:', error);
      toast.error('Impossible de charger les campagnes');
      setCampaigns([]);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [campaignPagination.pageSize, campaignsCache]);

  // Handler pour la recherche avec debounce
  const handleCampaignSearch = useCallback((searchTerm: string) => {
    setCampaignSearch(searchTerm);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce la recherche
    searchTimeoutRef.current = setTimeout(() => {
      fetchCampaigns(searchTerm, campaignStatusFilter, 1);
    }, 300);
  }, [campaignStatusFilter, fetchCampaigns]);

  // Handler pour le filtre de statut
  const handleStatusFilter = useCallback((status: string) => {
    setCampaignStatusFilter(status);
    fetchCampaigns(campaignSearch, status, 1);
  }, [campaignSearch, fetchCampaigns]);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      'active': 'Active',
      'completed': 'Terminée', 
      'paused': 'En pause',
      'cancelled': 'Annulée',
      'draft': 'Brouillon'
    };
    return statusLabels[status] || status;
  };

  // Charger les fichiers importés
  const fetchFichiers = useCallback(async () => {
    try {
      setIsLoadingFiles(true);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      const { data, error } = await supabase
        .from('fichiers_import')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setFichiers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
      toast.error('Impossible de charger les fichiers importés');
    } finally {
      setIsLoadingFiles(false);
    }
  }, [supabase]);

  // Charger les fichiers et campagnes au montage
  useEffect(() => {
    if (user) {
      fetchFichiers();
      fetchCampaigns();
    }
  }, [user, fetchFichiers, fetchCampaigns]);

  // Gérer la synchronisation des leads
  const handleSyncLeads = async (fileId?: string) => {
    try {
      if (fileId) {
        // Synchroniser les leads d'un fichier spécifique
        const count = await fileService.syncFileLeads(fileId);
        toast.success(`${count} leads synchronisés pour le fichier`);
      } else {
        // Synchroniser tous les leads
        const count = await fileService.syncAllLeads();
        toast.success(`${count} leads synchronisés au total`);
      }
      
      // Rafraîchir les données
      await fetchFichiers();
      await refreshLeads();
    } catch (error) {
      console.error('Erreur lors de la synchronisation des leads:', error);
      toast.error('Erreur lors de la synchronisation des leads');
    }
  };

  // Gérer l'association d'une campagne à un fichier
  const handleAssociateCampaign = async (fileId: string) => {
    if (!selectedCampaign) return;
    
    try {
      setIsSaving(true);
      await fileService.associateCampaign(fileId, selectedCampaign);
      
      // Mettre à jour la liste des fichiers et réinitialiser
      await fetchFichiers();
      setSelectedCampaign('');
      
      // Si on est en train d'éditer, mettre à jour le fichier en cours
      if (editingFile?.id === fileId) {
        const updatedFile = await fileService.getFileCampaign(fileId);
        setEditingFile(prev => prev ? { ...prev, ...updatedFile } : null);
      }
      
      toast.success('Campagne associée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'association de la campagne:', error);
      toast.error('Erreur lors de l\'association de la campagne');
    } finally {
      setIsSaving(false);
    }
  };

  // Gestion de la fin d'import
  const handleImportComplete = (result: { success: boolean; fileId?: string; error?: string }) => {
    if (result.success) {
      setImportStatus('completed');
      setImportProgress(100);
      fetchFichiers();
      toast.success('Import terminé avec succès');
    } else {
      setImportStatus('error');
      toast.error(result.error || 'Erreur lors de l\'import');
    }
  };

  // Gestion de la progression de l'import
  const handleImportProgress = (progress: number) => {
    setImportProgress(progress);
    setImportStatus(progress < 100 ? 'importing' : 'completed');
  };


  // Charger les données d'aperçu
  const handlePreview = async (fichier: FichierImport) => {
    try {
      setPreviewData({
        fichierId: fichier.id,
        data: [],
        columns: [],
        isLoading: true,
        error: null
      });
      setIsPreviewOpen(true);

      // Récupérer les données du fichier depuis Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('fichiers')
        .download(fichier.chemin);

      if (downloadError) throw downloadError;
      if (!fileData) throw new Error('Aucune donnée trouvée pour ce fichier');

      // Lire le fichier Excel
      const arrayBuffer = await fileData.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Prendre la première feuille
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convertir en JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length <= 1) {
        throw new Error('Le fichier est vide ou ne contient pas de données');
      }

      // La première ligne contient les en-têtes
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1, 51); // Prendre les 50 premières lignes de données

      // Créer les colonnes pour le tableau
      const columns = headers.map(header => ({
        header: header.toString().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        accessor: header.toString()
      }));

      // Convertir les lignes en objets avec les en-têtes comme clés
      const formattedData = rows.map((row: any) => {
        const obj: Record<string, any> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      setPreviewData({
        fichierId: fichier.id,
        data: formattedData,
        columns: columns,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'aperçu:', error);
      setPreviewData({
        fichierId: fichier.id,
        data: [],
        columns: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors du chargement des données d\'aperçu.'
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 h-full z-40">
        <Sidebar />
      </div>
      <div className="flex-1 p-6 md:p-8 ml-16">
        <div className="container mx-auto max-w-7xl">
          {/* Composant de prévisualisation de fichier */}
          <FilePreviewModal 
            isOpen={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            previewData={previewData}
          />

          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('fichiers')}
                    className={`py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'fichiers'
                        ? 'border-b-2 border-[#2563EB] text-[#2563EB]'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Mes Fichiers
                  </button>
                  <button
                    onClick={() => setActiveTab('import')}
                    className={`py-4 px-6 text-sm font-medium transition-colors duration-200 ${
                      activeTab === 'import'
                        ? 'border-b-2 border-[#2563EB] text-[#2563EB]'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Importer un fichier
                  </button>
                </nav>
              </div>
              
              <div className="p-6">
                {activeTab === 'fichiers' && (
              <>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-xl flex flex-col">
                    <DialogHeader className="pb-4 border-b border-gray-200 flex-shrink-0">
                      <DialogTitle className="text-xl font-semibold text-gray-900">Modifier le fichier</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Mettez à jour le nom du fichier et consultez ses détails.
                      </DialogDescription>
                    </DialogHeader>
                    {editingFile && (
                      <div className="py-6 px-2 space-y-6 overflow-y-auto flex-1">
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-1">
                              Nom du fichier
                            </label>
                            <input
                              id="filename"
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
                              placeholder="Entrez le nouveau nom du fichier"
                              autoComplete="off"
                            />
                          </div>
                          
                          {/* Section Campagne associée */}
                          <div className="space-y-4 p-5 bg-blue-50 rounded-xl border border-blue-100">
                            <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-wider">Campagne associée</h4>
                            
                            {/* Barre de recherche et filtre */}
                            <div className="space-y-3">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Rechercher une campagne..."
                                  value={campaignSearch}
                                  onChange={(e) => handleCampaignSearch(e.target.value)}
                                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  disabled={isLoadingCampaigns || isSaving}
                                />
                                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                              
                              {/* Filtre par statut */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStatusFilter('')}
                                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                    campaignStatusFilter === ''
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                  disabled={isLoadingCampaigns || isSaving}
                                >
                                  Tous
                                </button>
                                <button
                                  onClick={() => handleStatusFilter('active')}
                                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                    campaignStatusFilter === 'active'
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                  disabled={isLoadingCampaigns || isSaving}
                                >
                                  Actives
                                </button>
                                <button
                                  onClick={() => handleStatusFilter('completed')}
                                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                    campaignStatusFilter === 'completed'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                  disabled={isLoadingCampaigns || isSaving}
                                >
                                  Terminées
                                </button>
                                <button
                                  onClick={() => handleStatusFilter('paused')}
                                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                    campaignStatusFilter === 'paused'
                                      ? 'bg-yellow-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                  disabled={isLoadingCampaigns || isSaving}
                                >
                                  En pause
                                </button>
                              </div>
                            </div>
                            
                            {/* Select des campagnes */}
                            <div className="flex items-center gap-3">
                              <select
                                value={selectedCampaign || editingFile?.campagne_id || ''}
                                onChange={(e) => setSelectedCampaign(e.target.value)}
                                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                disabled={isLoadingCampaigns || isSaving}
                              >
                                <option value="">
                                  {isLoadingCampaigns ? 'Chargement...' : 'Sélectionner une campagne'}
                                </option>
                                {campaigns.length === 0 && !isLoadingCampaigns && (
                                  <option value="" disabled>
                                    {campaignSearch || campaignStatusFilter ? 'Aucune campagne trouvée' : 'Aucune campagne disponible'}
                                  </option>
                                )}
                                {campaigns.map((campaign) => (
                                  <option key={campaign.id} value={campaign.id}>
                                    {campaign.name} 
                                    {campaign.status && ` (${getStatusLabel(campaign.status)}`}
                                    {campaign.start_date && ` - ${new Date(campaign.start_date).toLocaleDateString('fr-FR')})`}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssociateCampaign(editingFile.id)}
                                disabled={!selectedCampaign || isSaving || isLoadingCampaigns}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSaving ? 'Enregistrement...' : 'Associer'}
                              </button>
                            </div>
                            
                            {/* Indicateur de résultats */}
                            {campaignPagination.totalCount > 0 && (
                              <div className="text-xs text-gray-500 text-center">
                                {campaigns.length} campagnes affichées sur {campaignPagination.totalCount}
                              </div>
                            )}
                          </div>

                          {/* Détails du fichier */}
                          <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Détails du fichier</h4>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-500">Type de fichier</span>
                                <span className="text-sm font-medium text-gray-900">{editingFile.type || 'Non spécifié'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Date d'import</span>
                                <span className="text-sm text-gray-900">
                                  {new Date(editingFile.date_import).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              {editingFile.taille && (
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-gray-500">Taille</span>
                                  <span className="text-sm text-gray-900">
                                    {(editingFile.taille / 1024).toFixed(2)} KB
                                  </span>
                                </div>
                              )}
                              
                              {/* Statistiques d'importation enrichies */}
                              {editingFile.metadata && (
                                <>
                                  <div className="pt-3 border-t border-gray-200">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Statistiques d'importation</h5>
                                    
                                    {/* Métriques principales */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                                        <div className="text-lg font-bold text-blue-600">
                                          {(editingFile.metadata.totalLeads || 0).toLocaleString('fr-FR')}
                                        </div>
                                        <div className="text-xs text-gray-600">Total leads</div>
                                      </div>
                                      <div className="bg-green-50 rounded-lg p-4 text-center">
                                        <div className="text-lg font-bold text-green-600">
                                          {(editingFile.metadata.validLeads || 0).toLocaleString('fr-FR')}
                                        </div>
                                        <div className="text-xs text-gray-600">Leads valides</div>
                                      </div>
                                    </div>
                                    
                                    {/* Score qualité et taux de conversion */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-500">Score qualité</span>
                                        <div className="flex items-center gap-1">
                                          <div className={`w-2 h-2 rounded-full ${
                                            (editingFile.metadata.qualityScore || 0) >= 80 ? 'bg-green-500' : 
                                            (editingFile.metadata.qualityScore || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                          }`} />
                                          <span className={`text-sm font-bold ${
                                            (editingFile.metadata.qualityScore || 0) >= 80 ? 'text-green-600' : 
                                            (editingFile.metadata.qualityScore || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                                          }`}>
                                            {editingFile.metadata.qualityScore || 0}%
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-500">Taux conversion</span>
                                        <span className="text-sm font-bold text-purple-600">
                                          {(editingFile.metadata.totalLeads || 0) > 0 
                                            ? Math.round(((editingFile.metadata.validLeads || 0) / (editingFile.metadata.totalLeads || 0)) * 100)
                                            : 0}%
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Canaux détectés */}
                                    {editingFile.metadata.detectedChannels && editingFile.metadata.detectedChannels.length > 0 && (
                                      <div className="mb-4">
                                        <div className="text-sm font-medium text-gray-500 mb-2">Canaux détectés</div>
                                        <div className="flex flex-wrap gap-1">
                                          {editingFile.metadata.detectedChannels.map((channel: string, idx: number) => (
                                            <Badge 
                                              key={idx} 
                                              variant="secondary" 
                                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 border-blue-200"
                                            >
                                              {channel}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Statut d'importation */}
                                    {editingFile.metadata.importStatus && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-500">Statut import</span>
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                          editingFile.metadata.importStatus === 'success' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                          {editingFile.metadata.importStatus === 'success' ? (
                                            <>
                                              <Check className="h-3 w-3" />
                                              Succès
                                            </>
                                          ) : (
                                            <>
                                              <AlertCircle className="h-3 w-3" />
                                              Erreur
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4 px-6 flex-shrink-0 border-t border-gray-200">
                          <button 
                            type="button"
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                          >
                            Annuler
                          </button>
                          <button 
                            type="button"
                            onClick={async () => {
                              if (!editingFile || !newFileName.trim()) return;
                              
                              try {
                                setIsSaving(true);
                                const { error } = await supabase
                                  .from('fichiers_import')
                                  .update({ nom: newFileName })
                                  .eq('id', editingFile.id);
                                
                                if (error) throw error;
                                
                                // Mettre à jour la liste des fichiers
                                fetchFichiers();
                                setIsEditing(false);
                                toast.success('Fichier mis à jour avec succès');
                              } catch (error) {
                                console.error('Erreur lors de la mise à jour du fichier:', error);
                                toast.error('Erreur lors de la mise à jour du fichier');
                              } finally {
                                setIsSaving(false);
                              }
                            }}
                            disabled={!newFileName.trim() || isSaving}
                            className={`px-5 py-2.5 text-sm font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 ${
                              isSaving ? 'opacity-75' : ''
                            }`}
                          >
                            {isSaving ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Enregistrement...</span>
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                <span>Enregistrer les modifications</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                </DialogContent>
                </Dialog>

                <FileListe
                  fichiers={fichiers}
                  onRefresh={fetchFichiers}
                  isLoading={isLoadingFiles}
                  onPreview={handlePreview}
                  onSyncLeads={handleSyncLeads}
                  leads={leads}
                  fileLineCounts={fichiers.reduce((acc, file) => ({
                    ...acc,
                    [file.id]: file.nb_lignes || 0
                  }), {})}
                  onEdit={(fichier: FichierImport) => {
                    setEditingFile(fichier);
                    setNewFileName(fichier.nom || ''); // Initialiser le champ avec le nom actuel
                    setIsEditing(true);
                  }}
                onDownload={async (fichier: FichierImport) => {
                  try {
                    const { data, error } = await supabase.storage
                      .from('fichiers')
                      .download(fichier.chemin);
                    
                    if (error) throw error;
                    
                    const url = window.URL.createObjectURL(data);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fichier.nom || 'fichier';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    
                    toast.success('Fichier téléchargé avec succès');
                  } catch (error) {
                    console.error('Erreur lors du téléchargement:', error);
                    toast.error('Erreur lors du téléchargement du fichier');
                  }
                }}
                onDelete={async (id: string) => {
                  if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
                    try {
                      // Récupérer le fichier pour obtenir le chemin
                      const fichier = fichiers.find(f => f.id === id);
                      if (!fichier) {
                        throw new Error('Fichier non trouvé');
                      }
                      
                      // Utiliser fileService.deleteFile qui supprime toutes les dépendances
                      await fileService.deleteFile(id, fichier.chemin);
                      
                      setFichiers(prev => prev.filter(f => f.id !== id));
                      toast.success('Fichier supprimé avec succès');
                    } catch (error) {
                      console.error('Erreur lors de la suppression:', error);
                      toast.error('Erreur lors de la suppression du fichier');
                    }
                  }
                }}
                onStatusChange={async (id: string, newStatus: string) => {
                  try {
                    // Valider et caster le statut
                    const status = validateStatus(newStatus);
                    
                    const { error } = await supabase
                      .from('fichiers_import')
                      .update({ statut: status })
                      .eq('id', id);
                    
                    if (error) throw error;
                    
                    setFichiers(prev => 
                      prev.map(f => f.id === id ? { ...f, statut: status } : f)
                    );
                    
                    toast.success('Statut mis à jour avec succès');
                  } catch (error) {
                    console.error('Erreur lors de la mise à jour du statut:', error);
                    toast.error('Erreur lors de la mise à jour du statut');
                  }
                }}
                  loadingStates={{}}
                />
              </>
            )}

            {activeTab === 'import' && (
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-semibold">Importer un fichier</h2>
                  <p className="text-sm text-muted-foreground">
                    Téléchargez un fichier Excel ou CSV pour importer des données
                  </p>
                </CardHeader>
                <CardContent>
                  <FileUploader
                    onUploadComplete={handleImportComplete}
                    onProgress={handleImportProgress}
                    onCancel={() => setActiveTab('fichiers')}
                    className="w-full"
                    enableMultiChannel={true} // Activer l'import multicanal avec détection automatique
                  />
                </CardContent>
              </Card>
            )}

            {importStatus === 'importing' && (
              <div className="fixed bottom-4 right-4 w-96 p-4 bg-background border rounded-lg shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Import en cours</h4>
                  <span className="text-sm text-muted-foreground">{importProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default FichiersPage;
