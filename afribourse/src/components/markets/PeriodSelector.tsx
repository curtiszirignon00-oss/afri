// src/components/markets/PeriodSelector.tsx
export type ComparisonPeriod = 7 | 30 | 90 | 180 | 365 | 1095 | 1825;

interface PeriodSelectorProps {
    selected: ComparisonPeriod;
    onChange: (period: ComparisonPeriod) => void;
}

export default function PeriodSelector({ selected, onChange }: PeriodSelectorProps) {
    const periods: { value: ComparisonPeriod; label: string }[] = [
        { value: 7,    label: '7J'   },
        { value: 30,   label: '1M'   },
        { value: 90,   label: '3M'   },
        { value: 180,  label: '6M'   },
        { value: 365,  label: '1A'   },
        { value: 1095, label: '3A'   },
        { value: 1825, label: '5A'   },
    ];

    return (
        <div className="inline-flex rounded-lg border border-gray-300 bg-white overflow-hidden">
            {periods.map((p, index) => (
                <button
                    key={p.value}
                    onClick={() => onChange(p.value)}
                    className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        selected === p.value
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
