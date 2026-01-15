// src/components/onboarding/HorizonStep.tsx
import { useState } from 'react';
import { Calendar, Clock, TrendingUp, Target } from 'lucide-react';

interface HorizonStepProps {
    value?: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' | 'VERY_LONG_TERM';
    onNext: (horizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' | 'VERY_LONG_TERM') => void;
    onBack: () => void;
}

const horizons = [
    {
        value: 'SHORT_TERM' as const,
        label: 'Court terme',
        duration: '< 1 an',
        icon: Clock,
        color: 'blue',
        description: 'Objectifs à court terme, liquidité importante',
        examples: ['Épargne d\'urgence', 'Projet à court terme'],
    },
    {
        value: 'MEDIUM_TERM' as const,
        label: 'Moyen terme',
        duration: '1-5 ans',
        icon: Calendar,
        color: 'green',
        description: 'Équilibre entre croissance et disponibilité',
        examples: ['Achat immobilier', 'Projet familial'],
    },
    {
        value: 'LONG_TERM' as const,
        label: 'Long terme',
        duration: '5-10 ans',
        icon: TrendingUp,
        color: 'purple',
        description: 'Croissance à long terme, volatilité acceptable',
        examples: ['Éducation enfants', 'Patrimoine'],
    },
    {
        value: 'VERY_LONG_TERM' as const,
        label: 'Très long terme',
        duration: '> 10 ans',
        icon: Target,
        color: 'orange',
        description: 'Maximisation du potentiel de croissance',
        examples: ['Retraite', 'Transmission'],
    },
];

export default function HorizonStep({ value, onNext, onBack }: HorizonStepProps) {
    const [selected, setSelected] = useState(value);

    const handleSubmit = () => {
        if (selected) {
            onNext(selected);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Quel est votre horizon d'investissement ?
                </h2>
                <p className="text-gray-600">
                    Sur quelle durée envisagez-vous d'investir ?
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {horizons.map((horizon) => {
                    const Icon = horizon.icon;
                    const isSelected = selected === horizon.value;

                    return (
                        <button
                            key={horizon.value}
                            onClick={() => setSelected(horizon.value)}
                            className={`text-left p-6 rounded-xl border-2 transition-all ${isSelected
                                    ? `border-${horizon.color}-500 bg-${horizon.color}-50 shadow-lg`
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg bg-${horizon.color}-100`}>
                                    <Icon className={`w-6 h-6 text-${horizon.color}-600`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold text-gray-900">
                                            {horizon.label}
                                        </h3>
                                        <span className="text-sm font-medium text-gray-500">
                                            {horizon.duration}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">
                                        {horizon.description}
                                    </p>
                                    <div className="space-y-1">
                                        {horizon.examples.map((example, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                                                <div className="w-1 h-1 rounded-full bg-gray-400" />
                                                {example}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-between pt-6">
                <button
                    onClick={onBack}
                    className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
                >
                    ← Retour
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!selected}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    Continuer →
                </button>
            </div>
        </div>
    );
}
