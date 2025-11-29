'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/types/utils';

export default function ConditionNode({ data, selected }: NodeProps) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 bg-white dark:bg-gray-800 shadow-lg min-w-[200px]',
        selected ? 'border-purple-500' : 'border-gray-200 dark:border-gray-700'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-500" />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
          <GitBranch className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Condition
          </div>
          <div className="font-semibold text-sm">{data.label}</div>
        </div>
      </div>
      {data.description && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {data.description}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        id="success"
        className="!bg-green-500"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="failure"
        className="!bg-red-500"
        style={{ left: '70%' }}
      />
    </div>
  );
}
