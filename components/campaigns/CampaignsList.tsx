"use client";

import React, { useState, useEffect } from 'react';
import { useCampaignProgress } from '@/hooks/useCampaignProgress';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Campaign, CampaignStatus } from '@/lib/types/campaign';
import { useCampaigns } from '@/hooks/useCampaigns';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Plus, FileText, Filter, Calendar, Users, Target, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';

interface CampaignsListProps {
  baseUrl?: string;
}

import { CampaignModal } from './CampaignModal';
import { CampaignDetailModal } from './CampaignDetailModal';
import { CampaignsCardView } from './CampaignsCardView';
import { FilePreviewModal } from '@/components/fichiers/FilePreviewModal';
import { Grid, List } from 'lucide-react';

// Composant pour afficher la progression avec le hook
function CampaignProgressRow({ campaignId }: { campaignId: string }) {
  const { totalLeads, contactedLeads, progress, loading, error } = useCampaignProgress(campaignId);

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-[80px]">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden animate-pulse">
            <div className="h-full bg-gray-300 w-1/3" />
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-400">...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-[80px]">
          <div className="h-2 bg-red-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-300 w-full" />
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm text-red-600">Erreur</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-[80px]">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              progress >= 80 ? 'bg-green-500' :
              progress >= 50 ? 'bg-blue-500' :
              progress >= 25 ? 'bg-amber-500' : 'bg-gray-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold text-gray-700">
          {progress}%
        </span>
        <span className="text-xs text-gray-500 ml-1">
          ({contactedLeads}/{totalLeads})
        </span>
      </div>
    </div>
  );
}

