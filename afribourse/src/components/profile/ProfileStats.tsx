// src/components/profile/ProfileStats.tsx
import { useState } from 'react';
import {
    Zap,
    Trophy,
    Flame,
    TrendingUp,
    BookOpen,
    Wallet,
    Eye,
    Lock,
    ChevronRight,
    Star,
    X,
    Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import { ShareButton, ShareModal } from '../share';
import { useShare } from '../../hooks/useShare';
import { useUpdatePrivacySettings } from '../../hooks/useOnboarding';
import { calculateLevelFromXP } from '../../hooks/useGamification';
import type { ShareablePortfolioData } from '../../types/share';

interface ProfileStatsProps {
    profile: any;
    isOwnProfile?: boolean;
    portfolioData?: {
        totalValue: number;
        gainLoss: number;
        gainLossPercent: number;
    } | null;
    learningProgress?: {
        completedModules: number;
        totalModules: number;
        completedQuizzes: number;
        averageScore: number;
    } | null;
}

// Format number with K/M suffixes
function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('fr-FR');
}

// Format currency
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
}

// Get level color based on level
function getLevelColor(level: number): string {
    if (level >= 50) return 'from-yellow-400 to-amber-500'; // Legendary
    if (level >= 30) return 'from-purple-400 to-indigo-500'; // Epic
    if (level >= 20) return 'from-blue-400 to-cyan-500'; // Rare
    if (level >= 10) return 'from-green-400 to-emerald-500'; // Uncommon
    return 'from-gray-400 to-gray-500'; // Common
}

// Get level title
function getLevelTitle(level: number): string {
    if (level >= 50) return 'Legendaire';
    if (level >= 40) return 'Maitre';
    if (level >= 30) return 'Expert';
    if (level >= 20) return 'Avance';
    if (level >= 10) return 'Intermediaire';
    if (level >= 5) return 'Apprenti';
    return 'Debutant';
}

