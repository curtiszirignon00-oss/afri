// src/components/onboarding/FinancialContextStep.tsx
import { useState } from 'react';

const INCOME_SOURCES = [
  { value: 'salarie', label: 'Salarié (public / privé)', icon: '👔' },
  { value: 'independant', label: 'Commerçant / Indépendant', icon: '🛒' },
  { value: 'diaspora', label: 'Diaspora (envois de fonds)', icon: '✈️' },
  { value: 'entrepreneur', label: 'Entrepreneur / PME', icon: '🚀' },
];

const INVEST_LABELS = [
  '< 10 000 FCFA',
  '10 000 – 25 000 FCFA',
  '25 000 – 50 000 FCFA',
  '50 000 – 100 000 FCFA',
  '100 000 – 250 000 FCFA',
  '250 000 – 500 000 FCFA',
  '> 500 000 FCFA',
];

const INVEST_VALUES = [5000, 17500, 37500, 75000, 175000, 375000, 750000];

interface Props {
  onNext: (incomeSource: string, monthlyBudget: number) => void;
  onBack: () => void;
}

export default function FinancialContextStep({ onNext, onBack }: Props) {
  const [incomeSource, setIncomeSource] = useState<string | null>(null);
  const [budgetIndex, setBudgetIndex] = useState<number>(2);

  const canContinue = incomeSource !== null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Votre contexte financier</h2>
        <p className="text-gray-600 mt-1">
          Ces informations nous aident à calibrer votre expérience BRVM.
        </p>
      </div>

      {/* Source de revenus */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Quelle est votre source principale de revenus ?</p>
        <div className="grid grid-cols-2 gap-3">
          {INCOME_SOURCES.map((src) => (
            <button
              key={src.value}
              onClick={() => setIncomeSource(src.value)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                incomeSource === src.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <span className="text-xl">{src.icon}</span>
              <span className="text-sm font-medium text-gray-800">{src.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Budget mensuel */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-1">
          Combien envisagez-vous d'investir par mois ?
        </p>
        <p className="text-xs text-gray-400 mb-4">
          À titre indicatif — aucun minimum requis sur la BRVM.
        </p>

        <div className="space-y-3">
          <div className="flex justify-between text-xs text-gray-500">
            <span>< 10 000</span>
            <span>> 500 000 FCFA</span>
          </div>
          <input
            type="range"
            min={0}
            max={INVEST_VALUES.length - 1}
            step={1}
            value={budgetIndex}
            onChange={(e) => setBudgetIndex(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="text-center">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
              {INVEST_LABELS[budgetIndex]}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          Retour
        </button>
        <button
          disabled={!canContinue}
          onClick={() => incomeSource && onNext(incomeSource, INVEST_VALUES[budgetIndex])}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
