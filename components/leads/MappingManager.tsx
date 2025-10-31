// components/leads/MappingManager.tsx
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Check, AlertTriangle } from 'lucide-react';

interface FileType {
  id: string;
  nom: string;
  created_at: string;
  nb_lignes_importees?: number;
  mapping_colonnes?: Record<string, string>;
}

interface MappingManagerProps {
  selectedFiles: string[];
  availableFiles: FileType[];
  onClose: () => void;
}

const MappingManager = ({ selectedFiles, availableFiles, onClose }: MappingManagerProps) => {
  const [selectedStrategy, setSelectedStrategy] = useState<'latest' | 'manual'>('latest');
  const [customMapping, setCustomMapping] = useState<Record<string, string>>({});
  
  const selectedFileData = useMemo(() => {
    return availableFiles.filter((f: FileType) => selectedFiles.includes(f.id));
  }, [availableFiles, selectedFiles]);

  const latestFile = useMemo(() => {
    return selectedFileData
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [selectedFileData]);

  // Détecter les conflits de mapping
  const mappingConflicts = useMemo(() => {
    const conflicts: Record<string, string[]> = {};
    
    selectedFileData.forEach(file => {
      if (!file.mapping_colonnes) return;
      
      Object.entries(file.mapping_colonnes).forEach(([sourceCol, targetCol]) => {
        if (!conflicts[sourceCol]) {
          conflicts[sourceCol] = [];
        }
        conflicts[sourceCol].push(`${file.nom} → ${targetCol}`);
      });
    });
    
    return Object.entries(conflicts)
      .filter(([_, mappings]) => mappings.length > 1)
      .reduce((acc, [col, mappings]) => {
        acc[col] = mappings;
        return acc;
      }, {} as Record<string, string[]>);
  }, [selectedFileData]);

  const applyMapping = async () => {
    // Appliquer la stratégie de mapping sélectionnée
    // et rafraîchir les données fusionnées
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Gestion du Mapping des Fichiers</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Stratégie de mapping */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Stratégie de Fusion</h3>
            
            <RadioGroup value={selectedStrategy} onValueChange={(v: 'latest' | 'manual') => setSelectedStrategy(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="latest" id="latest" />
                <Label htmlFor="latest" className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Utiliser le mapping le plus récent</p>
                      <p className="text-sm text-slate-500">
                        Applique le mapping du fichier importé le plus récent
                      </p>
                    </div>
                    {latestFile && (
                      <Badge variant="secondary">
                        {latestFile.nom}
                      </Badge>
                    )}
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="flex-1">
                  <div>
                    <p className="font-medium">Mapping personnalisé</p>
                    <p className="text-sm text-slate-500">
                      Choisir manuellement le mapping pour chaque colonne
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Conflits de mapping */}
          {Object.keys(mappingConflicts).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="font-medium">Conflits de Mapping Détectés</h3>
              </div>
              
              {Object.entries(mappingConflicts).map(([column, mappings]) => (
                <div key={column} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="font-medium text-sm mb-2">{column}</p>
                  <div className="space-y-1">
                    {mappings.map((mapping, index) => (
                      <p key={index} className="text-xs text-slate-600 dark:text-slate-400">
                        {mapping}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fichiers sélectionnés */}
          <div className="space-y-3">
            <h3 className="font-medium">Fichiers Sélectionnés</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedFileData.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{file.nom}</p>
                    <p className="text-xs text-slate-500">
                      {file.nb_lignes_importees} leads • {new Date(file.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {Object.keys(file.mapping_colonnes || {}).length} champs
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        
        <div className="flex items-center justify-end space-x-2 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={applyMapping}>
            <Check className="h-4 w-4 mr-2" />
            Appliquer le Mapping
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MappingManager;