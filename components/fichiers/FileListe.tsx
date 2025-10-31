'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Download, Edit, Trash2, Play, Pause, RefreshCw, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { FichierImport } from '@/lib/types/fichier';
// Import DataTable with proper types
import { DataTable } from '@/components/ui/data-table';

// Type pour la prévisualisation des fichiers
type PreviewFile = {
  id: string;
  nom: string;
  chemin: string;
  mime_type: string;
  statut: 'actif' | 'inactif' | 'en_cours' | 'erreur';
  date_import: string;
  nb_lignes: number;
  nb_lignes_importees: number;
  mapping_colonnes: Record<string, string>;
  separateur: string;
  original_filename: string;
  taille: number;
  type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    fileType?: string;
    originalName?: string;
    uploadedAt?: string;
    rowCount?: number;
    fileSize?: number;
    mimeType?: string;
    [key: string]: any;
  };
};

// Définition du type pour les statuts de fichier
type FichierStatus = 'actif' | 'inactif' | 'supprime' | 'en_attente' | 'erreur';

// Fonction utilitaire pour mapper les statuts de fichier aux types de statut
const getStatusType = (statut: FichierStatus) => {
  switch (statut) {
    case 'actif':
      return 'success' as const;
    case 'inactif':
      return 'warning' as const;
    case 'supprime':
      return 'error' as const;
    case 'en_attente':
    case 'erreur':
      return 'info' as const;
    default:
      return 'info' as const;
  }
};

interface FileListeProps {
  fichiers: FichierImport[];
  isLoading: boolean;
  onRefresh: () => void;
  onEdit: (fichier: FichierImport) => void;
  onDownload: (fichier: FichierImport) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (id: string, statut: 'actif' | 'inactif') => void;
  onPreview?: (fichier: FichierImport) => void;
  loadingStates: Record<string, boolean>;
  fileLineCounts?: Record<string, number>;
}

