import { Position } from './PortfolioDashboard'; // On importe le type depuis le composant parent
import { TrendingUp, TrendingDown } from 'lucide-react';

// On réutilise notre formateur de devise
const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  minimumFractionDigits: 0,
});

type PositionsTableProps = {
  positions: Position[];
};

export default function PositionsTable({ positions }: PositionsTableProps) {
  // Gestion du cas où le portefeuille est vide
  if (positions.length === 0) {
    return (
      <div className="bg-white text-center p-8 rounded-xl border border-gray-200 shadow-sm">
        <p className="text-gray-600">Vous ne détenez aucun actif pour le moment.</p>
        <button className="mt-4 bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200">
          Explorer les marchés
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-left divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Entreprise</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Prix d'Achat Moyen</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dernier Cours</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Valeur Actuelle</th>
            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Plus/Moins-Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {positions.map((pos) => {
            // NOTE : Les calculs suivants sont des placeholders.
            // Nous les remplacerons par des vraies données à la prochaine étape.
            const currentPrice = pos.current_price || pos.average_buy_price; // Placeholder
            const currentValue = pos.quantity * currentPrice;
            const gainLoss = currentValue - (pos.quantity * pos.average_buy_price);
            const isPositive = gainLoss >= 0;

            return (
              <tr key={pos.stock_ticker}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">{pos.stock_ticker}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{pos.quantity}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{currencyFormatter.format(pos.average_buy_price)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Donnée à venir */}
                  <div className="text-sm text-gray-700">{currencyFormatter.format(currentPrice)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Donnée à venir */}
                  <div className="text-sm font-bold text-gray-800">{currencyFormatter.format(currentValue)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Donnée à venir */}
                  <div className={`flex items-center text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4 mr-1"/> : <TrendingDown className="w-4 h-4 mr-1"/>}
                    {currencyFormatter.format(gainLoss)}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}