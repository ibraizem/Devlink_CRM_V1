'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { createClient } from '@/lib/utils/supabase/client';
import { RefreshCw, X, Save } from 'lucide-react';
import React from 'react';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { FichierImport } from '@/lib/types/fichier';
import { FichiersDataTable } from '@/components/fichiers/FileListe';
import dynamic from 'next/dynamic';
import { useUser } from '@/hooks/useUser';
import { FileUploader } from '@/components/fichiers/FileUploader';
import { FilePreviewModal } from '@/components/fichiers/FilePreviewModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const Sidebar = dynamic(() => import('@/components/Sidebar'), {
  ssr: false,
  loading: () => <div>Chargement de la barre latérale...</div>
});

function FichiersPage() {
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
  
  const supabase = createClient();
  const { user } = useUser();
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Charger les fichiers au montage
  useEffect(() => {
    if (user) {
      fetchFichiers();
    }
  }, [user, fetchFichiers]);

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
      <Sidebar />
      <div className="flex-1 p-6 md:p-8">
        <div className="container mx-auto max-w-7xl">
          {/* Composant de prévisualisation de fichier */}
          <FilePreviewModal 
            isOpen={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            previewData={previewData}
          />

          <div className="space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Fichiers</h1>
              <p className="text-gray-600">Gérez et importez vos fichiers de données</p>
            </div>

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
                  <DialogContent className="sm:max-w-[500px] rounded-xl">
                    <DialogHeader className="pb-4 border-b border-gray-200">
                      <DialogTitle className="text-xl font-semibold text-gray-900">Modifier le fichier</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Mettez à jour le nom du fichier et consultez ses détails.
                      </DialogDescription>
                    </DialogHeader>
                    {editingFile && (
                      <div className="py-6 space-y-6">
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
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 pt-4">
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

                <FichiersDataTable
                  fichiers={fichiers}
                  onRefresh={fetchFichiers}
                  isLoading={isLoadingFiles}
                  onPreview={handlePreview}
                  fileLineCounts={fichiers.reduce((acc, file) => ({
                    ...acc,
                    [file.id]: file.nb_lignes || 0
                  }), {})}
                  onEdit={(fichier) => {
                    setEditingFile(fichier);
                    setNewFileName(fichier.nom || ''); // Initialiser le champ avec le nom actuel
                    setIsEditing(true);
                  }}
                onDownload={async (fichier) => {
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
                      const { error } = await supabase
                        .from('fichiers_import')
                        .delete()
                        .eq('id', id);
                      
                      if (error) throw error;
                      
                      setFichiers(prev => prev.filter(f => f.id !== id));
                      toast.success('Fichier supprimé avec succès');
                    } catch (error) {
                      console.error('Erreur lors de la suppression:', error);
                      toast.error('Erreur lors de la suppression du fichier');
                    }
                  }
                }}
                onStatusChange={async (id: string, statut: 'actif' | 'inactif') => {
                  try {
                    const { error } = await supabase
                      .from('fichiers_import')
                      .update({ statut })
                      .eq('id', id);
                    
                    if (error) throw error;
                    
                    setFichiers(prev => 
                      prev.map(f => f.id === id ? { ...f, statut } : f)
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