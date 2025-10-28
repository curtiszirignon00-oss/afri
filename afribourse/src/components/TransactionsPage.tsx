import { useEffect, useState } from 'react';
// import { supabase } from '../lib/supabase'; // <-- REMOVE Supabase
import { ArrowLeft, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import toast from 'react-hot-toast';

type TransactionsPageProps = {
  onNavigate: (page: string) => void;
};

// --- Updated Type Definition (Matching Prisma Schema) ---
type Transaction = {
  id: string;
  created_at: string | null; // Prisma dates can be null, handle this
  stock_ticker: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price_per_share: number;
  portfolioId: string; // Added portfolioId
};
// --- End Type Definition ---

const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if needed

export default function TransactionsPage({ onNavigate }: TransactionsPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state

  useEffect(() => {
    // --- UPDATED loadTransactions ---
    async function loadTransactions() {
      setLoading(true);
      setError(null);
      try {
        // Fetch transactions from the new backend endpoint
        const response = await fetch(`${API_BASE_URL}/portfolios/my/transactions`, {
          credentials: 'include', // Send authentication cookie
        });

        if (response.status === 401) {
          // Not authorized, redirect to login
          toast.error("Veuillez vous reconnecter pour voir l'historique.");
          onNavigate('login');
          return;
        }

        if (response.status === 404) {
          // Portfolio not found (user might not have created one)
          setTransactions([]); // Show empty list
          return;
        }

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: Impossible de charger les transactions.`);
        }

        const transactionsData: Transaction[] = await response.json();
        setTransactions(transactionsData || []); // Ensure it's an array

      } catch (err: any) {
        console.error("Erreur de chargement des transactions:", err);
        setError(err.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    }
    // --- END UPDATED loadTransactions ---
    loadTransactions();
  }, []); // Empty dependency array, runs once on mount

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  }

  // Format date safely
  function formatDate(dateString: string | null): string {
      if (!dateString) return 'N/A';
      try {
          return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch (e) {
          return 'Date invalide';
      }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (error) {
     return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => onNavigate('dashboard')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mx-auto">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour au tableau de bord</span>
            </button>
        </div>
     );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button onClick={() => onNavigate('dashboard')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5" />
        <span>Retour au tableau de bord</span>
      </button>

      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Historique des Transactions</h1>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]"> {/* Added min-width for smaller screens */}
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200"> {/* Added border */}
              <tr>
                <th className="px-6 py-3 font-semibold text-left">Date</th> {/* Changed font-medium to semibold, added text-left */}
                <th className="px-6 py-3 font-semibold text-left">Opération</th>
                <th className="px-6 py-3 font-semibold text-left">Action</th>
                <th className="px-6 py-3 font-semibold text-right">Quantité</th>
                <th className="px-6 py-3 font-semibold text-right">Prix Unitaire</th>
                <th className="px-6 py-3 font-semibold text-right">Montant Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length > 0 ? (
                transactions.map(tx => {
                  const isBuy = tx.type === 'BUY';
                  const totalAmount = tx.quantity * tx.price_per_share;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors"> {/* Added transition */}
                      {/* Date */}
                      <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(tx.created_at)}</td>
                      {/* Operation Type */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full font-semibold text-xs ${isBuy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}> {/* Adjusted padding/spacing */}
                          {isBuy ? <ArrowDownRight className="w-3.5 h-3.5"/> : <ArrowUpRight className="w-3.5 h-3.5"/>}
                          <span>{isBuy ? 'ACHAT' : 'VENTE'}</span>
                        </span>
                      </td>
                      {/* Ticker */}
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{tx.stock_ticker}</td>
                      {/* Quantity */}
                      <td className="px-6 py-4 text-right text-gray-700">{formatNumber(tx.quantity)}</td> {/* Formatted quantity */}
                      {/* Price */}
                      <td className="px-6 py-4 text-right text-gray-700 whitespace-nowrap">{formatNumber(tx.price_per_share)} FCFA</td>
                      {/* Total Amount */}
                      <td className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${isBuy ? 'text-red-600' : 'text-green-600'}`}>
                        {isBuy ? '-' : '+'}{formatNumber(totalAmount)} FCFA
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Empty State
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                      Vous n'avez effectué aucune transaction pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}