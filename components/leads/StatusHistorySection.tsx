'use client';

import { useEffect, useState } from 'react';
import { Activity, getStatusHistory } from '@/lib/types/leads';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StatusHistorySectionProps {
  leadId: string;
}

const statusConfig = {
  nouveau: { label: 'Nouveau', color: 'bg-blue-500' },
  en_cours: { label: 'En cours', color: 'bg-yellow-500' },
  traite: { label: 'Traité', color: 'bg-green-500' },
  abandonne: { label: 'Abandonné', color: 'bg-red-500' },
};

export function StatusHistorySection({ leadId }: StatusHistorySectionProps) {
  const [history, setHistory] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [leadId]);

  const loadHistory = async () => {
    setLoading(true);
    const { data } = await getStatusHistory(leadId);
    if (data) setHistory(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-500">Aucun historique de statut</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => {
        const oldStatus = item.metadata?.old_statut;
        const newStatus = item.metadata?.new_statut;
        const oldConfig = oldStatus ? statusConfig[oldStatus as keyof typeof statusConfig] : null;
        const newConfig = newStatus ? statusConfig[newStatus as keyof typeof statusConfig] : null;

        return (
          <div key={item.id} className="flex gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              {index < history.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 -mb-4" />
              )}
            </div>

            <Card className="flex-1">
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{item.description}</p>
                    {item.users_profile && (
                      <p className="text-xs text-slate-500">
                        Par {item.users_profile.nom} {item.users_profile.prenom}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {format(new Date(item.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>

                {oldConfig && newConfig && (
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${oldConfig.color}`} />
                      <span className="text-sm">{oldConfig.label}</span>
                    </div>
                    <span className="text-slate-400">→</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${newConfig.color}`} />
                      <span className="text-sm font-medium">{newConfig.label}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
