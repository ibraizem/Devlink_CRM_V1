'use client';

import { useEffect, useState } from 'react';
import { Activity, getLeadHistory } from '@/lib/types/leads';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Phone, Mail, MessageSquare, FileText, 
  UserCheck, Calendar, TrendingUp, MessageCircle 
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityTimelineProps {
  leadId: string;
}

const activityIcons = {
  note: FileText,
  statut_change: TrendingUp,
  lead_assigne: UserCheck,
  appel: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  rendezvous: Calendar,
};

const activityColors = {
  note: 'bg-blue-500',
  statut_change: 'bg-green-500',
  lead_assigne: 'bg-purple-500',
  appel: 'bg-orange-500',
  email: 'bg-red-500',
  whatsapp: 'bg-green-600',
  sms: 'bg-blue-600',
  rendezvous: 'bg-yellow-500',
};

export function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [leadId]);

  const loadActivities = async () => {
    setLoading(true);
    const { data } = await getLeadHistory(leadId);
    if (data) setActivities(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-500">Aucune activité enregistrée</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.type_action] || FileText;
        const color = activityColors[activity.type_action] || 'bg-gray-500';

        return (
          <div key={activity.id} className="flex gap-4">
            <div className="relative">
              <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              {index < activities.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 -mb-4" />
              )}
            </div>

            <Card className="flex-1">
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{activity.description}</p>
                    {activity.users_profile && (
                      <p className="text-xs text-slate-500">
                        Par {activity.users_profile.nom} {activity.users_profile.prenom}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {format(new Date(activity.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>

                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs">
                    {activity.type_action === 'statut_change' && activity.metadata.old_statut && (
                      <p>
                        <span className="text-slate-500">Ancien statut:</span>{' '}
                        <span className="font-medium">{activity.metadata.old_statut}</span>
                        {' → '}
                        <span className="font-medium">{activity.metadata.new_statut}</span>
                      </p>
                    )}
                    {activity.type_action === 'appel' && (
                      <>
                        {activity.metadata.duree && (
                          <p>
                            <span className="text-slate-500">Durée:</span>{' '}
                            {activity.metadata.duree}
                          </p>
                        )}
                        {activity.metadata.notes && (
                          <p className="mt-1">{activity.metadata.notes}</p>
                        )}
                      </>
                    )}
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
