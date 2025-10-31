'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCrmData } from '@/hooks/useCrmData2';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { FichierSelecteur } from '@/components/fichiers/FichierSelecteur';
import { RawLeadsTable } from '@/components/leads/RawLeadsTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { RefreshCw, Filter, Plus} from 'lucide-react';
import dynamic from 'next/dynamic';

// Chargement dynamique de la Sidebar
const Sidebar = dynamic(() => import('@/components/Sidebar'), {
  ssr: false,
  loading: () => <div>...</div>
});
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { leadService } from '@/lib/services/leadService';

export default function LeadsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  
  // États
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all', // Valeur par défaut définie sur 'all' au lieu de ''
    dateRange: { from: '', to: '' }
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Récupération des données
  const {
    rawLeads = [],
    columnHeaders = [],
    isLoading: isDataLoading,
    selectedFiles = [],
    availableFiles = [],
    loadRawLeads,
  } = useCrmData();

  // Colonnes pour le tableau
  const columns = useMemo(() => {
    return columnHeaders.map(header => ({
      key: header,
      label: header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    }));
  }, [columnHeaders]);

  // Gestion des actions
  const handleExport = async (ids: string[]) => {
    try {
      const blob = await leadService.exportLeadsToCsv(ids, columns.map(c => c.key as string));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'export',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!selectedFileId) return;
    
    setIsRefreshing(true);
    try {
      await loadRawLeads([selectedFileId]);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedFileId, loadRawLeads]);

  // Calculate line counts for each file
  const fileLineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // If we have available files, use their metadata
    if (availableFiles.length > 0) {
      availableFiles.forEach(file => {
        counts[file.id] = file.nb_lignes || 0;
      });
    }
    
    // If we have raw leads data, we can use it for more accurate counting
    if (rawLeads.length > 0) {
      const countsByFile: Record<string, number> = {};
      rawLeads.forEach(lead => {
        if (lead._fileId) {
          countsByFile[lead._fileId] = (countsByFile[lead._fileId] || 0) + 1;
        }
      });
      
      // Merge with existing counts
      Object.entries(countsByFile).forEach(([fileId, count]) => {
        counts[fileId] = count;
      });
    }
    
    return counts;
  }, [availableFiles, rawLeads]);

  // Chargement automatique des données lorsque selectedFileId change
  useEffect(() => {
    if (selectedFileId) {
      const loadData = async () => {
        setIsRefreshing(true);
        try {
          await loadRawLeads([selectedFileId]);
        } finally {
          setIsRefreshing(false);
        }
      };
      loadData();
    }
  }, [selectedFileId, loadRawLeads]);

  // Filtrage des données
  const filteredLeads = useMemo(() => {
    return rawLeads.filter(lead => {
      const matchesSearch = !filters.search || 
        Object.values(lead).some(
          val => String(val).toLowerCase().includes(filters.search.toLowerCase())
        );
      // Mise à jour pour gérer la valeur 'all' comme aucun filtre
      const matchesStatus = !filters.status || filters.status === 'all' || lead.statut === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [rawLeads, filters]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="space-y-6">
      <div className="">
        <h2 className="mb-2 text-2xl text-blue-800 font-bold tracking-tight">Espace Leads</h2>
              <label className="text-sm font-medium">Fichier source</label>
              <FichierSelecteur
                onFichierSelect={(id) => {
                  setSelectedFileId(id);
                }}
                fileLineCounts={fileLineCounts}
                availableFiles={availableFiles}
                selectedFileId={selectedFileId}
              />
            </div>
          <Card>
          <RawLeadsTable
            data={filteredLeads}
            columns={columns}
            onExport={handleExport}
            onRefresh={handleRefresh}
          />
          </Card>
        </div>
      </div>
    </div>
  );
}