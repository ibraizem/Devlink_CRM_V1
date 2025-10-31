// components/crm/FileSelector.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, X } from 'lucide-react';

interface FileSelectorProps {
  files: any[];
  selectedFiles: string[];
  onFileToggle: (fileId: string) => void;
  onClearSelection: () => void;
}

const FileSelector = ({ 
  files, 
  selectedFiles, 
  onFileToggle, 
  onClearSelection 
}: FileSelectorProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">
            Fichiers Actifs Disponibles
          </h3>
          
          {selectedFiles.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              <X className="h-4 w-4 mr-1" />
              Tout désélectionner
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors cursor-pointer ${
                selectedFiles.includes(file.id)
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                  : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              onClick={() => onFileToggle(file.id)}
            >
              <Checkbox
                checked={selectedFiles.includes(file.id)}
                onCheckedChange={() => onFileToggle(file.id)}
              />
              
              <FileText className="h-4 w-4 text-slate-500" />
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {file.nom}
                </span>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span>{file.nb_lignes_importees || 0} leads</span>
                  <span>•</span>
                  <span>
                    {new Date(file.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              
              <Badge variant="secondary" className="ml-2">
                {file.mapping_colonnes ? Object.keys(file.mapping_colonnes).length : 0} champs
              </Badge>
            </div>
          ))}
          
          {files.length === 0 && (
            <div className="text-center py-4 text-slate-500 w-full">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun fichier actif disponible</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileSelector;