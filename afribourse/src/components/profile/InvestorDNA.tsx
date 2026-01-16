// src/components/profile/InvestorDNA.tsx
import { Shield, TrendingUp, Target, Building2, Clock, Briefcase, PieChart } from 'lucide-react';

interface InvestorDNAProps {
    profile: any;
}

const riskProfileConfig: Record<string, { label: string; color: string; bgColor: string; textColor: string; icon: any }> = {
    CONSERVATIVE: { label: 'Conservateur', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-700', icon: Shield },
    MODERATE: { label: 'Modéré', color: 'emerald', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', icon: TrendingUp },
    BALANCED: { label: 'Équilibré', color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-700', icon: Target },
    GROWTH: { label: 'Croissance', color: 'amber', bgColor: 'bg-amber-50', textColor: 'text-amber-700', icon: TrendingUp },
    AGGRESSIVE: { label: 'Agressif', color: 'rose', bgColor: 'bg-rose-50', textColor: 'text-rose-700', icon: TrendingUp },
};

const horizonConfig: Record<string, { label: string; description: string }> = {
    SHORT_TERM: { label: 'Court terme', description: '< 1 an' },
    MEDIUM_TERM: { label: 'Moyen terme', description: '1-5 ans' },
    LONG_TERM: { label: 'Long terme', description: '5-10 ans' },
    VERY_LONG_TERM: { label: 'Très long terme', description: '> 10 ans' },
};

const sectorColors: Record<string, string> = {
    'Technologie': 'bg-blue-100 text-blue-700 border-blue-200',
    'Finance': 'bg-green-100 text-green-700 border-green-200',
    'Santé': 'bg-red-100 text-red-700 border-red-200',
    'Énergie': 'bg-amber-100 text-amber-700 border-amber-200',
    'Industrie': 'bg-gray-100 text-gray-700 border-gray-200',
    'Consommation': 'bg-pink-100 text-pink-700 border-pink-200',
    'Immobilier': 'bg-purple-100 text-purple-700 border-purple-200',
    'Télécoms': 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export default function InvestorDNA({ profile }: InvestorDNAProps) {
    const investorProfile = profile.investorProfile;

    if (!investorProfile || !investorProfile.onboarding_completed) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">ADN Investisseur</h3>
                </div>
                <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">Profil non complété</p>
                    <a href="/onboarding" className="text-blue-600 text-sm font-medium hover:underline mt-2 inline-block">
                        Compléter mon profil →
                    </a>
                </div>
            </div>
        );
    }

    const riskConfig = riskProfileConfig[investorProfile.risk_profile] || riskProfileConfig.MODERATE;
    const RiskIcon = riskConfig.icon;
    const horizonData = horizonConfig[investorProfile.investment_horizon];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">ADN Investisseur</h3>
                        <p className="text-white/70 text-sm">Votre profil d'investissement</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {/* Risk Profile - Featured Card */}
                <div className={`${riskConfig.bgColor} rounded-xl p-4 border border-${riskConfig.color}-100`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 ${riskConfig.bgColor} rounded-xl flex items-center justify-center border border-${riskConfig.color}-200`}>
                                <RiskIcon className={`w-6 h-6 ${riskConfig.textColor}`} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Profil de risque</p>
                                <p className={`text-lg font-bold ${riskConfig.textColor}`}>{riskConfig.label}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Investment Horizon */}
                {horizonData && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Horizon d'investissement</p>
                            <p className="font-semibold text-gray-900">{horizonData.label}</p>
                            <p className="text-sm text-gray-500">{horizonData.description}</p>
                        </div>
                    </div>
                )}

                {/* Investment Style */}
                {investorProfile.investment_style && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-teal-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Style d'investissement</p>
                            <p className="font-semibold text-gray-900">{investorProfile.investment_style}</p>
                        </div>
                    </div>
                )}

                {/* Favorite Sectors */}
                {investorProfile.favorite_sectors && investorProfile.favorite_sectors.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Secteurs favoris</p>
                        <div className="flex flex-wrap gap-2">
                            {investorProfile.favorite_sectors.map((sector: string) => (
                                <span
                                    key={sector}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${sectorColors[sector] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                                >
                                    {sector}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
