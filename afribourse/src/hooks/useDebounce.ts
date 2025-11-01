import { useState, useEffect } from 'react';

/**
 * Hook pour debouncer une valeur
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (par défaut 500ms)
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si value change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // <-- Re-exécuter si value ou delay change

  return debouncedValue;
}