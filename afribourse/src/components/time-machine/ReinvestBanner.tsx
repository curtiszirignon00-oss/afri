import { TrendingUp, PiggyBank, DollarSign, ArrowRight } from 'lucide-react';

interface Props {
  portfolioValue: number;
  dividendsCumulative: number;
  newContribution: number;
  totalCapital: number;
}

function Line({ icon: Icon, label, value, iconCls }: { icon: any; label: string; value: number; iconCls: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${iconCls}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <span className="text-xs font-semibold text-slate-200 tabular-nums">
        {Math.round(value).toLocaleString('fr-FR')} F
      </span>
    </div>
  );
}

export default function ReinvestBanner({ portfolioValue, dividendsCumulative, newContribution, totalCapital }: Props) {
  return (
    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 space-y-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
          Capital disponible — composition
        </p>
      </div>

      <div className="space-y-2">
        <Line icon={TrendingUp} label="Valeur portefeuille (étape précédente)" value={portfolioValue} iconCls="text-emerald-400" />
        <Line icon={DollarSign} label="Dividendes cumulés"                     value={dividendsCumulative} iconCls="text-amber-400" />
        <Line icon={PiggyBank}  label="Nouvelle épargne mensuelle"              value={newContribution} iconCls="text-violet-400" />
      </div>

      <div className="border-t border-emerald-500/20 pt-2 flex items-center justify-between">
        <span className="text-xs font-bold text-emerald-300">Total disponible</span>
        <span className="text-base font-extrabold text-emerald-400 tabular-nums">
          {Math.round(totalCapital).toLocaleString('fr-FR')} FCFA
        </span>
      </div>
    </div>
  );
}
