// src/hooks/useStocks.ts
import { useState, useEffect, useCallback } from 'react';
import { Stock } from '../types';
import { useDebounce } from './useDebounce';

const API_BASE_URL = 'http://localhost:3000/api';

interface UseStocksOptions {
  searchTerm?: string;
  sector?: string;
  sortBy?: 'name' | 'change' | 'price' | 'volume';
}

interface UseStocksReturn {
  stocks: Stock[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook pour charger et filtrer les actions
 */
export function useStocks(options: UseStocksOptions = {}): UseStocksReturn {
  const { searchTerm = '', sector = 'all', sortBy = 'name' } = options;
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce la recherche pour éviter trop d'appels API
  const debouncedSearch = useDebounce(searchTerm, 300);

  const loadStocks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (sector !== 'all') params.append('sector', sector);
      params.append('sort', sortBy);

      const response = await fetch(`${API_BASE_URL}/stocks?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: Impossible de charger les actions`);
      }

      const data: Stock[] = await response.json();
      setStocks(data || []);

    } catch (err: any) {
      console.error('Erreur chargement actions:', err);
      setError(err.message || "Erreur lors du chargement");
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sector, sortBy]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  return {
    stocks,
    loading,
    error,
    refetch: loadStocks
  };
}