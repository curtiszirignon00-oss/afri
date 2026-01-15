// src/components/markets/ComparisonEmptyState.tsx
import { Scale, Plus } from 'lucide-react';

export default function ComparisonEmptyState() {
    return (
        <div className="mb-6 p-10 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-lg text-center comparison-fade-in">
            <div className="max-w-md mx-auto">
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <Scale className="w-16 h-16 text-blue-400" />
                        <div className="absolute -right-1 -bottom-1 bg-white rounded-full p-1">
                            <Plus className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Comparez vos actions préférées
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    Sélectionnez jusqu'à 4 actions pour comparer leurs performances côte-à-côte
                    et prendre des décisions d'investissement éclairées.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg shadow-sm">
                        <Plus className="w-3 h-3" />
                        <span>Cliquez sur</span>
                        <span className="font-semibold">"Comparer"</span>
                        <span>dans le tableau</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
