'use client';

import { useCampaigns, useStartCampaign, usePauseCampaign } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, BarChart } from 'lucide-react';
import type { Campaign } from '@/types/campaign';

export function CampaignList() {
  const { data: campaigns, isLoading } = useCampaigns();
  const startMutation = useStartCampaign();
  const pauseMutation = usePauseCampaign();

  const handleStart = async (campaignId: string) => {
    try {
      await startMutation.mutateAsync(campaignId);
    } catch (error) {
      console.error('Failed to start campaign:', error);
    }
  };

  const handlePause = async (campaignId: string) => {
    try {
      await pauseMutation.mutateAsync(campaignId);
    } catch (error) {
      console.error('Failed to pause campaign:', error);
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
    const variants: Record<Campaign['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'outline', label: 'Brouillon' },
      scheduled: { variant: 'secondary', label: 'Planifiée' },
      active: { variant: 'default', label: 'Active' },
      paused: { variant: 'secondary', label: 'Pause' },
      completed: { variant: 'outline', label: 'Terminée' },
      archived: { variant: 'outline', label: 'Archivée' },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {campaigns?.map((campaign) => (
        <div
          key={campaign.id}
          className="border rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{campaign.name}</h3>
              {getStatusBadge(campaign.status)}
            </div>
            {campaign.description && (
              <p className="text-sm text-muted-foreground">{campaign.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <BarChart className="h-4 w-4 mr-2" />
              Statistiques
            </Button>

            {campaign.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => handleStart(campaign.id)}
                disabled={startMutation.isPending}
              >
                <Play className="h-4 w-4 mr-2" />
                Démarrer
              </Button>
            )}

            {campaign.status === 'active' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePause(campaign.id)}
                disabled={pauseMutation.isPending}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
