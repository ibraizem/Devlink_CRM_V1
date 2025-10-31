import { FileSpreadsheet, FileText, FileImage, FileArchive, FileVideo, FileAudio, FileCode, File, X, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/types/utils';
import { FichierImport } from '@/lib/types/fichier';

interface FileCardProps {
  file: FichierImport;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string, filePath: string) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: 'actif' | 'inactif') => Promise<void>;
  onPreview: (file: FichierImport) => void;
  isDeleting: boolean;
  isToggling: boolean;
}

export const FileCard = ({
  file,
  isSelected,
  onSelect,
  onDelete,
  onToggleStatus,
  onPreview,
  isDeleting,
  isToggling
}: FileCardProps) => {
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-6 w-6 text-blue-500" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FileArchive className="h-6 w-6 text-yellow-500" />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <FileVideo className="h-6 w-6 text-purple-500" />;
      case 'mp3':
      case 'wav':
        return <FileAudio className="h-6 w-6 text-green-500" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'html':
      case 'css':
        return <FileCode className="h-6 w-6 text-blue-400" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      actif: { variant: 'default', label: 'Actif' },
      inactif: { variant: 'outline', label: 'Inactif' },
      en_cours: { variant: 'secondary', label: 'En cours' },
      erreur: { variant: 'destructive', label: 'Erreur' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { variant: 'outline', label: status };
    return <Badge variant={statusInfo.variant as any} className="text-xs">{statusInfo.label}</Badge>;
  };

  return (
    <div 
      className={cn(
        "relative rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md overflow-hidden group",
        isSelected ? "ring-2 ring-primary" : "hover:border-primary/50"
      )}
      onClick={() => onSelect(file.id)}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="h-12 w-12 flex items-center justify-center rounded-lg bg-muted">
              {getFileIcon(file.original_filename || '')}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium truncate">
                {file.original_filename || 'Sans nom'}
              </h3>
              <div className="ml-2">
                {getStatusBadge(file.statut)}
              </div>
            </div>
            
            <div className="mt-1 text-xs text-muted-foreground">
              <p>Ajouté le {format(new Date(file.date_import), 'PP', { locale: fr })}</p>
              <p>{Math.round((file.taille || 0) / 1024)} Ko • {file.nb_lignes} entrées</p>
            </div>
            
            <div className="mt-3 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(file);
                }}
              >
                Aperçu
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-7"
                onClick={async (e) => {
                  e.stopPropagation();
                  await onToggleStatus(file.id, file.statut as 'actif' | 'inactif');
                }}
                disabled={isToggling}
              >
                {isToggling ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : file.statut === 'actif' ? (
                  'Désactiver'
                ) : (
                  'Activer'
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-7 text-destructive hover:text-destructive"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
                    await onDelete(file.id, file.chemin);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {file.statut === 'actif' && (
        <div className="absolute top-2 right-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
        </div>
      )}
      
      {isSelected && (
        <div className="absolute top-2 left-2">
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};
