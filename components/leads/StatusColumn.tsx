'use client';

import React, { useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { 
  Clock, 
  CircleSlash, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  PhoneOff, 
  RotateCcw, 
  Bell, 
  BellRing, 
  PhoneCall, 
  Target, 
  ThumbsDown,
  AlertCircle,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { StatusBadge, statusVariants } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type StatusColumnProps = {
  value: string;
  onChange: (value: string) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
};

export const statusOptions = [
  'En attente',
  'Aucun statut',
  'RDV Planifié',
  'RDV OK',
  'RDV KO',
  'Recruté',
  'Ne répond pas',
  'À relanifier',
  'Relance',
  'Rappel personnel',
  'Injoignable permanent',
  'Hors cible',
  'Pas intéressé',
  'Refus MDP'
] as const;

export const statusGroups = {
  'Nouveaux': ['En attente', 'Aucun statut'],
  'En cours': ['RDV Planifié', 'Relance', 'Rappel personnel'],
  'Terminé': ['RDV OK', 'RDV KO', 'Recruté'],
  'À suivre': ['Ne répond pas', 'À relanifier'],
  'Non qualifiés': ['Injoignable permanent', 'Hors cible', 'Pas intéressé', 'Refus MDP']
};

export type StatusType = typeof statusOptions[number];

const statusIcons: Record<StatusType, React.ReactNode> = {
  'En attente': <Clock className="w-4 h-4" />,
  'Aucun statut': <CircleSlash className="w-4 h-4" />,
  'RDV Planifié': <Calendar className="w-4 h-4" />,
  'RDV OK': <CheckCircle className="w-4 h-4" />,
  'RDV KO': <XCircle className="w-4 h-4" />,
  'Recruté': <UserCheck className="w-4 h-4" />,
  'Ne répond pas': <PhoneOff className="w-4 h-4" />,
  'À relanifier': <RotateCcw className="w-4 h-4" />,
  'Relance': <BellRing className="w-4 h-4" />,
  'Rappel personnel': <Bell className="w-4 h-4" />,
  'Injoignable permanent': <PhoneCall className="w-4 h-4" />,
  'Hors cible': <Target className="w-4 h-4" />,
  'Pas intéressé': <ThumbsDown className="w-4 h-4" />,
  'Refus MDP': <AlertCircle className="w-4 h-4" />
};

const statusVariantsMap: Record<StatusType, string> = {
  'En attente': 'warning',
  'Aucun statut': 'default',
  'RDV Planifié': 'info',
  'RDV OK': 'success',
  'RDV KO': 'error',
  'Recruté': 'success',
  'Ne répond pas': 'warning',
  'À relanifier': 'warning',
  'Relance': 'info',
  'Rappel personnel': 'info',
  'Injoignable permanent': 'default',
  'Hors cible': 'warning',
  'Pas intéressé': 'error',
  'Refus MDP': 'error'
};

const statusDescriptions: Record<StatusType, string> = {
  'En attente': 'Le lead est en attente de traitement',
  'Aucun statut': 'Aucun statut défini pour ce lead',
  'RDV Planifié': 'Un rendez-vous a été planifié avec ce lead',
  'RDV OK': 'Le rendez-vous s\'est bien déroulé',
  'RDV KO': 'Le rendez-vous n\'a pas abouti',
  'Recruté': 'Le lead a été recruté avec succès',
  'Ne répond pas': 'Le lead ne répond pas aux appels',
  'À relanifier': 'Le lead doit être relancé ultérieurement',
  'Relance': 'Une relance est prévue pour ce lead',
  'Rappel personnel': 'Un rappel a été programmé',
  'Injoignable permanent': 'Le lead est injoignable de manière permanente',
  'Hors cible': 'Le lead ne correspond pas à la cible',
  'Pas intéressé': 'Le lead n\'est pas intéressé',
  'Refus MDP': 'Le lead a refusé la proposition'
};

export function StatusColumn({ 
  value, 
  onChange, 
  disabled = false, 
  className,
  label,
  showLabel = false,
  size = 'default',
  variant = 'solid'
}: StatusColumnProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedValue = statusOptions.includes(value as StatusType) ? value : 'Aucun statut';
  const currentVariant = statusVariantsMap[selectedValue as StatusType] as any;
  const currentDescription = statusDescriptions[selectedValue as StatusType];

  const handleChange = useCallback(async (newValue: string) => {
    if (!statusOptions.includes(newValue as StatusType)) {
      setError('Statut invalide');
      return;
    }
    
    setError(null);
    setIsUpdating(true);
    
    try {
      await onChange(newValue);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  }, [onChange]);

  const StatusItem = useCallback(({ status }: { status: StatusType }) => (
    <div className="flex items-center gap-2">
      <StatusBadge 
        variant={statusVariantsMap[status] as any}
        size={size}
        className="pointer-events-none"
      >
        {status}
      </StatusBadge>
    </div>
  ), [size]);

  return (
    <TooltipProvider>
      <div className={cn('flex flex-col gap-1', className)}>
        {showLabel && label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select 
                value={selectedValue}
                onValueChange={handleChange}
                disabled={disabled || isUpdating}
                onOpenChange={setIsOpen}
              >
                <SelectTrigger 
                  className={cn(
                    'w-full transition-all',
                    isOpen && 'ring-2 ring-blue-500',
                    error && 'ring-1 ring-red-500',
                    isUpdating && 'opacity-70',
                    'flex items-center justify-between',
                    'hover:bg-gray-50',
                    'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'border-0 shadow-sm',
                    size === 'sm' ? 'h-8' : size === 'lg' ? 'h-10' : 'h-9'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isUpdating ? (
                      <>
                        <Loader2 className={cn(
                          'animate-spin',
                          size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
                        )} />
                        <span className="text-sm">Chargement...</span>
                      </>
                    ) : (
                      <StatusItem status={selectedValue as StatusType} />
                    )}
                    <ChevronDown className={cn(
                      'ml-auto h-4 w-4 text-gray-400',
                      isOpen && 'transform rotate-180',
                      'transition-transform duration-200'
                    )} />
                  </div>
                </SelectTrigger>
                <SelectContent className="min-w-[200px]">
                  {Object.entries(statusGroups).map(([group, groupStatuses]) => (
                    <div key={group} className="py-1">
                      <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {group}
                      </div>
                      {groupStatuses.map((status) => (
                        <SelectItem 
                          key={status} 
                          value={status}
                          className={cn(
                            'flex items-center gap-2',
                            'focus:bg-gray-50',
                            'cursor-pointer',
                            'transition-colors',
                            'py-2'
                          )}
                        >
                          <StatusItem status={status as StatusType} />
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          {currentDescription && (
            <TooltipContent side="top" className="max-w-[250px] text-sm">
              <p>{currentDescription}</p>
              {error && <p className="mt-1 text-red-500 text-xs">{error}</p>}
            </TooltipContent>
          )}
        </Tooltip>
        
        {error && !isOpen && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
      </div>
    </TooltipProvider>
  );
}
