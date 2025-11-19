'use client';

import { TeamForm } from '@/components/equipes/TeamForm';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
  
export default function NewTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = () => {
    router.push('/equipes');
    router.refresh();
  };

  const handleError = (error: string) => {
    setError(error);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/equipes" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour à la liste des équipes
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2">Nouvelle équipe</h1>
          <p className="text-muted-foreground mb-6">
            Créez une nouvelle équipe et gérez ses membres
          </p>
        </div>
        
        <div className="max-w-3xl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}
          <TeamForm 
            onSuccess={handleSuccess} 
            onCancel={() => router.push('/equipes')}
          />
        </div>
      </div>
    </div>
  );
}
