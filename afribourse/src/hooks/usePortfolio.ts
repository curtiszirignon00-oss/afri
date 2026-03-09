// src/hooks/usePortfolio.ts
import { useState, useEffect, useCallback } from 'react';
import { Portfolio, Position, PortfolioHistoryPoint, Stock } from '../types';
import toast from 'react-hot-toast';
import { apiFetch } from './useApi';

interface UsePortfolioReturn {
  portfolio: Portfolio | null;
  stocksData: { [key: string]: Stock };
  portfolioHistory: PortfolioHistoryPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPortfolio: () => Promise<void>;
  calculateTotalValue: () => number;
}

interface UsePortfolioParams {
  walletType?: 'SANDBOX' | 'CONCOURS';
}

/**
 * Hook pour gérer le portfolio de l'utilisateur
 */
export function usePortfolio(params?: UsePortfolioParams): UsePortfolioReturn {
  const walletType = params?.walletType || 'SANDBOX';

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stocksData, setStocksData] = useState<{ [key: string]: Stock }>({});
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger le portfolio
  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Réinitialiser le portfolio et l'historique pour éviter d'afficher les anciennes données
    setPortfolio(null);
    setPortfolioHistory([]);

    try {
      const [portfolioData, historyData, allStocks] = await Promise.all([
        apiFetch<Portfolio>(`/portfolios/my?wallet_type=${walletType}`).catch(err => {
          const msg = err.message?.toLowerCase() || '';
          if (msg.includes('404') || msg.includes('non trouvé') || msg.includes('not found')) {
            return null;
          }
          if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('non autorisé')) {
            throw new Error("Non authentifié");
          }
          throw err;
        }),
        apiFetch<PortfolioHistoryPoint[]>(`/portfolios/my/history?wallet_type=${walletType}`).catch(() => []),
        apiFetch<Stock[]>('/stocks').catch(() => []),
      ]);

      // Créer le map des stocks immédiatement
      if (allStocks && allStocks.length > 0) {
        const stockDataMap = allStocks.reduce((acc, stock) => {
          acc[stock.symbol] = stock;
          return acc;
        }, {} as { [key: string]: Stock });
        setStocksData(stockDataMap);
      }

      setPortfolio(portfolioData ?? null);

      // Gérer l'historique - toujours mettre à jour, même si vide
      if (historyData && historyData.length > 0) {
        historyData.sort((a, b) => a.date.localeCompare(b.date));
        setPortfolioHistory(historyData);
      } else {
        setPortfolioHistory([]);
      }

    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [walletType]);

  // Créer un portfolio
  const createPortfolio = useCallback(async () => {
    const toastId = toast.loading('Création du portfolio...');

    try {
      await apiFetch('/portfolios/my', {
        method: 'POST',
        body: JSON.stringify({ wallet_type: walletType })
      });

      toast.success('Portfolio créé !', { id: toastId });
      await loadPortfolio();
    } catch (err: any) {
      toast.error(`Erreur : ${err.message}`, { id: toastId });
      throw err;
    }
  }, [loadPortfolio, walletType]);

  // Calculer la valeur totale du portfolio
  const calculateTotalValue = useCallback((): number => {
    if (!portfolio) return 0;

    const stocksValue = portfolio.positions.reduce((acc, pos) => {
      const stock = stocksData[pos.stock_ticker];
      return stock ? acc + (pos.quantity * stock.current_price) : acc;
    }, 0);

    return portfolio.cash_balance + stocksValue;
  }, [portfolio, stocksData]);

  // Charger au montage et quand walletType change
  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  return {
    portfolio,
    stocksData,
    portfolioHistory,
    loading,
    error,
    refetch: loadPortfolio,
    createPortfolio,
    calculateTotalValue
  };
}