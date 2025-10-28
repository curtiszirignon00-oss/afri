import { useState, useEffect, useCallback } from 'react'; // Ajout de useCallback
import { supabase } from '../lib/supabase';
import PortfolioSummary from './PortfolioSummary';
import PositionsTable from './PositionsTable';
import CreatePortfolioForm from './CreatePortfolioForm'; // 1. Importer le nouveau composant

// ... (les types Position, Portfolio, PortfolioMetrics ne changent pas) ...
export type Position = {
  stock_ticker: string;
  quantity: number;
  average_buy_price: number;
  current_price: number;
  current_value: number;
  gain_loss: number;
};

export type Portfolio = {
  id: string;
  name: string;
  cash_balance: number;
  positions: Position[];
};

type PortfolioMetrics = {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  initialInvestment: number;
};


export default function PortfolioDashboard() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [metrics, setMetrics] = useState<PortfolioMetrics>({ /* ... */ });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Mettre la logique de fetch dans une fonction "callback" pour pouvoir l'appeler à nouveau
  const fetchPortfolioData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // ... (TOUTE la logique de fetch que nous avons écrite à l'étape 5 reste ici, inchangée)
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolios')
          .select('*')
          .single();

        if (portfolioError) {
          if (portfolioError.code === 'PGRST116') { // Code d'erreur Supabase pour "aucune ligne retournée"
             setPortfolio(null); // L'utilisateur n'a pas de portefeuille, c'est normal
             return; // On arrête l'exécution ici
          }
          throw portfolioError;
        }
        
        // ... le reste de la logique de fetch
        const { data: basePositions, error: positionsError } = await supabase
          .from('positions')
          .select('stock_ticker, quantity, average_buy_price')
          .eq('portfolio_id', portfolioData.id);

        if (positionsError) throw positionsError;
        if (!basePositions || basePositions.length === 0) {
          setPortfolio({ ...portfolioData, positions: [] });
          setMetrics({
            totalValue: portfolioData.cash_balance,
            initialInvestment: 0,
            totalGainLoss: 0,
            totalGainLossPercent: 0,
          });
          return;
        }

        const stockTickers = basePositions.map(p => p.stock_ticker);
        const { data: stockData, error: stockError } = await supabase
          .from('stocks')
          .select('symbol, current_price')
          .in('symbol', stockTickers);
        
        if (stockError) throw stockError;

        const priceMap = new Map(stockData.map(s => [s.symbol, s.current_price]));
        let totalPositionsValue = 0;
        let totalInitialInvestment = 0;

        const enrichedPositions: Position[] = basePositions.map(pos => {
          const current_price = priceMap.get(pos.stock_ticker) || pos.average_buy_price;
          const current_value = pos.quantity * current_price;
          const initial_cost = pos.quantity * pos.average_buy_price;
          const gain_loss = current_value - initial_cost;
          totalPositionsValue += current_value;
          totalInitialInvestment += initial_cost;
          return { ...pos, current_price, current_value, gain_loss };
        });

        const totalValue = portfolioData.cash_balance + totalPositionsValue;
        const totalGainLoss = totalValue - portfolioData.initial_balance;
        const totalGainLossPercent = (totalGainLoss / portfolioData.initial_balance) * 100;

        setPortfolio({
          id: portfolioData.id,
          name: portfolioData.name,
          cash_balance: portfolioData.cash_balance,
          positions: enrichedPositions,
        });
        setMetrics({
          totalValue,
          totalGainLoss,
          totalGainLossPercent: isNaN(totalGainLossPercent) ? 0 : totalGainLossPercent,
          initialInvestment: totalInitialInvestment,
        });

    } catch (err: any) {
      setError(err.message);
      console.error("Erreur lors de la récupération du portefeuille:", err);
    } finally {
      setLoading(false);
    }
  }, []); // useCallback se termine ici

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">Erreur : {error}</div>;
  }

  // 3. Afficher le composant de création si aucun portefeuille n'est trouvé
  if (!portfolio) {
    return <CreatePortfolioForm onPortfolioCreated={fetchPortfolioData} />;
  }
  
  // Le reste du JSX pour afficher le dashboard reste inchangé
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{portfolio.name}</h1>
        <p className="text-gray-600 mb-8">Suivez la performance de vos investissements virtuels.</p>

        <PortfolioSummary 
          cash={portfolio.cash_balance}
          totalValue={metrics.totalValue}
          totalGainLoss={metrics.totalGainLoss}
          totalGainLossPercent={metrics.totalGainLossPercent}
        />
        
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Mes Actifs</h2>
          <PositionsTable positions={portfolio.positions} />
        </div>
      </div>
    </div>
  );
}