'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Désactive le rechargement automatique lors du retour au focus de la fenêtre
        refetchOnWindowFocus: false,
        // Désactive le rechargement lors de la reconnexion réseau
        refetchOnReconnect: false,
        // Désactive le rechargement lors du montage du composant
        refetchOnMount: true,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
