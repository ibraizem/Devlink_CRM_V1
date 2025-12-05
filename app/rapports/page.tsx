'use client';

import { useEffect } from 'react';
import  Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function RapportsPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoaded) return;
      
      if (!user) {
        router.push('/auth/login');
      }
    };
    checkAuth();
  }, [router, user, isLoaded]);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Rapports</h1>
            <p className="text-slate-600 mt-2">
              Statistiques et analyses de votre activité
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rapports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Les rapports détaillés seront disponibles prochainement.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
