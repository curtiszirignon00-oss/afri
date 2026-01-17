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

/**
 * Hook pour gérer le portfolio de l'utilisateur
 */
export function usePortfolio(): UsePortfolioReturn {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stocksData, setStocksData] = useState<{ [key: string]: Stock }>({});
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger le portfolio
  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 [PORTFOLIO] Loading portfolio data...');

      // ✅ OPTIMISATION: Charger TOUS les appels en parallèle
      const [portfolioData, historyData, allStocks] = await Promise.all([
        apiFetch<Portfolio>('/portfolios/my').catch(err => {
          console.warn('Portfolio fetch error:', err);
          if (err.message.includes('404')) return null; // Pas de portfolio
          if (err.message.includes('401') || err.message.includes('Unauthorized')) {
            throw new Error("Non authentifié");
          }
          throw err;
        }),
        apiFetch<PortfolioHistoryPoint[]>('/portfolios/my/history').catch(err => {
          console.warn('History fetch error:', err);
          return [];
        }),
        // ✅ Charger les stocks en parallèle avec le portfolio
        apiFetch<Stock[]>('/stocks').catch(err => {
          console.warn('Stocks fetch error:', err);
          return [];
        })
      ]);

      console.log('✅ [PORTFOLIO] All data loaded in parallel');

      // Créer le map des stocks immédiatement
      if (allStocks && allStocks.length > 0) {
        const stockDataMap = allStocks.reduce((acc, stock) => {
          acc[stock.symbol] = stock;
          return acc;
        }, {} as { [key: string]: Stock });
        setStocksData(stockDataMap);
      }

      if (portfolioData) {
        setPortfolio(portfolioData);
      } else {
        setPortfolio(null);
        console.log('ℹ️ [PORTFOLIO] No portfolio found');
      }

      // Gérer l'historique
      if (historyData && historyData.length > 0) {
        historyData.sort((a, b) => a.date.localeCompare(b.date));
        setPortfolioHistory(historyData);
      }

    } catch (err: any) {
      console.error("❌ [PORTFOLIO] Error loading portfolio:", err);
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un portfolio
  const createPortfolio = useCallback(async () => {
    const toastId = toast.loading('Création du portfolio...');

    try {
      console.log('🆕 [PORTFOLIO] Creating portfolio...');

      // Utiliser apiFetch qui gère automatiquement le token sur mobile
      await apiFetch('/portfolios/my', {
        method: 'POST',
        body: JSON.stringify({})
      });

      console.log('✅ [PORTFOLIO] Portfolio created');
      toast.success('Portfolio créé !', { id: toastId });
      await loadPortfolio(); // Recharger après création
    } catch (err: any) {
      console.error("❌ [PORTFOLIO] Error creating portfolio:", err);
      toast.error(`Erreur : ${err.message}`, { id: toastId });
      throw err;
    }
  }, [loadPortfolio]);

  // Calculer la valeur totale du portfolio
  const calculateTotalValue = useCallback((): number => {
    if (!portfolio) return 0;
    
    const stocksValue = portfolio.positions.reduce((acc, pos) => {
      const stock = stocksData[pos.stock_ticker];
      return stock ? acc + (pos.quantity * stock.current_price) : acc;
    }, 0);
    
    return portfolio.cash_balance + stocksValue;
  }, [portfolio, stocksData]);

  // Charger au montage
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