'use client';

import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface PreviewData {
  fichierId: string;
  data: any[];
  columns: { header: string; accessor: string }[];
  isLoading: boolean;
  error: string | null;
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: PreviewData | null;
}

export function FilePreviewModal({ isOpen, onOpenChange, previewData }: FilePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] w-full flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Aperçu des données</DialogTitle>
          {previewData?.columns && (
            <p className="text-sm text-muted-foreground">
              {previewData.columns.length} colonnes • {previewData.data.length} lignes
            </p>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {previewData?.isLoading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="space-y-4 w-full max-w-md">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ) : previewData?.error ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <p className="text-red-500 font-medium">Erreur lors du chargement</p>
                <p className="text-sm text-muted-foreground">{previewData.error}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-auto px-1">
                <div className="min-w-max">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="border-b-2">
                        {previewData?.columns.map((column) => (
                          <TableHead 
                            key={column.accessor}
                            className="whitespace-nowrap px-4 py-3 text-sm font-medium bg-muted/50"
                          >
                            <div className="flex items-center">
                              <span className="truncate max-w-[200px] inline-block">
                                {column.header}
                              </span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData?.data.map((row, rowIndex) => (
                        <TableRow 
                          key={rowIndex} 
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {previewData.columns.map((column) => (
                            <TableCell 
                              key={`${rowIndex}-${column.accessor}`} 
                              className="px-4 py-2 text-sm border-b whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]"
                              title={String(row[column.accessor] || '')}
                            >
                              <div className="truncate">
                                {row[column.accessor]?.toString() || '-'}
                              </div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="border-t px-4 py-3 flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <span className="font-medium mr-1">{previewData?.data.length || 0}</span> lignes
                  </span>
                  <span className="flex items-center">
                    <span className="font-medium mr-1">{previewData?.columns.length || 0}</span> colonnes
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-muted px-2 py-1 rounded-md">
                    Faites défiler horizontalement pour voir plus de colonnes
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
