'use client';

import { useCampaignTasks, useUpdateTask } from '@/hooks/useCampaigns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Phone, MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CampaignTask } from '@/types/campaign';

interface CampaignTasksProps {
  campaignId: string;
  assignedTo?: string;
}

export function CampaignTasks({ campaignId, assignedTo }: CampaignTasksProps) {
  const { data: tasks, isLoading } = useCampaignTasks(campaignId, {
    status: 'pending',
    assigned_to: assignedTo,
  });
  const updateMutation = useUpdateTask();

  const handleCompleteTask = async (taskId: string) => {
    try {
      await updateMutation.mutateAsync({
        id: taskId,
        updates: {
          status: 'completed',
          completed_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const getTaskIcon = (type: CampaignTask['task_type']) => {
    const icons = {
      call: Phone,
      follow_up: MessageSquare,
      meeting: Calendar,
      other: Clock,
    };
    return icons[type];
  };

  const getPriorityBadge = (priority: CampaignTask['priority']) => {
    const variants: Record<CampaignTask['priority'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      low: { variant: 'outline', label: 'Basse' },
      medium: { variant: 'secondary', label: 'Moyenne' },
      high: { variant: 'default', label: 'Haute' },
      urgent: { variant: 'destructive', label: 'Urgente' },
    };

    const config = variants[priority];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucune tâche en attente
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const Icon = getTaskIcon(task.task_type);
        const overdue = isOverdue(task.due_date);

        return (
          <div
            key={task.id}
            className={`border rounded-lg p-4 ${overdue ? 'border-red-300 bg-red-50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className={`mt-1 ${overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {getPriorityBadge(task.priority)}
                    {overdue && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        En retard
                      </Badge>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(task.due_date), 'PPp', { locale: fr })}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleCompleteTask(task.id)}
                disabled={updateMutation.isPending}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Terminer
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
