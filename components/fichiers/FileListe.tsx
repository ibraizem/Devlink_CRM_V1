'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Download, Edit, Trash2, Play, Pause, RefreshCw, Eye, Loader2, Target, Users, Check, Search, Upload, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { FichierImport } from '@/lib/types/fichier';
import { Lead } from '@/lib/types/leads';
import { useLeads } from '@/hooks/useLeads';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

// Type pour les statuts de fichier
type FichierStatus = 'actif' | 'inactif' | 'en_traitement' | 'erreur';

// Fonction pour déterminer le type de statut
const getStatusType = (status: FichierStatus): 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'actif':
      return 'success';
    case 'inactif':
      return 'warning';
    case 'en_traitement':
      return 'info';
    case 'erreur':
      return 'error';
    default:
      return 'info';
  }
};

// Type pour les états de chargement
type LoadingStates = Record<string, boolean>;

// Type pour les comptes de lignes
type FileLineCounts = Record<string, number>;

// Interface pour les props du composant
interface FileListeProps {
  fichiers: FichierImport[];
  isLoading: boolean;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onDownload: (fichier: FichierImport) => void;
  onEdit: (fichier: FichierImport) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onPreview: (fichier: FichierImport) => void;
  onSyncLeads?: (fileId?: string) => Promise<void>;
  leads?: Lead[];
  loadingStates?: LoadingStates;
  fileLineCounts?: FileLineCounts;
}

export const FileListe: React.FC<FileListeProps> = ({
  fichiers,
  isLoading,
  onRefresh,
  onDelete,
  onDownload,
  onEdit,
  onStatusChange,
  onPreview,
  onSyncLeads,
  leads: leadsFromProps,
  loadingStates = {},
  fileLineCounts = {}
}) => {
  const { leads: leadsFromHook } = useLeads();
  // Utiliser les leads passés en prop, sinon utiliser ceux du hook
  const leads = leadsFromProps || leadsFromHook;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filtrer les fichiers
  const filteredFiles = useMemo(() => {
    return fichiers.filter(fichier => {
      const matchesSearch = fichier.nom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || fichier.statut === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [fichiers, searchTerm, statusFilter]);

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-blue-50 px-6 py-6 text-blue-600 border-b border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-blue-600">Fichiers importés</CardTitle>
                <CardDescription className="text-blue-600/80 text-sm">
                  {fichiers.length} fichier{fichiers.length > 1 ? 's' : ''} dans le système
                </CardDescription>
              </div>
            </div>
            
            {/* Statistiques globales */}
            {fichiers.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 border border-blue-100 rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-700">
                    {fichiers.filter(f => f.statut === 'actif').length} actif{fichiers.filter(f => f.statut === 'actif').length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 border border-blue-100 rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-700">
                    {Object.values(fileLineCounts).reduce((a, b) => a + b, 0).toLocaleString()} leads
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 border border-blue-100 rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-700">
                    {leads?.length || 0} campagne{leads?.length !== 1 ? 's' : ''} associée{leads?.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {onSyncLeads && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onSyncLeads()}
                disabled={isLoading || loadingStates['sync']}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loadingStates['sync'] ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Synchroniser les leads
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-gray-600 font-medium">Chargement des fichiers...</p>
              <p className="text-sm text-gray-500">Récupération des données en cours</p>
            </div>
          </div>
        ) : fichiers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <div className="text-center space-y-3 max-w-md">
              <h3 className="text-xl font-semibold text-gray-900">Aucun fichier importé</h3>
              <p className="text-gray-600 leading-relaxed">
                Commencez par importer votre premier fichier pour gérer vos leads et campagnes efficacement.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button 
                  onClick={() => window.location.href = '/fichiers/import'}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer un fichier
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onRefresh}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filtres et recherche */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-gray-50 p-4 rounded-xl">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un fichier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Tous les statuts</option>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="en_traitement">En traitement</option>
                  <option value="erreur">Erreur</option>
                </select>
              </div>
            </div>

            {/* Grille des fichiers */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFiles.map((fichier) => {
                const leadsCount = leads.filter(lead => lead.fichier_id === fichier.id).length;
                const metadata = fichier.metadata as any || {};
                const totalLeads = metadata.totalLeads || 0;
                const validLeads = metadata.validLeads || 0;
                // Calculer le score de qualité basé sur le ratio de leads valides
                const qualityScore = totalLeads > 0 ? Math.round((validLeads / totalLeads) * 100) : 0;
                // Calculer le taux de conversion basé sur les leads avec RDV OK (pour l'instant 0)
                const conversionRate = 0; // Sera calculé quand on aura les données de RDV
                const lineCount = fileLineCounts[fichier.id] || 0;
                
                return (
                  <Card key={fichier.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2"></div>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header du fichier */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {fichier.nom}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {new Date(fichier.date_import).toLocaleDateString('fr-FR')}
                                </span>
                                {lineCount > 0 && (
                                  <>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">{lineCount} lignes</span>
                                  </>
                                )}
                                {leadsCount > 0 && (
                                  <>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">{leadsCount} leads</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <StatusBadge 
                            variant={getStatusType(fichier.statut as FichierStatus)} 
                            className="text-xs"
                          >
                            {fichier.statut}
                          </StatusBadge>
                        </div>

                        {/* Statistiques */}
                        {totalLeads > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div>
                                <div className="text-lg font-bold text-blue-600">{totalLeads.toLocaleString('fr-FR')}</div>
                                <div className="text-xs text-gray-600">Total</div>
                              </div>
                              <div>
                                <div className={`text-lg font-bold ${
                                  qualityScore >= 80 ? 'text-green-600' : 
                                  qualityScore >= 50 ? 'text-yellow-600' : 'text-red-600'
                                }`}>{qualityScore}%</div>
                                <div className="text-xs text-gray-600">Qualité</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold text-green-600">{validLeads.toLocaleString('fr-FR')}</div>
                                <div className="text-xs text-gray-600">Valides</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  conversionRate >= 80 ? 'bg-green-500' : 
                                  conversionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${conversionRate}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 text-center mt-1">
                              Taux conversion: {conversionRate}% (RDV OK)
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPreview(fichier)}
                            className="flex-1 border-gray-300 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Aperçu
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => onEdit(fichier)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDownload(fichier)}>
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger
                              </DropdownMenuItem>
                              {onSyncLeads && (
                                <DropdownMenuItem onClick={() => onSyncLeads(fichier.id)}>
                                  <Target className="w-4 h-4 mr-2" />
                                  Synchroniser les leads
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(fichier.id, fichier.statut === 'actif' ? 'inactif' : 'actif')}
                                className={fichier.statut === 'actif' ? 'text-orange-600' : 'text-green-600'}
                              >
                                {fichier.statut === 'actif' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                {fichier.statut === 'actif' ? 'Désactiver' : 'Activer'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => onDelete(fichier.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Message si aucun fichier après filtrage */}
            {filteredFiles.length === 0 && !isLoading && fichiers.length > 0 && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun fichier trouvé</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter ? 'Essayez de modifier vos filtres de recherche.' : 'Aucun fichier ne correspond à vos critères.'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileListe;