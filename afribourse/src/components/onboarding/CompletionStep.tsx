// src/components/onboarding/CompletionStep.tsx
import { CheckCircle, Shield, TrendingUp, Users } from 'lucide-react';

interface CompletionStepProps {
    data: any;
    onComplete: () => void;
    onBack: () => void;
    isLoading: boolean;
}

const getRiskProfileLabel = (profile: string) => {
    const labels: Record<string, string> = {
        CONSERVATIVE: 'Conservateur',
        MODERATE: 'Modéré',
        BALANCED: 'Équilibré',
        GROWTH: 'Croissance',
        AGGRESSIVE: 'Agressif',
    };
    return labels[profile] || profile;
};

const getHorizonLabel = (horizon: string) => {
    const labels: Record<string, string> = {
        SHORT_TERM: 'Court terme (< 1 an)',
        MEDIUM_TERM: 'Moyen terme (1-5 ans)',
        LONG_TERM: 'Long terme (5-10 ans)',
        VERY_LONG_TERM: 'Très long terme (> 10 ans)',
    };
    return labels[horizon] || horizon;
};

export default function CompletionStep({ data, onComplete, onBack, isLoading }: CompletionStepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Récapitulatif de votre profil
                </h2>
                <p className="text-gray-600">
                    Vérifiez vos informations avant de finaliser
                </p>
            </div>

            {/* Summary Cards */}
            <div className="space-y-4">
                {/* Risk Profile */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-200 rounded-lg">
                            <Shield className="w-6 h-6 text-blue-700" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">Profil de risque</h3>
                            <p className="text-lg text-blue-900 font-medium">
                                {getRiskProfileLabel(data.risk_profile)}
                            </p>
                            {data.quiz_score && (
                                <p className="text-sm text-blue-700 mt-1">
                                    Score du quiz : {data.quiz_score}/100
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Investment Horizon */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-200 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-purple-700" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">Horizon d'investissement</h3>
                            <p className="text-lg text-purple-900 font-medium">
                                {getHorizonLabel(data.investment_horizon)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Favorite Sectors */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-200 rounded-lg">
                            <Users className="w-6 h-6 text-green-700" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">Secteurs favoris</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.favorite_sectors?.map((sector: string) => (
                                    <span
                                        key={sector}
                                        className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium"
                                    >
                                        {sector}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Privacy Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Confidentialité</h4>
                <div className="space-y-1 text-sm text-gray-600">
                    <p>• Portefeuille : <strong>{data.portfolio_visibility || 'Followers'}</strong></p>
                    <p>• Performances : <strong>{data.show_performance ? 'Visibles' : 'Masquées'}</strong></p>
                    <p>• Transactions : <strong>{data.show_transactions ? 'Visibles' : 'Masquées'}</strong></p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    🎉 <strong>Félicitations !</strong> Votre profil d'investisseur est prêt. Vous pourrez le modifier à tout moment depuis votre profil.
                </p>
            </div>

            <div className="flex justify-between pt-6">
                <button
                    onClick={onBack}
                    disabled={isLoading}
                    className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
                >
                    ← Retour
                </button>
                <button
                    onClick={onComplete}
                    disabled={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-medium flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Création en cours...
                        </>
                    ) : (
                        <>
                            Créer mon profil
                            <CheckCircle className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
