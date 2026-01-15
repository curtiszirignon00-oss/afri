// src/components/profile/InvestorDNA.tsx
import { Shield, TrendingUp, Target, Building2 } from 'lucide-react';
import { Card } from '../ui';

interface InvestorDNAProps {
    profile: any;
}

const riskProfileConfig: Record<string, { label: string; color: string; icon: any }> = {
    CONSERVATIVE: { label: 'Conservateur', color: 'blue', icon: Shield },
    MODERATE: { label: 'Modéré', color: 'green', icon: TrendingUp },
    BALANCED: { label: 'Équilibré', color: 'purple', icon: Target },
    GROWTH: { label: 'Croissance', color: 'orange', icon: TrendingUp },
    AGGRESSIVE: { label: 'Agressif', color: 'red', icon: TrendingUp },
};

const horizonConfig: Record<string, string> = {
    SHORT_TERM: '< 1 an',
    MEDIUM_TERM: '1-5 ans',
    LONG_TERM: '5-10 ans',
    VERY_LONG_TERM: '> 10 ans',
};

export default function InvestorDNA({ profile }: InvestorDNAProps) {
    const investorProfile = profile.investorProfile;

    if (!investorProfile || !investorProfile.onboarding_completed) {
        return (
            <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">ADN Investisseur</h3>
                <p className="text-sm text-gray-600">
                    Profil non complété
                </p>
            </Card>
        );
    }

    const riskConfig = riskProfileConfig[investorProfile.risk_profile] || riskProfileConfig.MODERATE;
    const RiskIcon = riskConfig.icon;

    return (
        <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                ADN Investisseur
            </h3>

            <div className="space-y-4">
                {/* Risk Profile */}
                <div>
                    <div className="text-sm text-gray-600 mb-2">Profil de risque</div>
                    <div className={`flex items-center gap-2 p-3 bg-${riskConfig.color}-50 rounded-lg`}>
                        <RiskIcon className={`w-5 h-5 text-${riskConfig.color}-600`} />
                        <span className={`font-medium text-${riskConfig.color}-900`}>
                            {riskConfig.label}
                        </span>
                    </div>
                </div>

                {/* Investment Horizon */}
                {investorProfile.investment_horizon && (
                    <div>
                        <div className="text-sm text-gray-600 mb-2">Horizon d'investissement</div>
                        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600" />
                            <span className="font-medium text-purple-900">
                                {horizonConfig[investorProfile.investment_horizon]}
                            </span>
                        </div>
                    </div>
                )}

                {/* Favorite Sectors */}
                {investorProfile.favorite_sectors && investorProfile.favorite_sectors.length > 0 && (
                    <div>
                        <div className="text-sm text-gray-600 mb-2">Secteurs favoris</div>
                        <div className="flex flex-wrap gap-2">
                            {investorProfile.favorite_sectors.map((sector: string) => (
                                <span
                                    key={sector}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                >
                                    {sector}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Investment Style */}
                {investorProfile.investment_style && (
                    <div>
                        <div className="text-sm text-gray-600 mb-2">Style d'investissement</div>
                        <div className="text-gray-900 font-medium">
                            {investorProfile.investment_style}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
