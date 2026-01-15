// src/components/onboarding/PrivacyStep.tsx
import { useState } from 'react';
import { Eye, EyeOff, Users, Lock } from 'lucide-react';

interface PrivacyStepProps {
    onNext: (privacy: any) => void;
    onBack: () => void;
}

export default function PrivacyStep({ onNext, onBack }: PrivacyStepProps) {
    const [portfolioVisibility, setPortfolioVisibility] = useState<'PUBLIC' | 'FOLLOWERS' | 'PRIVATE'>('FOLLOWERS');
    const [showPerformance, setShowPerformance] = useState(false);
    const [showTransactions, setShowTransactions] = useState(false);

    const handleSubmit = () => {
        onNext({
            portfolio_visibility: portfolioVisibility,
            show_performance: showPerformance,
            show_transactions: showTransactions,
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Paramètres de confidentialité
                </h2>
                <p className="text-gray-600">
                    Contrôlez qui peut voir vos informations d'investissement
                </p>
            </div>

            {/* Portfolio Visibility */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Visibilité du portefeuille</h3>
                <div className="space-y-3">
                    <button
                        onClick={() => setPortfolioVisibility('PUBLIC')}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${portfolioVisibility === 'PUBLIC'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <Eye className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <div className="font-medium text-gray-900">Public</div>
                                <div className="text-sm text-gray-600">Visible par tous les utilisateurs</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setPortfolioVisibility('FOLLOWERS')}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${portfolioVisibility === 'FOLLOWERS'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <div className="font-medium text-gray-900">Followers uniquement</div>
                                <div className="text-sm text-gray-600">Visible par vos abonnés seulement</div>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setPortfolioVisibility('PRIVATE')}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${portfolioVisibility === 'PRIVATE'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <Lock className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <div className="font-medium text-gray-900">Privé</div>
                                <div className="text-sm text-gray-600">Visible par vous uniquement</div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Additional Privacy Settings */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Informations détaillées</h3>

                <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <div>
                        <div className="font-medium text-gray-900">Afficher mes performances</div>
                        <div className="text-sm text-gray-600">ROI, gains/pertes</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={showPerformance}
                        onChange={(e) => setShowPerformance(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded"
                    />
                </label>

                <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                    <div>
                        <div className="font-medium text-gray-900">Afficher mes transactions</div>
                        <div className="text-sm text-gray-600">Achats et ventes</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={showTransactions}
                        onChange={(e) => setShowTransactions(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded"
                    />
                </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                    💡 <strong>Conseil :</strong> Vous pourrez modifier ces paramètres à tout moment depuis votre profil
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
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    Continuer →
                </button>
            </div>
        </div>
    );
}
