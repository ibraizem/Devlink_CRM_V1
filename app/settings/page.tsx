'use client';

import { useEffect } from 'react';
import  Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
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
            <h1 className="text-3xl font-bold text-slate-900">Paramètres</h1>
            <p className="text-slate-600 mt-2">
              Configurez votre compte et vos préférences
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Intégrations API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Onoff Business</h3>
                <p className="text-sm text-muted-foreground">
                  Configurez votre clé API Onoff pour activer les appels et SMS.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Calendly</h3>
                <p className="text-sm text-muted-foreground">
                  Connectez votre compte Calendly pour la gestion des rendez-vous.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Outlook / Microsoft Graph</h3>
                <p className="text-sm text-muted-foreground">
                  Connectez votre compte Microsoft pour l&apos;envoi d&apos;emails.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