export function CampaignsList({ baseUrl = '/dashboard' }: CampaignsListProps) {
  const router = useRouter();
  const { campaigns, loading, error, fetchCampaigns, deleteCampaign, getCampaignFiles } = useCampaigns();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // États pour les modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [campaignFiles, setCampaignFiles] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  
  // État pour le FilePreviewModal
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleViewCampaign = async (campaign: any) => {
    setSelectedCampaign(campaign);
    try {
      const files = await getCampaignFiles(campaign.id);
      setCampaignFiles(files);
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      setCampaignFiles([]);
    }
    setIsDetailModalOpen(true);
  };

  const handleViewFilePreview = async (file: any) => {
    try {
      // Afficher un état de chargement
      const loadingData = {
        columns: [{ header: 'Message', accessor: 'message' }],
        data: [{ message: 'Chargement de l\'aperçu...' }],
        isLoading: true,
        error: null
      };
      setPreviewData(loadingData);
      setIsFilePreviewOpen(true);
      
      // Utiliser le client Supabase pour télécharger le fichier
      const { supabase } = await import('@/lib/supabase/client');
      
      let fileData: ArrayBuffer | null = null;
      
      // Si l'URL ne commence pas par http, c'est probablement un chemin Supabase Storage
      if (!file.file_url.startsWith('http')) {
        // Télécharger depuis Supabase Storage
        const { data, error } = await supabase.storage
          .from('fichiers')
          .download(file.file_url);
        
        if (error) {
          throw new Error(`Erreur Supabase: ${error.message}`);
        }
        
        fileData = await data.arrayBuffer();
      } else {
        // Essayer de télécharger depuis l'URL directe
        const response = await fetch(file.file_url);
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        fileData = await response.arrayBuffer();
      }
      
      if (!fileData) {
        throw new Error('Impossible de récupérer les données du fichier');
      }
      
      // Créer un objet File à partir des données
      const blob = new Blob([fileData], { type: file.file_type });
      const fileObj = new File([blob], file.name, { type: file.file_type });
      
      // Utiliser le service fileService pour lire le fichier
      const { fileService } = await import('@/lib/services/fileService');
      const jsonData = await fileService.readFileAsJson(fileObj, 0);
      
      if (jsonData && jsonData.length > 0) {
        // jsonData est déjà un tableau d'objets avec les en-têtes comme clés
        // Extraire les en-têtes depuis les clés du premier objet
        const firstRow = jsonData[0];
        const headers = Object.keys(firstRow);
        
        // Limiter à 10 lignes pour l'aperçu
        const dataRows = jsonData.slice(0, 10);
        
        // Créer les colonnes pour le FilePreviewModal
        const columns = headers.map((header: string, index: number) => ({
          header: header || `Colonne ${index + 1}`,
          accessor: header || `col_${index}`
        }));
        
        // Les données sont déjà au bon format (tableau d'objets)
        const data = dataRows.map((row: any) => {
          const rowObj: any = {};
          headers.forEach((header: string) => {
            rowObj[header] = row[header] || '';
          });
          return rowObj;
        });
        
        const previewData = {
          columns,
          data,
          isLoading: false,
          error: null
        };
        setPreviewData(previewData);
      } else {
        // Fichier vide ou sans données
        const previewData = {
          columns: [{ header: 'Message', accessor: 'message' }],
          data: [{ message: 'Le fichier ne contient aucune donnée' }],
          isLoading: false,
          error: null
        };
        setPreviewData(previewData);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'aperçu:', error);
      // Afficher un message d'erreur dans l'aperçu
      const errorData = {
        columns: [{ header: 'Erreur', accessor: 'error' }],
        data: [{ 
          error: `Impossible de charger l'aperçu: ${(error as Error).message}`,
          url: file.file_url 
        }],
        isLoading: false,
        error: 'Erreur lors du chargement'
      };
      setPreviewData(errorData);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Octets";
    const k = 1024;
    const sizes = ["Octets", "Ko", "Mo", "Go"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleEditCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsEditModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    await deleteCampaign(campaignId);
    fetchCampaigns(page, pageSize, {
      search: searchTerm,
      ...(statusFilter !== 'all' && { status: statusFilter }),
    });
  };

  const handleCampaignSuccess = () => {
    // Fermer les modals
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedCampaign(null);
    
    // Rafraîchir la liste
    fetchCampaigns(page, pageSize, {
      search: searchTerm,
      ...(statusFilter !== 'all' && { status: statusFilter }),
    });
  };

  useEffect(() => {
    fetchCampaigns(page, pageSize, {
      search: searchTerm,
      ...(statusFilter !== 'all' && { status: statusFilter }),
    });
  }, [page, searchTerm, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Brouillon', className: 'bg-slate-200 text-slate-800' },
      active: { label: 'Active', className: 'bg-green-600 text-white' },
      paused: { label: 'En pause', className: 'bg-yellow-400 text-yellow-900' },
      completed: { label: 'Terminée', className: 'bg-red-600 text-white' },
      cancelled: { label: 'Annulée', className: 'bg-red-500 text-white' },
    };

    const config = statusConfig[status as CampaignStatus] || { label: status, className: 'bg-gray-200 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non défini';
    return format(new Date(dateString), 'PP', { locale: fr });
  };

  if (loading && campaigns.length === 0) {
    return <div className="flex justify-center py-8">Chargement des campagnes...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Erreur lors du chargement des campagnes : {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Gérez vos campagnes de prospection multi-canal</h1>
          <p className="text-sm text-gray-600 mt-1">
            {campaigns.length} campagne{campaigns.length > 1 ? 's' : ''} trouvée{campaigns.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Boutons de basculement de vue */}
          <div className="flex items-center border rounded-md p-1 bg-gray-50">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="h-8 w-8 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle campagne
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une campagne..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </form>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | 'all')}
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="active">Active</option>
            <option value="paused">En pause</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
      </div>

      {/* Affichage de la vue sélectionnée */}
      {viewMode === 'card' ? (
        <CampaignsCardView
          campaigns={campaigns}
          onView={handleViewCampaign}
          onEdit={handleEditCampaign}
          onDelete={handleDeleteCampaign}
        />
      ) : (
        <div className="rounded-xl border border-gray-200/60 bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/80 px-6 py-4 border-b border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Liste des campagnes</h3>
                <p className="text-sm text-gray-600">Vue détaillée de toutes vos campagnes</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50 border-b border-gray-200/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-gray-700 border-r border-gray-200/40">Nom</TableHead>
                  <TableHead className="font-semibold text-gray-700 border-r border-gray-200/40">Description</TableHead>
                  <TableHead className="font-semibold text-gray-700 border-r border-gray-200/40">Statut</TableHead>
                  <TableHead className="font-semibold text-gray-700 border-r border-gray-200/40">Date de début</TableHead>
                  <TableHead className="font-semibold text-gray-700 border-r border-gray-200/40">Date de fin</TableHead>
                  <TableHead className="font-semibold text-gray-700 border-r border-gray-200/40">Progression</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Target className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">Aucune campagne trouvée</p>
                          <p className="text-gray-500 text-sm mt-1">Créez votre première campagne pour commencer</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => (
                    <TableRow 
                      key={campaign.id} 
                      className="cursor-pointer hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-200/30 group"
                      onClick={() => handleViewCampaign(campaign)}
                    >
                      <TableCell className="font-medium py-4 border-r border-gray-200/30">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                              {campaign.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 border-r border-gray-200/30">
                        <div className="text-sm text-gray-600 max-w-xs">
                          {campaign.description ? (
                            <div className="break-words">
                              {campaign.description.split(' ').slice(0, 4).join(' ')}
                              {campaign.description.split(' ').length > 4 && '...'}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Aucune description</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 border-r border-gray-200/30">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(campaign.status)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 border-r border-gray-200/30">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-50 rounded">
                            <Calendar className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {formatDate(campaign.start_date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 border-r border-gray-200/30">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-50 rounded">
                            <Calendar className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {formatDate(campaign.end_date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 border-r border-gray-200/30">
                        <CampaignProgressRow campaignId={campaign.id} />
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCampaign(campaign);
                            }}
                            className="hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCampaign(campaign);
                            }}
                            className="hover:bg-amber-50 hover:text-amber-700 transition-colors"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination (uniquement pour la vue tableau) */}
      {viewMode === 'table' && (
        <div className="flex items-center justify-between px-6 py-4 bg-white/50 backdrop-blur-sm rounded-lg border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">
                {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, campaigns.length)}
              </span>
              <span className="text-gray-500"> sur {campaigns.length} campagne{campaigns.length > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-md">
              <span className="text-sm font-medium text-blue-700">Page {page}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={campaigns.length < pageSize}
              className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCampaignSuccess}
      />
      
      <CampaignModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        campaign={selectedCampaign}
        onSuccess={handleCampaignSuccess}
      />
      
      <CampaignDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        campaign={selectedCampaign}
        campaignFiles={campaignFiles}
        onEdit={handleEditCampaign}
        onDelete={handleDeleteCampaign}
        onPreviewFile={handleViewFilePreview}
      />
      
      <FilePreviewModal
        isOpen={isFilePreviewOpen}
        onOpenChange={setIsFilePreviewOpen}
        previewData={previewData}
      />
    </div>
  );
}
