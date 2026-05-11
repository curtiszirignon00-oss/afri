import { TrendingUp, PiggyBank, DollarSign } from 'lucide-react';

interface Props {
  portfolioValue: number;
  dividendsCumulative: number;
  newContribution: number;
  totalCapital: number;
}

function Line({ icon: Icon, label, value, cls }: { icon: any; label: string; value: number; cls?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${cls ?? 'text-emerald-500'}`} />
        <span className="text-sm text-emerald-900">{label}</span>
      </div>
      <span className="text-sm font-bold text-emerald-900">
        {Math.round(value).toLocaleString('fr-FR')} FCFA
      </span>
    </div>
  );
}

export default function ReinvestBanner({ portfolioValue, dividendsCumulative, newContribution, totalCapital }: Props) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Capital disponible — composition</p>

      <div className="space-y-2">
        <Line icon={TrendingUp}  label="Valeur portefeuille (étape précédente)" value={portfolioValue} />
        <Line icon={DollarSign}  label="Dividendes cumulés"                     value={dividendsCumulative} />
        <Line icon={PiggyBank}   label="Nouvelle épargne mensuelle"              value={newContribution} />
      </div>

      <div className="border-t border-emerald-200 pt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-emerald-800">Total disponible</span>
        <span className="text-base font-extrabold text-emerald-700">
          {Math.round(totalCapital).toLocaleString('fr-FR')} FCFA
        </span>
      </div>
    </div>
  );
}
