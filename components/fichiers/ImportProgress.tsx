'use client';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImportProgressProps {
  progress: number;
  status: 'idle' | 'importing' | 'completed' | 'error' | 'cancelled';
  onCancel: () => void;
  fileName: string;
  totalItems: number;
  processedItems: number;
  errors: string[];
}

export function ImportProgress({
  progress,
  status,
  onCancel,
  fileName,
  totalItems,
  processedItems,
  errors,
}: ImportProgressProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'importing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'importing':
        return 'Import en cours...';
      case 'completed':
        return 'Import terminé avec succès';
      case 'error':
        return 'Erreur lors de l\'import';
      case 'cancelled':
        return 'Import annulé';
      default:
        return 'Prêt à importer';
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium">{fileName}</h4>
          <p className="text-sm text-muted-foreground">
            {processedItems} / {totalItems} éléments traités
          </p>
        </div>
        {status === 'importing' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Annuler
          </Button>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>{getStatusText()}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className={`h-2 ${getStatusColor()}`} />
      </div>

      {errors.length > 0 && (
        <div className="mt-2 text-sm text-red-500 space-y-1">
          <p className="font-medium">Erreurs ({errors.length}) :</p>
          <div className="max-h-32 overflow-y-auto">
            {errors.map((error, index) => (
              <p key={index} className="text-xs">• {error}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
