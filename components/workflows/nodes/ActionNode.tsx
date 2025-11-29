'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { Mail, CheckSquare, UserPlus, Bell, Globe, Timer, Calendar } from 'lucide-react';
import { cn } from '@/lib/types/utils';

export default function ActionNode({ data, selected }: NodeProps) {
  const getActionIcon = () => {
    const type = data.actionConfig?.type;
    switch (type) {
      case 'send_email':
        return <Mail className="h-5 w-5" />;
      case 'create_task':
        return <CheckSquare className="h-5 w-5" />;
      case 'update_lead':
      case 'create_lead':
        return <UserPlus className="h-5 w-5" />;
      case 'send_notification':
        return <Bell className="h-5 w-5" />;
      case 'http_request':
        return <Globe className="h-5 w-5" />;
      case 'delay':
        return <Timer className="h-5 w-5" />;
      case 'create_rendezvous':
        return <Calendar className="h-5 w-5" />;
      default:
        return <CheckSquare className="h-5 w-5" />;
    }
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-white dark:bg-gray-800 shadow-lg min-w-[200px]',
        selected ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-green-500" />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400">
          {getActionIcon()}
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Action
          </div>
          <div className="font-semibold text-sm">{data.label}</div>
        </div>
      </div>
      {data.description && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {data.description}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
    </div>
  );
}
