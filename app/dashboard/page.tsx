'use client';

import { useEffect, useState } from 'react';
import  Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, TrendingUp, Phone } from 'lucide-react';
import { createClient } from '@/lib/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    nouveauxLeads: 0,
    rdvPlanifies: 0,
    recrutes: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    type Lead = { statut: string };
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: leads } = await supabase.from('leads').select('statut');

      if (leads) {
        setStats({
          totalLeads: leads.length,
          nouveauxLeads: (leads as Lead[]).filter((l: Lead) => l.statut === 'nouveau').length,
          rdvPlanifies: (leads as Lead[]).filter((l: Lead) => l.statut === 'rdv_planifie').length,
          recrutes: (leads as Lead[]).filter((l: Lead) => l.statut === 'recrute').length,
        });
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-2">
              Vue d&apos;ensemble de votre activité de téléprospection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLeads}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nouveaux Leads</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.nouveauxLeads}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RDV Planifiés</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rdvPlanifies}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recrutés</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recrutes}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Consultez vos leads pour commencer la prospection
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
