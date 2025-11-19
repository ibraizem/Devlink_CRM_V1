'use client';

import { useEffect, useState } from 'react';
import  Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RendezvousPage() {
  type Rendezvous = { [key: string]: any };
  const [rendezvous, setRendezvous] = useState<Rendezvous[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      loadRendezvous(supabase);
    };
    checkAuth();
  }, [router]);

  const loadRendezvous = async (supabase: any) => {
    setLoading(true);
    const { data } = await supabase
      .from('rendezvous')
      .select('*, leads(*), users_profile:agent_id(nom, prenom)')
      .order('date_heure', { ascending: true });

    if (data) {
      setRendezvous(data);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Rendez-vous</h1>
            <p className="text-slate-600 mt-2">
              Gérez vos rendez-vous planifiés
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {rendezvous.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Aucun rendez-vous planifié
                    </p>
                  </CardContent>
                </Card>
              ) : (
                rendezvous.map((rdv) => (
                  <Card key={rdv.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          {(rdv as any).leads?.prenom} {(rdv as any).leads?.nom}
                        </CardTitle>
                        <Badge>{rdv.statut || 'planifie'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(rdv.date_heure).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(rdv.date_heure).toLocaleTimeString('fr-FR')}</span>
                        </div>
                        {(rdv as any).users_profile && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {(rdv as any).users_profile.prenom} {(rdv as any).users_profile.nom}
                            </span>
                          </div>
                        )}
                        {rdv.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{rdv.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
