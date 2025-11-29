'use client';

import { useState } from 'react';
import { Node } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Mail, CheckSquare, UserPlus, Bell, Globe, Timer, GitBranch, Calendar, Webhook, Clock, Database } from 'lucide-react';

interface NodeToolbarProps {
  onAddNode: (node: Node) => void;
}

const triggerTypes = [
  { type: 'webhook', label: 'Webhook', icon: Webhook, description: 'Trigger via HTTP request' },
  { type: 'schedule', label: 'Schedule', icon: Clock, description: 'Run on a schedule' },
  { type: 'database_event', label: 'Database Event', icon: Database, description: 'Trigger on DB changes' },
  { type: 'manual', label: 'Manual', icon: Zap, description: 'Trigger manually' },
];

const actionTypes = [
  { type: 'send_email', label: 'Send Email', icon: Mail, description: 'Send an email' },
  { type: 'create_task', label: 'Create Task', icon: CheckSquare, description: 'Create a task' },
  { type: 'update_lead', label: 'Update Lead', icon: UserPlus, description: 'Update lead data' },
  { type: 'create_lead', label: 'Create Lead', icon: UserPlus, description: 'Create new lead' },
  { type: 'send_notification', label: 'Send Notification', icon: Bell, description: 'Send notification' },
  { type: 'http_request', label: 'HTTP Request', icon: Globe, description: 'Make API call' },
  { type: 'delay', label: 'Delay', icon: Timer, description: 'Wait for duration' },
  { type: 'create_rendezvous', label: 'Create Rendez-vous', icon: Calendar, description: 'Schedule meeting' },
];

export default function NodeToolbar({ onAddNode }: NodeToolbarProps) {
  const [expanded, setExpanded] = useState(false);

  const createNode = (type: string, nodeType: 'trigger' | 'action' | 'condition', label: string) => {
    const id = `${nodeType}_${Date.now()}`;
    const node: Node = {
      id,
      type: nodeType,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: {
        label,
        [nodeType === 'trigger' ? 'triggerConfig' : 'actionConfig']: {
          type,
          config: {},
        },
      },
    };
    onAddNode(node);
  };

  return (
    <Card className="w-64 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Add Node</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Triggers
              </h4>
              <div className="space-y-2">
                {triggerTypes.map((trigger) => (
                  <Button
                    key={trigger.type}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => createNode(trigger.type, 'trigger', trigger.label)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <trigger.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{trigger.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {trigger.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Actions
              </h4>
              <div className="space-y-2">
                {actionTypes.map((action) => (
                  <Button
                    key={action.type}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => createNode(action.type, 'action', action.label)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <action.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{action.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                Logic
              </h4>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => createNode('condition', 'condition', 'Condition')}
              >
                <div className="flex items-start gap-2 w-full">
                  <GitBranch className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Condition</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Branch based on condition
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
