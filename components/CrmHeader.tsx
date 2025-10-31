'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Search, Plus, Filter } from 'lucide-react';

interface CrmHeaderProps {
  activeView: 'leads' | 'campaigns' | 'analytics';
  onViewChange: (view: 'leads' | 'campaigns' | 'analytics') => void;
  selectedFilesCount: number;
  onRefresh: () => void;
}

export function CrmHeader({ 
  activeView, 
  onViewChange, 
  selectedFilesCount,
  onRefresh 
}: CrmHeaderProps) {
  return (
    <header className="border-b border-blue-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-blue-800 dark:text-white">
            Gestion des Leads
          </h1>
          
          <Tabs 
            value={activeView} 
            onValueChange={(value: string) => onViewChange(value as 'leads' | 'campaigns')}
            className="ml-6"
          >
            <TabsList>
              <TabsTrigger value="leads">
                Leads
                {selectedFilesCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                    {selectedFilesCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-800" />
            <Input
              type="search"
              placeholder="Rechercher des leads..."
              className="pl-10 w-[300px]"
            />
          </div>
          
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Lead
          </Button>
          
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
