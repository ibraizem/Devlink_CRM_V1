// components/crm/LeadStatusBadge.tsx
'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/types/utils';
import { LeadStatus } from '@/hooks/useCrmData2';

type StatusKey = LeadStatus | 'a_relancer';

interface LeadStatusBadgeProps {
  status: StatusKey;
  onStatusChange: (newStatus: LeadStatus) => void;
  className?: string;
}

const statusConfig = {
  nouveau: { label: 'Nouveau', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  en_cours: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  traite: { label: 'Traité', color: 'bg-green-100 text-green-800 border-green-200' },
  abandonne: { label: 'Abandonné', color: 'bg-red-100 text-red-800 border-red-200' },
  a_relancer: { label: 'À relancer', color: 'bg-purple-100 text-purple-800 border-purple-200' },
} as const;

export function LeadStatusBadge({ 
  status, 
  onStatusChange, 
  className 
}: LeadStatusBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const config = status in statusConfig 
    ? statusConfig[status as keyof typeof statusConfig]
    : { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };

  if (isEditing) {
    return (
      <Select
        value={status}
        onValueChange={(value: string) => {
          if (value === 'a_relancer') {
            onStatusChange('en_cours');
          } else {
            onStatusChange(value as LeadStatus);
          }
          setIsEditing(false);
        }}
        onOpenChange={(open: any) => !open && setIsEditing(false)}
      >
        <SelectTrigger className={cn('w-32 h-6', className)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(statusConfig).map(([value, config]) => (
            <SelectItem key={value} value={value}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'cursor-pointer hover:opacity-80 transition-opacity text-xs',
        config.color,
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      {config.label}
    </Badge>
  );
}