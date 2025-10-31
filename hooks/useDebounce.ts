import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour implémenter un délai (debounce) sur une valeur
 * @param value La valeur à débouncer
 * @param delay Le délai en millisecondes avant de mettre à jour la valeur
 * @returns La valeur débouncée
 */
function useDebounce<T>(value: T, delay: number): T {
  // État pour stocker la valeur débouncée
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Mettre à jour la valeur débouncée après le délai spécifié
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Annuler le timeout si la valeur ou le délai change (nettoyage)
    // Cela évite de mettre à jour la valeur débouncée si la valeur est modifiée dans le délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Ne se réexécute que si la valeur ou le délai change

  return debouncedValue;
}

export default useDebounce;