export default function ProfileStats({
    profile,
    isOwnProfile = false,
    portfolioData,
    learningProgress
}: ProfileStatsProps) {
    const investorProfile = profile.investorProfile;
    const { isShareModalOpen, shareData, openShareModal, closeShareModal } = useShare();
    const [showVisibilityModal, setShowVisibilityModal] = useState(false);

    // Visibility settings from profile
    const showLevel = investorProfile?.show_level !== false;
    const showXp = investorProfile?.show_xp === true;
    const showStreak = investorProfile?.show_streak !== false;
    const showPortfolio = investorProfile?.show_portfolio_value !== false;

    // Stats from profile
    const totalXp = investorProfile?.total_xp || 0;
    const currentStreak = investorProfile?.current_streak || 0;
    const longestStreak = investorProfile?.longest_streak || 0;

    // Recalculer le niveau à partir du XP total pour éviter les incohérences
    const level = calculateLevelFromXP(totalXp);

    // Formule Duolingo-style: seuil niveau N = 50 * N * (N + 1)
    const getXPRequired = (n: number) => 50 * n * (n + 1);
    const xpLevelStart = level <= 1 ? 0 : getXPRequired(level);
    const xpLevelEnd = getXPRequired(level + 1);
    const xpProgress = Math.max(0, totalXp - xpLevelStart);
    const xpNeeded = xpLevelEnd - xpLevelStart;
    const progressPercent = xpNeeded > 0 ? Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100)) : 0;

    // Blur class for hidden values
    const blurClass = 'blur-sm select-none';

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Progression
                </h3>
                {isOwnProfile && (
                    <button
                        onClick={() => setShowVisibilityModal(true)}
                        className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                        <Eye className="w-3 h-3" />
                        Visibilite
                    </button>
                )}
            </div>

            <div className="space-y-5">
                {/* Level & XP Section */}
                <div className="relative">
                    {!showLevel && !isOwnProfile ? (
                        <div className="flex items-center justify-center py-4 bg-gray-50 rounded-xl">
                            <Lock className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-500">Information privee</span>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getLevelColor(level)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                        {level}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">Niveau {level}</div>
                                        <div className="text-sm text-gray-600">{getLevelTitle(level)}</div>
                                    </div>
                                </div>
                                {(showXp || isOwnProfile) && (
                                    <div className="text-right">
                                        <div className={`flex items-center gap-1 ${!showXp && !isOwnProfile ? blurClass : ''}`}>
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            <span className="font-bold text-gray-900">{formatNumber(totalXp)}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">XP total</div>
                                    </div>
                                )}
                            </div>

                            {/* Progress bar to next level */}
                            <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Niveau {level + 1}</span>
                                    <span>{Math.round(progressPercent)}%</span>
                                </div>
                                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>{formatNumber(totalXp)} XP</span>
                                    <span>{formatNumber(xpLevelEnd)} XP</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Streak Section */}
                <div className="relative">
                    {!showStreak && !isOwnProfile ? (
                        <div className="flex items-center justify-center py-4 bg-gray-50 rounded-xl">
                            <Lock className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-500">Information privee</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentStreak > 0 ? 'bg-orange-500' : 'bg-gray-300'}`}>
                                    <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-white' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">
                                        {currentStreak} jour{currentStreak > 1 ? 's' : ''}
                                    </div>
                                    <div className="text-xs text-gray-600">Streak actuel</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-500" />
                                    <span className="font-bold text-gray-900">{longestStreak}</span>
                                </div>
                                <div className="text-xs text-gray-500">Record</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Learning Progress */}
                {learningProgress && (
                    <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-gray-900">Apprentissage</span>
                            </div>
                            <Link
                                to="/learn"
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                Continuer
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/60 rounded-lg p-3">
                                <div className="text-2xl font-bold text-blue-600">
                                    {learningProgress.completedModules}/{learningProgress.totalModules}
                                </div>
                                <div className="text-xs text-gray-600">Modules completes</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                                <div className="text-2xl font-bold text-green-600">
                                    {learningProgress.averageScore}%
                                </div>
                                <div className="text-xs text-gray-600">Score moyen quiz</div>
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3">
                            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                    style={{ width: `${(learningProgress.completedModules / learningProgress.totalModules) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Portfolio Value */}
                {portfolioData && (
                    <div className="relative">
                        {!showPortfolio && !isOwnProfile ? (
                            <div className="flex items-center justify-center py-4 bg-gray-50 rounded-xl">
                                <Lock className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-500">Portefeuille prive</span>
                            </div>
                        ) : (
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-green-600" />
                                        <span className="font-medium text-gray-900">Portefeuille virtuel</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isOwnProfile && showPortfolio && (
                                            <ShareButton
                                                onClick={() => {
                                                    const shareDataObj: ShareablePortfolioData = {
                                                        totalValue: portfolioData.totalValue,
                                                        gainLoss: portfolioData.gainLoss,
                                                        gainLossPercent: portfolioData.gainLossPercent,
                                                        cashBalance: 0,
                                                        stocksValue: portfolioData.totalValue,
                                                    };
                                                    openShareModal({
                                                        type: 'PORTFOLIO_VALUE',
                                                        data: shareDataObj,
                                                        generatedContent: '',
                                                    });
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                label=""
                                            />
                                        )}
                                        <Link
                                            to="/dashboard"
                                            className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                                        >
                                            Voir
                                            <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(portfolioData.totalValue)}
                                        </div>
                                        <div className="text-xs text-gray-500">Valeur totale</div>
                                    </div>
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${portfolioData.gainLoss >= 0
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}>
                                        <TrendingUp className={`w-4 h-4 ${portfolioData.gainLoss < 0 ? 'rotate-180' : ''}`} />
                                        <span className="font-medium text-sm">
                                            {portfolioData.gainLoss >= 0 ? '+' : ''}{portfolioData.gainLossPercent.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={closeShareModal}
                shareData={shareData}
            />

            {/* Visibility Settings Modal */}
            {showVisibilityModal && (
                <VisibilitySettingsModal
                    investorProfile={investorProfile}
                    onClose={() => setShowVisibilityModal(false)}
                />
            )}
        </Card>
    );
}

// ============= Visibility Settings Modal =============

interface VisibilitySettingsModalProps {
    investorProfile: any;
    onClose: () => void;
}

function VisibilitySettingsModal({ investorProfile, onClose }: VisibilitySettingsModalProps) {
    const { mutate: updatePrivacy, isPending } = useUpdatePrivacySettings();

    const [settings, setSettings] = useState({
        show_level: investorProfile?.show_level ?? true,
        show_xp: investorProfile?.show_xp ?? false,
        show_streak: investorProfile?.show_streak ?? true,
        show_portfolio_value: investorProfile?.show_portfolio_value ?? true,
        show_positions: investorProfile?.show_positions ?? true,
        show_watchlist: investorProfile?.show_watchlist ?? true,
        show_badges: investorProfile?.show_badges ?? true,
        show_rank: investorProfile?.show_rank ?? true,
        show_bio: investorProfile?.show_bio ?? true,
        show_country: investorProfile?.show_country ?? true,
    });

    const toggleGroups: { title: string; toggles: { key: keyof typeof settings; label: string; description?: string }[] }[] = [
        {
            title: 'Informations personnelles',
            toggles: [
                { key: 'show_bio', label: 'Bio' },
                { key: 'show_country', label: 'Pays' },
            ],
        },
        {
            title: 'Progression',
            toggles: [
                { key: 'show_level', label: 'Niveau' },
                { key: 'show_xp', label: 'XP total' },
                { key: 'show_streak', label: 'Streak' },
                { key: 'show_rank', label: 'Classement' },
                { key: 'show_badges', label: 'Badges' },
            ],
        },
        {
            title: 'Portefeuille',
            toggles: [
                { key: 'show_portfolio_value', label: 'Valeur du portefeuille', description: 'Montant total et performance' },
                { key: 'show_positions', label: 'Actions achetees', description: 'Positions ouvertes dans le portefeuille' },
                { key: 'show_watchlist', label: 'Actions suivies', description: 'Votre liste de surveillance' },
            ],
        },
    ];

    const handleSave = () => {
        updatePrivacy(settings, {
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-indigo-600" />
                        Visibilite du profil
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-gray-500 mb-2">
                        Choisissez les informations visibles par les autres utilisateurs.
                    </p>
                    {toggleGroups.map((group) => (
                        <div key={group.title}>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-3">
                                {group.title}
                            </h4>
                            <div className="space-y-0.5">
                                {group.toggles.map(({ key, label, description }) => (
                                    <label
                                        key={key}
                                        className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                                    >
                                        <div className="flex-1 mr-3">
                                            <span className="text-sm font-medium text-gray-700">{label}</span>
                                            {description && (
                                                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={settings[key]}
                                            onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                                                settings[key] ? 'bg-indigo-600' : 'bg-gray-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                    settings[key] ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-5 border-t">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
}
