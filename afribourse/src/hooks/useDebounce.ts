// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Hook pour debounce (retarder l'exécution)
 * Utile pour les champs de recherche
 * @param value - La valeur à debouncer
 * @param delay - Délai en millisecondes (défaut: 500ms)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur après le délai
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}