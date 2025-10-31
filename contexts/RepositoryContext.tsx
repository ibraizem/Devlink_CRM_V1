'use client';

import { createContext, useContext, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { FichierRepository } from '@/lib/repositories/FichierRepository';

interface RepositoryContextType {
  fichierRepository: FichierRepository;
  // Ajoutez d'autres repositories ici au besoin
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export function RepositoryProvider({
  supabase,
  children,
}: {
  supabase: SupabaseClient;
  children: ReactNode;
}) {
  const repositories = {
    fichierRepository: new FichierRepository(supabase),
    // Initialisez d'autres repositories ici
  };

  return (
    <RepositoryContext.Provider value={repositories}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepository() {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  return context;
}
