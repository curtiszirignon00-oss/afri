// src/components/profile/ProfileStats.tsx
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
    Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import { ShareButton, ShareModal } from '../share';
import { useShare } from '../../hooks/useShare';
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

    // Visibility settings from profile
    const showLevel = investorProfile?.show_level !== false;
    const showXp = investorProfile?.show_xp === true;
    const showStreak = investorProfile?.show_streak !== false;
    const showPortfolio = investorProfile?.show_portfolio !== false;

    // Stats from profile
    const level = investorProfile?.level || 1;
    const totalXp = investorProfile?.total_xp || 0;
    const currentStreak = investorProfile?.current_streak || 0;
    const longestStreak = investorProfile?.longest_streak || 0;

    // XP to next level (example formula: level * 100 XP per level)
    const xpForCurrentLevel = (level - 1) * 100;
    const xpForNextLevel = level * 100;
    const xpProgress = totalXp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercent = Math.min(100, (xpProgress / xpNeeded) * 100);

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
                    <Link
                        to="/profile/settings"
                        className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                        <Eye className="w-3 h-3" />
                        Visibilite
                    </Link>
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
                                    <span>Progression</span>
                                    <span>{Math.round(progressPercent)}%</span>
                                </div>
                                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 mt-1 text-right">
                                    {xpProgress} / {xpNeeded} XP
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

                {/* Achievements Preview */}
                {investorProfile?.badges && investorProfile.badges.length > 0 && (
                    <div className="pt-3 border-t">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Badges recents</span>
                            <Link
                                to="/profile/badges"
                                className="text-xs text-indigo-600 hover:text-indigo-700"
                            >
                                Voir tout
                            </Link>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {investorProfile.badges.slice(0, 5).map((badge: any, index: number) => (
                                <div
                                    key={index}
                                    className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center text-lg"
                                    title={badge.name || badge}
                                >
                                    {badge.icon || '🏆'}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={closeShareModal}
                shareData={shareData}
            />
        </Card>
    );
}
