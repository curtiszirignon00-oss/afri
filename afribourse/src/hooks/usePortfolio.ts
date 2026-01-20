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
      console.log(`📊 [PORTFOLIO] Loading portfolio data for wallet type: ${walletType}...`);

      // ✅ OPTIMISATION: Charger TOUS les appels en parallèle
      const [portfolioData, historyData, allStocks] = await Promise.all([
        apiFetch<Portfolio>(`/portfolios/my?wallet_type=${walletType}`).catch(err => {
          console.warn('Portfolio fetch error:', err);
          const msg = err.message?.toLowerCase() || '';
          // Gérer les cas de portfolio non trouvé (404 ou message spécifique)
          if (msg.includes('404') || msg.includes('non trouvé') || msg.includes('not found')) {
            return null; // Pas de portfolio - pas une erreur critique
          }
          if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('non autorisé')) {
            throw new Error("Non authentifié");
          }
          throw err;
        }),
        apiFetch<PortfolioHistoryPoint[]>(`/portfolios/my/history?wallet_type=${walletType}`).catch(err => {
          console.warn('History fetch error:', err);
          return []; // Retourner un array vide en cas d'erreur
        }),
        // ✅ Charger les stocks en parallèle avec le portfolio
        apiFetch<Stock[]>('/stocks').catch(err => {
          console.warn('Stocks fetch error:', err);
          return [];
        })
      ]);

      console.log(`✅ [PORTFOLIO] All data loaded in parallel for ${walletType}`);

      // Créer le map des stocks immédiatement
      if (allStocks && allStocks.length > 0) {
        const stockDataMap = allStocks.reduce((acc, stock) => {
          acc[stock.symbol] = stock;
          return acc;
        }, {} as { [key: string]: Stock });
        setStocksData(stockDataMap);
      }

      if (portfolioData) {
        console.log(`✅ [PORTFOLIO] Found ${walletType} portfolio:`, {
          id: portfolioData.id,
          wallet_type: portfolioData.wallet_type,
          cash_balance: portfolioData.cash_balance,
          initial_balance: portfolioData.initial_balance,
          positions: portfolioData.positions?.length || 0
        });
        setPortfolio(portfolioData);
      } else {
        setPortfolio(null);
        console.log(`ℹ️ [PORTFOLIO] No ${walletType} portfolio found`);
      }

      // Gérer l'historique - toujours mettre à jour, même si vide
      if (historyData && historyData.length > 0) {
        historyData.sort((a, b) => a.date.localeCompare(b.date));
        setPortfolioHistory(historyData);
      } else {
        setPortfolioHistory([]);
      }

    } catch (err: any) {
      console.error(`❌ [PORTFOLIO] Error loading ${walletType} portfolio:`, err);
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [walletType]);

  // Créer un portfolio
  const createPortfolio = useCallback(async () => {
    const toastId = toast.loading('Création du portfolio...');

    try {
      console.log(`🆕 [PORTFOLIO] Creating ${walletType} portfolio...`);

      // Utiliser apiFetch qui gère automatiquement le token sur mobile
      await apiFetch('/portfolios/my', {
        method: 'POST',
        body: JSON.stringify({ wallet_type: walletType })
      });

      console.log(`✅ [PORTFOLIO] ${walletType} portfolio created`);
      toast.success('Portfolio créé !', { id: toastId });
      await loadPortfolio(); // Recharger après création
    } catch (err: any) {
      console.error(`❌ [PORTFOLIO] Error creating ${walletType} portfolio:`, err);
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