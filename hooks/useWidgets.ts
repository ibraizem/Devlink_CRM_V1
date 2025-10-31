import { useState, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
 
export const useWidgets = (initialWidgets: string[]) => {
  const [widgets, setWidgets] = useState<string[]>(initialWidgets);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Initialisation du composant
  const initialize = useCallback(() => {
    setMounted(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Gestion du glisser-déposer
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  // Fonction utilitaire pour réorganiser les widgets
  const reorderWidgets = useCallback((newOrder: string[]) => {
    setWidgets(newOrder);
  }, []);

  return {
    widgets,
    isLoading,
    mounted,
    initialize,
    handleDragEnd,
    reorderWidgets,
  };
};

// Fonction utilitaire pour déplacer les éléments dans un tableau
function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const [movedItem] = newArray.splice(from, 1);
  newArray.splice(to, 0, movedItem);
  return newArray;
}
