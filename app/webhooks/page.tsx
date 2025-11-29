'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WebhookList } from '@/components/webhooks/WebhookList';
import { WebhookDialog } from '@/components/webhooks/WebhookDialog';
import { Webhook } from '@/types/webhooks';

export default function WebhooksPage() {
  const router = useRouter();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | undefined>();

  useEffect(() => {
    const supabase = createClient();
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
      }
    };
    checkAuth();
    loadWebhooks();
  }, [router]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/webhooks');
      const result = await response.json();
      setWebhooks(result.data || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedWebhook(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setDialogOpen(false);
    await loadWebhooks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce webhook ?')) return;
    
    try {
      await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      await loadWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Webhooks</h1>
              <p className="text-slate-600 mt-2">
                Gérez vos intégrations webhook pour les notifications en temps réel
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Webhook
            </Button>
          </div>

          <WebhookList
            webhooks={webhooks}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={loadWebhooks}
          />

          <WebhookDialog
            open={dialogOpen}
            webhook={selectedWebhook}
            onClose={() => setDialogOpen(false)}
            onSave={handleSave}
          />
        </div>
      </main>
    </div>
  );
}
