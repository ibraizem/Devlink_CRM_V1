'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkflowExecution } from '@/lib/types/workflow';
import { getWorkflowExecutions } from '@/lib/services/workflow-service';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface WorkflowExecutionHistoryProps {
  workflowId: string;
}

export default function WorkflowExecutionHistory({ workflowId }: WorkflowExecutionHistoryProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutions();
    const interval = setInterval(loadExecutions, 5000);
    return () => clearInterval(interval);
  }, [workflowId]);

  const loadExecutions = async () => {
    const data = await getWorkflowExecutions(workflowId);
    setExecutions(data);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center">
        <Clock className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="font-semibold mb-2">No executions yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Run this workflow to see execution history
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {executions.map((execution) => (
          <Card key={execution.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(execution.status)}
                  <Badge className={getStatusColor(execution.status)} variant="secondary">
                    {execution.status}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(execution.started_at), 'MMM d, HH:mm')}
                </span>
              </div>

              {execution.error && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded mb-2">
                  {execution.error}
                </div>
              )}

              <div className="space-y-2">
                {execution.execution_log.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${
                      log.status === 'success' ? 'bg-green-500' :
                      log.status === 'failed' ? 'bg-red-500' :
                      log.status === 'running' ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`} />
                    <span className="text-gray-600 dark:text-gray-400 truncate">
                      {log.node_id}
                    </span>
                  </div>
                ))}
                {execution.execution_log.length > 3 && (
                  <div className="text-xs text-gray-500 pl-4">
                    +{execution.execution_log.length - 3} more steps
                  </div>
                )}
              </div>

              {execution.completed_at && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  Duration: {Math.round(
                    (new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000
                  )}s
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
