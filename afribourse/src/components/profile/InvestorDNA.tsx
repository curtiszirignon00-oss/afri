// src/components/profile/InvestorDNA.tsx
import { Shield, TrendingUp, Target, Clock, Briefcase, PieChart } from 'lucide-react';

// ─── Helpers v2 ──────────────────────────────────────────────────────────────

function getProfileLabel(score: number): string {
    if (score < 30) return 'Investisseur Prudent';
    if (score < 50) return 'Investisseur Modéré';
    if (score < 70) return 'Investisseur Équilibré';
    if (score < 85) return 'Investisseur Dynamique';
    return 'Investisseur Avisé';
}

const GOAL_LABELS: Record<string, string> = {
    education: 'Objectif : Éducation',
    immo:      'Objectif : Immobilier',
    retraite:  'Objectif : Retraite',
    business:  'Objectif : Entrepreneuriat',
    epargne:   'Objectif : Épargne',
};
function getGoalLabel(goal: string): string {
    return GOAL_LABELS[goal] ?? 'Objectif personnel';
}

const ALLOC_COLORS = ['#1D9E75', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

interface AllocationItem {
    sector: string;
    pct: number;
    tickers: string[];
    rationale?: string;
}

// ─── ScoreRing SVG ────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
    const r = 26;
    const circ = 2 * Math.PI * r;
    const filled = (score / 100) * circ;
    return (
        <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
                <circle
                    cx="32" cy="32" r={r}
                    fill="none" stroke="#1D9E75" strokeWidth="6"
                    strokeDasharray={`${filled} ${circ}`}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-600">{score}</span>
            </div>
        </div>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvestorDNAProps {
    profile: any;
    isOwnProfile?: boolean;
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

// Secteurs officiels BRVM
const sectorColors: Record<string, string> = {
    'Consommation Discrétionnaire': 'bg-purple-100 text-purple-700 border-purple-200',
    'Consommation de Base':         'bg-green-100 text-green-700 border-green-200',
    'Énergie':                      'bg-amber-100 text-amber-700 border-amber-200',
    'Industriels':                  'bg-gray-100 text-gray-700 border-gray-200',
    'Services Financiers':          'bg-blue-100 text-blue-700 border-blue-200',
    'Services Publics':             'bg-cyan-100 text-cyan-700 border-cyan-200',
    'Télécommunications':           'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export default function InvestorDNA({ profile, isOwnProfile = false }: InvestorDNAProps) {
    const investorProfile = profile.investorProfile;

    if (!investorProfile || !investorProfile.onboarding_completed) {
        // Si c'est le profil d'un autre utilisateur, ne pas afficher la section
        if (!isOwnProfile) {
            return null;
        }
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
                {/* Score investisseur (v2) */}
                {investorProfile.investor_score != null && (
                    <div className="flex items-center gap-4 p-4 border-b border-gray-100">
                        <ScoreRing score={investorProfile.investor_score} />
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Score investisseur</p>
                            <p className="font-semibold text-gray-900">{getProfileLabel(investorProfile.investor_score)}</p>
                            {investorProfile.life_goal && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                                    {getGoalLabel(investorProfile.life_goal)}
                                </span>
                            )}
                        </div>
                    </div>
                )}

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

                {/* Répartition sectorielle Simba (v2) */}
                {investorProfile.allocation_json && Array.isArray(investorProfile.allocation_json) && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <PieChart className="w-4 h-4 text-gray-400" />
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Répartition sectorielle</p>
                        </div>
                        <div className="space-y-3">
                            {(investorProfile.allocation_json as AllocationItem[]).map((item, idx) => (
                                <div key={item.sector}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700">{item.sector}</span>
                                        <span className="font-medium text-gray-900">{item.pct}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${item.pct}%`,
                                                backgroundColor: ALLOC_COLORS[idx % ALLOC_COLORS.length],
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{item.tickers.join(' · ')}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-3 italic">
                            * Répartition éducative générée par Simba. Données historiques BRVM.
                            Ne constitue pas un conseil en investissement.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
