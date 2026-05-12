import { PenLine } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const QUESTIONS = [
  'Pourquoi ce choix de titres ?',
  'Quelle est votre anticipation principale pour cette période ?',
  'Quel risque identifiez-vous ?',
];

export default function NoteZone({ value, onChange }: Props) {
  return (
    <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-amber-400" />
        <p className="text-sm font-semibold text-amber-300">
          Justifiez votre stratégie <span className="font-normal text-amber-500/70">(optionnel)</span>
        </p>
      </div>

      <div className="space-y-1">
        {QUESTIONS.map((q, i) => (
          <p key={i} className="text-xs text-amber-500/80">• {q}</p>
        ))}
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Rédigez votre raisonnement ici…"
        rows={4}
        className="w-full text-sm border border-white/10 bg-white/5 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 resize-none placeholder:text-slate-600 transition-colors"
      />

      <p className="text-[10px] text-amber-500/60">
        Simba analysera votre logique, pas uniquement vos résultats.
      </p>
    </div>
  );
}
