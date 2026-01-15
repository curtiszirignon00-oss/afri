// src/components/markets/PeriodSelector.tsx
interface PeriodSelectorProps {
    selected: 7 | 30 | 90;
    onChange: (period: 7 | 30 | 90) => void;
}

export default function PeriodSelector({ selected, onChange }: PeriodSelectorProps) {
    const periods = [
        { value: 7 as const, label: '7 jours' },
        { value: 30 as const, label: '30 jours' },
        { value: 90 as const, label: '90 jours' },
    ];

    return (
        <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden">
            {periods.map((p, index) => (
                <button
                    key={p.value}
                    onClick={() => onChange(p.value)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${selected === p.value
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        } ${index > 0 ? 'border-l border-gray-300' : ''}`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}
