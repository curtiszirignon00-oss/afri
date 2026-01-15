// src/components/onboarding/SectorsStep.tsx
import { useState } from 'react';
import { Building2, Smartphone, Heart, Zap, ShoppingBag, Home, Landmark, Leaf } from 'lucide-react';

interface SectorsStepProps {
    value: string[];
    onNext: (sectors: string[]) => void;
    onBack: () => void;
}

const sectors = [
    { value: 'Technologie', icon: Smartphone, color: 'blue' },
    { value: 'Finance', icon: Landmark, color: 'green' },
    { value: 'Santé', icon: Heart, color: 'red' },
    { value: 'Énergie', icon: Zap, color: 'yellow' },
    { value: 'Consommation', icon: ShoppingBag, color: 'purple' },
    { value: 'Immobilier', icon: Home, color: 'orange' },
    { value: 'Industrie', icon: Building2, color: 'gray' },
    { value: 'Agriculture', icon: Leaf, color: 'green' },
];

export default function SectorsStep({ value, onNext, onBack }: SectorsStepProps) {
    const [selected, setSelected] = useState<string[]>(value);

    const toggleSector = (sector: string) => {
        if (selected.includes(sector)) {
            setSelected(selected.filter((s) => s !== sector));
        } else {
            setSelected([...selected, sector]);
        }
    };

    const handleSubmit = () => {
        onNext(selected);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Quels secteurs vous intéressent ?
                </h2>
                <p className="text-gray-600">
                    Sélectionnez au moins 2 secteurs (vous pourrez modifier plus tard)
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sectors.map((sector) => {
                    const Icon = sector.icon;
                    const isSelected = selected.includes(sector.value);

                    return (
                        <button
                            key={sector.value}
                            onClick={() => toggleSector(sector.value)}
                            className={`p-6 rounded-xl border-2 transition-all ${isSelected
                                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className={`p-3 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                    <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                                </div>
                                <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                    {sector.value}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>{selected.length}</strong> secteur{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
                    {selected.length < 2 && ' (minimum 2 requis)'}
                </p>
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
                    disabled={selected.length < 2}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    Continuer →
                </button>
            </div>
        </div>
    );
}
