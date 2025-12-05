'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface BulkActionSummaryProps {
  selectedCount: number;
  action: string;
  details?: {
    label: string;
    value: string | number;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }[];
}

export function BulkActionSummary({
  selectedCount,
  action,
  details = [],
}: BulkActionSummaryProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Résumé de l&apos;action</CardTitle>
            <CardDescription>{action}</CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {selectedCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              {selectedCount} lead{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </span>
          </div>

          {details.length > 0 && (
            <div className="mt-4 space-y-2 pt-2 border-t">
              {details.map((detail, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{detail.label}</span>
                  <Badge variant={detail.variant || 'outline'}>
                    {detail.value}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground mt-4 pt-2 border-t">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Cette action sera appliquée immédiatement à tous les leads sélectionnés.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
