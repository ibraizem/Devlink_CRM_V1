'use client';

import { useState } from 'react';
import { Webhook } from '@/types/webhooks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Power, 
  TestTube, 
  Activity,
  ExternalLink 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface WebhookListProps {
  webhooks: Webhook[];
  loading: boolean;
  onEdit: (webhook: Webhook) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function WebhookList({ webhooks, loading, onEdit, onDelete, onRefresh }: WebhookListProps) {
  const router = useRouter();
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleToggleStatus = async (webhook: Webhook) => {
    try {
      const newStatus = webhook.status === 'active' ? 'inactive' : 'active';
      await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Webhook ${newStatus === 'active' ? 'activé' : 'désactivé'}`);
      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du webhook');
    }
  };

  const handleTest = async (webhookId: string) => {
    setTestingId(webhookId);
    try {
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success('Test réussi : ' + result.message);
      } else {
        toast.error('Test échoué : ' + (result.error || result.message));
      }
    } catch (error) {
      toast.error('Erreur lors du test du webhook');
    } finally {
      setTestingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'failed':
        return <Badge variant="destructive">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (webhooks.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Activity className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Aucun webhook configuré
          </h3>
          <p className="text-slate-600 mb-4">
            Créez votre premier webhook pour recevoir des notifications en temps réel
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <Card key={webhook.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {webhook.name}
                  </h3>
                  {getStatusBadge(webhook.status)}
                </div>
                
                {webhook.description && (
                  <p className="text-slate-600 text-sm mb-3">{webhook.description}</p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                  <ExternalLink className="h-4 w-4" />
                  <span className="font-mono">{webhook.url}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="outline" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>

                {webhook.last_triggered_at && (
                  <p className="text-xs text-slate-400 mt-3">
                    Dernier déclenchement :{' '}
                    {new Date(webhook.last_triggered_at).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(webhook)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleStatus(webhook)}>
                    <Power className="mr-2 h-4 w-4" />
                    {webhook.status === 'active' ? 'Désactiver' : 'Activer'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleTest(webhook.id)}
                    disabled={testingId === webhook.id}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    {testingId === webhook.id ? 'Test en cours...' : 'Tester'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push(`/webhooks/${webhook.id}/deliveries`)}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Voir les livraisons
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(webhook.id)}
                    className="text-red-600"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
