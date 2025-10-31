// src/hooks/usePortfolio.ts
import { useState, useEffect, useCallback } from 'react';
import { Portfolio, Position, PortfolioHistoryPoint, Stock } from '../types';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3000/api';

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
      const [portfolioRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/portfolios/my`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/portfolios/my/history`, { credentials: 'include' })
      ]);

      // Gérer la réponse du portfolio
      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json();
        setPortfolio(portfolioData);

        // Charger les données de marché pour les positions
        if (portfolioData.positions && portfolioData.positions.length > 0) {
          const tickers = portfolioData.positions.map((p: Position) => p.stock_ticker);
          const stocksResponse = await fetch(`${API_BASE_URL}/stocks`);
          
          if (stocksResponse.ok) {
            const allStocks: Stock[] = await stocksResponse.json();
            const stockDataMap = allStocks.reduce((acc, stock) => {
              acc[stock.symbol] = stock;
              return acc;
            }, {} as { [key: string]: Stock });
            
            setStocksData(stockDataMap);
          }
        }
      } else if (portfolioRes.status === 404) {
        setPortfolio(null); // Pas de portfolio
      } else if (portfolioRes.status === 401) {
        throw new Error("Non authentifié");
      } else {
        throw new Error("Impossible de charger le portfolio");
      }

      // Gérer l'historique
      if (historyRes.ok) {
        const historyData: PortfolioHistoryPoint[] = await historyRes.json();
        historyData.sort((a, b) => a.date.localeCompare(b.date));
        setPortfolioHistory(historyData);
      }

    } catch (err: any) {
      console.error("Erreur chargement portfolio:", err);
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un portfolio
  const createPortfolio = useCallback(async () => {
    const toastId = toast.loading('Création du portfolio...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/portfolios/my`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur création');
      }

      toast.success('Portfolio créé !', { id: toastId });
      await loadPortfolio(); // Recharger après création
    } catch (err: any) {
      console.error("Erreur création portfolio:", err);
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