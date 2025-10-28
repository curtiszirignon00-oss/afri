import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

// Formateur de devise pour afficher les montants en XOF de manière lisible
const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  minimumFractionDigits: 0,
});

type PortfolioSummaryProps = {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  cash: number;
};

// Un composant "carte" réutilisable pour chaque métrique
function SummaryCard({ title, value, icon, change, isGainLoss = false }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  isGainLoss?: boolean;
}) {
  const isPositive = !isGainLoss || (isGainLoss && !value.startsWith('-'));

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="text-gray-400">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {change && (
        <p className={`text-sm font-semibold mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </p>
      )}
    </div>
  );
}


export default function PortfolioSummary({ totalValue, totalGainLoss, totalGainLossPercent, cash }: PortfolioSummaryProps) {
  return (
    <div className="grid grid-cols-