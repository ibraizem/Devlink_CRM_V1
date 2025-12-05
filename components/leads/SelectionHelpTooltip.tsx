'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SelectionHelpTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Sélection multiple :</p>
            <ul className="space-y-1 text-xs">
              <li>• <kbd className="px-1 py-0.5 bg-muted rounded">Click</kbd> - Sélectionner/désélectionner</li>
              <li>• <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Click</kbd> - Sélection multiple</li>
              <li>• <kbd className="px-1 py-0.5 bg-muted rounded">Shift+Click</kbd> - Sélection en plage</li>
              <li>• Case en-tête - Tout sélectionner (page)</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
