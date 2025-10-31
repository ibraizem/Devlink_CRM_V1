// hooks/crm/useFileSelection.ts
import { useState, useCallback } from 'react';

export function useFileSelection() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  const selectAllFiles = useCallback((fileIds: string[]) => {
    setSelectedFiles(fileIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  const isFileSelected = useCallback((fileId: string) => {
    return selectedFiles.includes(fileId);
  }, [selectedFiles]);

  return {
    selectedFiles,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    isFileSelected
  };
}