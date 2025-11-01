// src/components/TransactionsPage.tsx - VERSION MIGRÉE
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTransactions } from '../hooks/useApi';
import { Button, Card, LoadingSpinner, ErrorMessage } from './ui';

type TransactionsPageProps = {
  onNavigate: (page: string) => void;
};

export default function TransactionsPage({ onNavigate }: TransactionsPageProps) {
  // ✅ React Query: Hook pour récupérer les transactions
  const { data: transactions = [], isLoading, error, refetch } = useTransactions();

  function formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  // ✅ Loading avec LoadingSpinner component
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Chargement des transactions..." />;
  }

  // ✅ Error avec ErrorMessage component
  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message="Impossible de charger les transactions"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Historique des Transactions</h1>
            <p className="text-gray-600">Consultez toutes vos opérations d'achat et de vente</p>
          </div>
          {/* ✅ Button remplace button manuel */}
          <Button variant="secondary" onClick={() => onNavigate('dashboard')}>
            Retour au Dashboard
          </Button>
        </div>

        {/* Transactions List */}
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const isBuy = transaction.type === 'BUY';
              const total = transaction.quantity * transaction.price_per_share;

              return (
                /* ✅ Card remplace div bg-white */
                <Card key={transaction.id} hoverable>
                  <div className="flex items-center justify-between">
                    {/* Left: Icon + Info */}
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isBuy ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        {isBuy ? (
                          <ArrowDownRight className="w-6 h-6 text-green-600" />
                        ) : (
                          <ArrowUpRight className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-lg">{transaction.stock_ticker}</p>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded ${
                              isBuy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isBuy ? 'ACHAT' : 'VENTE'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {transaction.quantity} action{transaction.quantity > 1 ? 's' : ''} @ {formatNumber(transaction.price_per_share)} FCFA
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(transaction.created_at)}</p>
                      </div>
                    </div>

                    {/* Right: Total */}
                    <div className="text-right">
                      <p className={`text-xl font-bold ${isBuy ? 'text-green-600' : 'text-red-600'}`}>
                        {isBuy ? '-' : '+'} {formatNumber(total)} FCFA
                      </p>
                      <p className="text-sm text-gray-500">Total</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          /* ✅ Card pour l'état vide */
          <Card className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowUpRight className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune transaction</h3>
            <p className="text-gray-600 mb-6">Vous n'avez pas encore effectué de transaction.</p>
            <Button variant="primary" onClick={() => onNavigate('markets')}>
              Explorer les marchés
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}