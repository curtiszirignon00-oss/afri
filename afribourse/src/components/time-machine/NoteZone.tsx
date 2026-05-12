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
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <PenLine className="w-4 h-4 text-amber-500" />
        <p className="text-sm font-semibold text-amber-700">
          Justifiez votre stratégie <span className="font-normal text-amber-500">( optionnel )</span>
        </p>
      </div>

      <div className="space-y-1">
        {QUESTIONS.map((q, i) => (
          <p key={i} className="text-xs text-amber-600">• {q}</p>
        ))}
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Rédigez votre raisonnement ici…"
        rows={4}
        className="w-full text-sm border border-amber-200 bg-white rounded-lg p-3 text-gray-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 resize-none placeholder:text-gray-300 transition-all"
      />

      <p className="text-[10px] text-amber-500">
        Simba analysera votre logique, pas uniquement vos résultats.
      </p>
    </div>
  );
}
