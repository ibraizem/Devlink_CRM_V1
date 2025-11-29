'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, Webhook, Clock, Database } from 'lucide-react';
import { cn } from '@/lib/types/utils';

export default function TriggerNode({ data, selected }: NodeProps) {
  const getTriggerIcon = () => {
    const type = data.triggerConfig?.type;
    switch (type) {
      case 'webhook':
        return <Webhook className="h-5 w-5" />;
      case 'schedule':
        return <Clock className="h-5 w-5" />;
      case 'database_event':
        return <Database className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-white dark:bg-gray-800 shadow-lg min-w-[200px]',
        selected ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
          {getTriggerIcon()}
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Trigger
          </div>
          <div className="font-semibold text-sm">{data.label}</div>
        </div>
      </div>
      {data.description && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {data.description}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </div>
  );
}
