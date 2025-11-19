'use client';

import { TeamForm } from '@/components/equipes/TeamForm';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditTeamPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        
        setTeam(data);
      } catch (err) {
        console.error('Error fetching team:', err);
        setError('Erreur lors du chargement de l\'équipe');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [params.id, supabase]);

  const handleSuccess = () => {
    router.push(`/equipes/${params.id}`);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div>Chargement de l'équipe...</div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-red-500">{error || 'Équipe non trouvée'}</div>
          <Button variant="outline" onClick={() => router.push('/equipes')} className="mt-4">
            Retour à la liste des équipes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/equipes/${params.id}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux détails de l'équipe
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mb-2">Modifier l'équipe</h1>
          <p className="text-muted-foreground mb-6">
            Modifiez les informations de l'équipe
          </p>
        </div>
        
        <div className="max-w-3xl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}
          <TeamForm 
            team={team} 
            onSuccess={handleSuccess}
            onCancel={() => router.push(`/equipes/${params.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
