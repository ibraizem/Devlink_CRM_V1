'use client';

import { useCampaignProgress } from '@/hooks/useCampaigns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mail, MessageSquare, Phone, CheckCircle, Clock } from 'lucide-react';

interface CampaignProgressProps {
  campaignId: string;
}

export function CampaignProgress({ campaignId }: CampaignProgressProps) {
  const { data: progress, isLoading } = useCampaignProgress(campaignId);

  if (isLoading || !progress) {
    return <div>Chargement...</div>;
  }

  const completionRate = progress.total_leads > 0
    ? Math.round((progress.completed / progress.total_leads) * 100)
    : 0;

  const emailOpenRate = progress.emails_sent > 0
    ? Math.round((progress.emails_opened / progress.emails_sent) * 100)
    : 0;

  const emailClickRate = progress.emails_opened > 0
    ? Math.round((progress.emails_clicked / progress.emails_opened) * 100)
    : 0;

  const stats = [
    {
      title: 'Leads Actifs',
      value: progress.active,
      total: progress.total_leads,
      icon: Clock,
      color: 'text-blue-600',
    },
    {
      title: 'Leads Complétés',
      value: progress.completed,
      total: progress.total_leads,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Emails Envoyés',
      value: progress.emails_sent,
      subtext: `${emailOpenRate}% ouverture`,
      icon: Mail,
      color: 'text-purple-600',
    },
    {
      title: 'SMS Envoyés',
      value: progress.sms_sent,
      subtext: `${progress.sms_replied} réponses`,
      icon: MessageSquare,
      color: 'text-orange-600',
    },
    {
      title: 'Appels Complétés',
      value: progress.calls_completed,
      icon: Phone,
      color: 'text-teal-600',
    },
    {
      title: 'Tâches en Attente',
      value: progress.tasks_pending,
      subtext: `${progress.tasks_completed} complétées`,
      icon: Clock,
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Progression de la Campagne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Taux de Complétion</span>
              <span className="text-sm text-muted-foreground">{completionRate}%</span>
            </div>
            <Progress value={completionRate} />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{progress.enrolled}</div>
              <div className="text-xs text-muted-foreground">Inscrits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{progress.active}</div>
              <div className="text-xs text-muted-foreground">Actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{progress.completed}</div>
              <div className="text-xs text-muted-foreground">Terminés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    {stat.subtext && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.subtext}
                      </p>
                    )}
                    {stat.total && (
                      <p className="text-xs text-muted-foreground mt-1">
                        sur {stat.total}
                      </p>
                    )}
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Taux d&apos;Ouverture</span>
              <span className="text-sm text-muted-foreground">{emailOpenRate}%</span>
            </div>
            <Progress value={emailOpenRate} />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Taux de Clic</span>
              <span className="text-sm text-muted-foreground">{emailClickRate}%</span>
            </div>
            <Progress value={emailClickRate} />
          </div>

          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold">{progress.emails_sent}</div>
              <div className="text-xs text-muted-foreground">Envoyés</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{progress.emails_opened}</div>
              <div className="text-xs text-muted-foreground">Ouverts</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{progress.emails_clicked}</div>
              <div className="text-xs text-muted-foreground">Cliqués</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{progress.emails_replied}</div>
              <div className="text-xs text-muted-foreground">Réponses</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score Moyen des Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold">{progress.avg_score.toFixed(1)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Score moyen d&apos;engagement
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
