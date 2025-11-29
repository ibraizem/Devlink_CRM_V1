'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { WebhookDeliveriesList } from '@/components/webhooks/WebhookDeliveriesList';
import { WebhookStats } from '@/components/webhooks/WebhookStats';
import { Webhook, WebhookDelivery, WebhookStats as Stats } from '@/types/webhooks';

export default function WebhookDeliveriesPage() {
  const router = useRouter();
  const params = useParams();
  const webhookId = params.id as string;
  
  const [webhook, setWebhook] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
      }
    };
    checkAuth();
    loadData();
  }, [router, webhookId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [webhookRes, deliveriesRes] = await Promise.all([
        fetch(`/api/webhooks/${webhookId}`),
        fetch(`/api/webhooks/${webhookId}/deliveries`),
      ]);

      const webhookData = await webhookRes.json();
      const deliveriesData = await deliveriesRes.json();

      setWebhook(webhookData.data);
      setDeliveries(deliveriesData.data || []);

      const deliveriesArray = deliveriesData.data || [];
      const calculatedStats = deliveriesArray.reduce(
        (acc: Stats, delivery: WebhookDelivery) => {
          acc.total_deliveries++;
          if (delivery.status === 'success') acc.successful_deliveries++;
          if (delivery.status === 'failed') acc.failed_deliveries++;
          if (delivery.status === 'pending' || delivery.status === 'retrying') acc.pending_deliveries++;
          return acc;
        },
        {
          total_deliveries: 0,
          successful_deliveries: 0,
          failed_deliveries: 0,
          pending_deliveries: 0,
          success_rate: 0,
        }
      );

      calculatedStats.success_rate = calculatedStats.total_deliveries > 0
        ? (calculatedStats.successful_deliveries / calculatedStats.total_deliveries) * 100
        : 0;

      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/webhooks')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux webhooks
            </Button>
            
            <h1 className="text-3xl font-bold text-slate-900">
              {webhook?.name || 'Webhook'}
            </h1>
            <p className="text-slate-600 mt-2">
              Historique des livraisons et statistiques
            </p>
          </div>

          {stats && <WebhookStats stats={stats} />}

          <div className="mt-8">
            <WebhookDeliveriesList
              deliveries={deliveries}
              loading={loading}
              onRefresh={loadData}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
