'use client';

import { WebhookStats as Stats } from '@/types/webhooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';

interface WebhookStatsProps {
  stats: Stats;
}

export function WebhookStats({ stats }: WebhookStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total des livraisons</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_deliveries}</div>
          <p className="text-xs text-muted-foreground">
            Toutes les tentatives de livraison
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Succès</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.successful_deliveries}
          </div>
          <p className="text-xs text-muted-foreground">
            Livraisons réussies
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Échecs</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.failed_deliveries}
          </div>
          <p className="text-xs text-muted-foreground">
            Livraisons échouées
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.success_rate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.pending_deliveries} en attente
          </p>
        </CardContent>
      </Card>
    </div>
  );
}