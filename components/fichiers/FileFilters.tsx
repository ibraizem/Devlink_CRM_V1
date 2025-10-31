// components/fichiers/FileFilters.tsx
'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileData } from '@/lib/types/file.types';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface FileFiltersProps {
  onFilterChange: (filters: {
    search: string;
    status: FileData['status'] | 'all';
    type: string;
  }) => void;
  className?: string;
}

export function FileFilters({ onFilterChange, className = '' }: FileFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' as const,
    type: 'all',
  });

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher un fichier..."
          className="pl-9"
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <div className="w-[150px]">
          <Select
            value={filters.status}
            onValueChange={(value: string) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="processing">En cours</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="error">Erreur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <Select
            value={filters.type}
            onValueChange={(value: string) => handleChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
              <SelectItem value="xls">Excel (.xls)</SelectItem>
              <SelectItem value="csv">CSV (.csv)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}