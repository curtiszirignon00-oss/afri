// src/components/onboarding/LifeGoalStep.tsx
import { useState } from 'react';

const GOALS = [
  {
    value: 'education',
    label: 'Éducation des enfants',
    desc: 'Constituer un capital pour les études',
    icon: '📚',
  },
  {
    value: 'immo',
    label: 'Projet immobilier',
    desc: 'Achat terrain, construction, logement',
    icon: '🏠',
  },
  {
    value: 'retraite',
    label: 'Retraite sereine',
    desc: 'Revenus complémentaires à long terme',
    icon: '🌴',
  },
  {
    value: 'business',
    label: 'Développer une activité',
    desc: 'Capital pour un projet entrepreneurial',
    icon: '💼',
  },
  {
    value: 'epargne',
    label: 'Faire fructifier mon épargne',
    desc: 'Mieux que le livret ou la tontine',
    icon: '💰',
  },
];

interface Props {
  onNext: (lifeGoal: string) => void;
  showBackButton?: boolean;
}

export default function LifeGoalStep({ onNext, showBackButton = false }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Quel est votre objectif principal ?
        </h2>
        <p className="text-gray-600 mt-1">
          AfriBourse adapte votre parcours à vos projets de vie.
        </p>
      </div>

      {/* Bulle Simba */}
      <div className="bg-emerald-50 rounded-xl p-4 flex gap-3 items-start">
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          AI
        </div>
        <p className="text-sm text-emerald-800">
          Bonjour ! Je suis <strong>Simba</strong>, votre guide sur la BRVM. Dites-moi ce qui
          vous motive à investir.
        </p>
      </div>

      {/* Choix */}
      <div className="space-y-3">
        {GOALS.map((goal) => (
          <button
            key={goal.value}
            onClick={() => setSelected(goal.value)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
              selected === goal.value
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <span className="text-2xl">{goal.icon}</span>
            <div>
              <p className="font-semibold text-gray-900">{goal.label}</p>
              <p className="text-sm text-gray-500">{goal.desc}</p>
            </div>
            {selected === goal.value && (
              <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        disabled={!selected}
        onClick={() => selected && onNext(selected)}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-40 hover:bg-emerald-700 transition-colors"
      >
        Continuer
      </button>
    </div>
  );
}