export function FichiersDataTable({
  fichiers,
  onRefresh,
  onEdit,
  onDownload,
  onDelete,
  onStatusChange,
  onPreview,
  loadingStates = {},
  fileLineCounts = {},
  isLoading = false,
}: FileListeProps) {
  // Log pour déboguer les données reçues
  console.log('Fichiers reçus dans FileListe:', fichiers);
  const [previewFile, setPreviewFile] = useState<FichierImport | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Adapter FichierImport au format attendu par FilePreviewModal
  const adaptToPreviewFile = (file: FichierImport): FichierImport => ({
    ...file,
    chemin_fichier: (file as any).chemin_fichier || file.chemin, // Utiliser chemin_fichier s'il existe, sinon utiliser chemin
    mime_type: file.mime_type || 'text/plain',
    mapping_colonnes: (file as any).mapping_colonnes || {},
    separateur: (file as any).separateur || ',',
    original_filename: (file as any).original_filename || file.nom,
    taille: (file as any).taille || 0,
    type: (file as any).type || 'text/csv',
    user_id: (file as any).user_id || '',
    created_at: file.created_at || new Date().toISOString(),
    updated_at: (file as any).updated_at || new Date().toISOString(),
    metadata: {
      ...(file as any).metadata,
      fileType: (file as any).type || 'text/csv',
      originalName: (file as any).original_filename || file.nom,
      fileSize: (file as any).taille,
      rowCount: (file as any).nb_lignes,
      mimeType: file.mime_type || 'text/plain',
      uploadedAt: (file as any).date_import
    }
  });

  const handlePreview = (file: FichierImport) => {
    if (onPreview) {
      onPreview(file);
    } else {
      setPreviewFile(adaptToPreviewFile(file));
      setIsPreviewOpen(true);
    }
  };

  const columns = useMemo<ColumnDef<FichierImport>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom du fichier',
        cell: ({ row }) => {
          const fichier = row.original;
          const mapping = fichier.mapping_colonnes || {};
          const nbColonnes = typeof mapping === 'object' && mapping !== null 
            ? Object.keys(mapping).length 
            : 0;
          
          return (
            <div className="flex items-center space-x-3 group">
              <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg text-[#2563EB]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900 group-hover:text-[#2563EB] transition-colors duration-200">{fichier.nom}</span>
                <span className="text-xs text-gray-500">
                  {nbColonnes} colonne{nbColonnes > 1 ? 's' : ''} mappée{nbColonnes > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'lignes',
        header: 'Lignes',
        cell: ({ row }: { row: { original: FichierImport } }) => {
          const fichier = row.original;
          // Utiliser nb_lignes comme source principale, avec une valeur par défaut de 0
          const totalLignes = fichier.nb_lignes || 0;
          const lignesImportees = fichier.nb_lignes_importees || 0;
          
          return (
            <div className="flex items-center">
              <span className="font-medium text-gray-900">
                {totalLignes.toLocaleString('fr-FR')}
                {lignesImportees > 0 && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({lignesImportees.toLocaleString('fr-FR')} importée{lignesImportees > 1 ? 's' : ''})
                  </span>
                )}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'statut',
        header: 'Statut',
        cell: ({ row }: { row: { original: FichierImport } }) => {
          const fichier = row.original;
          return (
            <StatusBadge variant={getStatusType(fichier.statut as FichierStatus)} className="text-xs">
              {fichier.statut}
            </StatusBadge>
          );
        },
      },
      {
        id: 'date_import',
        header: 'Date d\'import',
        accessorKey: 'date_import',
        cell: ({ row }: { row: { original: FichierImport } }) => {
          const fichier = row.original;
          return format(new Date(fichier.date_import), 'PPpp', { locale: fr });
        },
      },
      {
        id: 'actions',
        cell: ({ row }: { row: { original: FichierImport } }) => {
          const fichier = row.original;
          const isLoading = loadingStates[fichier.id] || false;

          return (
            <div className="flex items-center space-x-1">
              {onPreview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(fichier);
                  }}
                  title="Prévisualiser"
                  className="p-2 text-gray-500 hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors duration-200"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(fichier);
                }}
                title="Modifier"
                className="p-2 text-gray-500 hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors duration-200"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(fichier);
                }}
                title="Télécharger"
                className="p-2 text-gray-500 hover:text-[#2563EB] hover:bg-blue-50 rounded-md transition-colors duration-200"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onStatusChange) {
                    onStatusChange(fichier.id, fichier.statut === 'actif' ? 'inactif' : 'actif');
                  }
                }}
                title={fichier.statut === 'actif' ? 'Désactiver' : 'Activer'}
                disabled={isLoading}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  isLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-500 hover:text-[#2563EB] hover:bg-blue-50'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : fichier.statut === 'actif' ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(fichier.id);
                }}
                title="Supprimer"
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      }
    ],
    [onDelete, onDownload, onEdit, onStatusChange, onPreview, loadingStates, fileLineCounts]
  );

  return (
    <Card className="border border-gray-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Fichiers importés</CardTitle>
            <CardDescription className="text-gray-500">
              Gestion des fichiers importés dans le système
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors duration-200"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden">
          <DataTable
            data={fichiers}
            columns={columns}
            onRowClick={(row: FichierImport) => (e: React.MouseEvent) => {
              // Ne pas déclencher l'édition si le clic provient d'un élément interactif
              const target = e.target as HTMLElement;
              const isInteractive = target.closest('button, a, [role="button"], [tabindex="0"]');
              if (!isInteractive) {
                onEdit(row);
              }
            }}
            isLoading={isLoading}
            emptyMessage={
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun fichier trouvé</h3>
                <p className="mt-1 text-sm text-gray-500">Commencez par importer un fichier pour le voir apparaître ici.</p>
              </div>
            }
            className="[&_th]:bg-gray-50 [&_th]:text-gray-500 [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wider [&_th]:px-4 [&_th]:py-3 [&_td]:px-4 [&_td]:py-3 [&_tr:not(:last-child)]:border-b [&_tr:hover]:bg-gray-50 [&_tr]:transition-colors [&_tr]:duration-150"
          />
        </div>
      </CardContent>
    </Card>
  );
}
