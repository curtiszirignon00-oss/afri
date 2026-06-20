// src/components/profile/ProfileStats.tsx
import { useState } from 'react';
import {
    Zap,
    Trophy,
    Flame,
    TrendingUp,
    TrendingDown,
    BookOpen,
    Wallet,
    Eye,
    EyeOff,
    Lock,
    ChevronRight,
    Star,
    X,
    Loader2,
    Bookmark,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card } from '../ui';
import { ShareButton, ShareModal } from '../share';
import { useShare } from '../../hooks/useShare';
import { useUpdatePrivacySettings } from '../../hooks/useOnboarding';
import { calculateLevelFromXP } from '../../hooks/useGamification';
import type { ShareablePortfolioData } from '../../types/share';

interface PositionItem {
    ticker: string;
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    value: number;
    gainLoss: number;
    gainLossPercent: number;
}

interface WatchlistItem {
    ticker: string;
    addedAt: string;
}

interface ProfileStatsProps {
    profile: any;
    isOwnProfile?: boolean;
    portfolioData?: {
        totalValue: number;
        gainLoss: number;
        gainLossPercent: number;
        /** Liquidités disponibles (cash) — affichées dans le résumé condensé. */
        cashBalance?: number;
        /** Série de valeurs pour la sparkline (évolution du portefeuille). */
        history?: number[];
    } | null;
    positions?: PositionItem[];
    watchlist?: WatchlistItem[];
    learningProgress?: {
        completedModules: number;
        totalModules: number;
        completedQuizzes: number;
        averageScore: number;
    } | null;
}

// Mini-courbe SVG sans axes (sparkline) pour l'évolution du portefeuille virtuel.
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
    if (!data || data.length < 2) return null;
    const w = 120;
    const h = 36;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data
        .map((v, i) => {
            const x = (i / (data.length - 1)) * w;
            const y = h - ((v - min) / range) * h;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    const stroke = positive ? '#16a34a' : '#dc2626';
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" preserveAspectRatio="none">
            <polyline points={points} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
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
    if (level >= 50) return 'Légendaire';
    if (level >= 40) return 'Maître';
    if (level >= 30) return 'Expert';
    if (level >= 20) return 'Avancé';
    if (level >= 10) return 'Intermédiaire';
    if (level >= 5) return 'Apprenti';
    return 'Débutant';
}

export default function ProfileStats({
    profile,
    isOwnProfile = false,
    portfolioData,
    positions = [],
    watchlist = [],
    learningProgress
}: ProfileStatsProps) {
    const investorProfile = profile.investorProfile;
    const { isShareModalOpen, shareData, openShareModal, closeShareModal } = useShare();
    const [showVisibilityModal, setShowVisibilityModal] = useState(false);

    // Visibility settings from profile
    // Pour les autres utilisateurs, les flags show_* viennent du backend
    // Pour son propre profil, ils viennent du investorProfile complet
    const showLevel = investorProfile?.show_level !== false;
    const showXp = investorProfile?.show_xp === true;
    const showStreak = investorProfile?.show_streak !== false;
    const showPortfolio = investorProfile?.show_portfolio_value !== false;
    const showWatchlist = investorProfile?.show_watchlist !== false;

    // Stats from profile
    const totalXp = investorProfile?.total_xp || 0;
    const currentStreak = investorProfile?.current_streak || 0;
    const longestStreak = investorProfile?.longest_streak || 0;

    // Utiliser le niveau de l'API si disponible, sinon recalculer depuis XP
    const level = investorProfile?.level || calculateLevelFromXP(totalXp);

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
                        Visibilité
                    </button>
                )}
            </div>

            <div className="space-y-5">
                {/* Level & XP Section */}
                <div className="relative">
                    {!showLevel && !isOwnProfile ? (
                        <div className="flex items-center justify-center py-4 bg-gray-50 rounded-xl">
                            <Lock className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-500">Information privée</span>
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
                                    <span>Prochain : Niv. {level + 1}</span>
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
                            <span className="text-sm text-gray-500">Information privée</span>
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
                                <div className="text-xs text-gray-600">Modules complétés</div>
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

                {/* Performance simulée (résumé condensé — pas de tableau de positions) */}
                {portfolioData && (
                    <div className="relative">
                        {!showPortfolio && !isOwnProfile ? (
                            <div className="flex items-center justify-center py-4 bg-gray-50 rounded-xl">
                                <Lock className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-500">Portefeuille privé</span>
                            </div>
                        ) : (
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-green-600" />
                                        <span className="font-medium text-gray-900">Performance simulée</span>
                                    </div>
                                    {isOwnProfile && showPortfolio && (
                                        <ShareButton
                                            onClick={() => {
                                                const shareDataObj: ShareablePortfolioData = {
                                                    totalValue: portfolioData.totalValue,
                                                    gainLoss: portfolioData.gainLoss,
                                                    gainLossPercent: portfolioData.gainLossPercent,
                                                    cashBalance: portfolioData.cashBalance ?? 0,
                                                    stocksValue: portfolioData.totalValue - (portfolioData.cashBalance ?? 0),
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
                                </div>

                                {/* Chiffre principal + ROI + sparkline */}
                                <div className="flex items-end justify-between gap-3">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(portfolioData.totalValue)}
                                        </div>
                                        <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${portfolioData.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {portfolioData.gainLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            <span>{portfolioData.gainLoss >= 0 ? '+' : ''}{portfolioData.gainLossPercent.toFixed(2)}%</span>
                                            <span className="text-gray-400">·</span>
                                            <span>{portfolioData.gainLoss >= 0 ? '+' : ''}{formatCurrency(portfolioData.gainLoss)}</span>
                                        </div>
                                    </div>
                                    {portfolioData.history && portfolioData.history.length >= 2 && (
                                        <Sparkline data={portfolioData.history} positive={portfolioData.gainLoss >= 0} />
                                    )}
                                </div>

                                {/* Deux métriques : liquidités + nombre de positions */}
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className="bg-white/60 rounded-lg px-3 py-2">
                                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(portfolioData.cashBalance ?? 0)}</div>
                                        <div className="text-xs text-gray-500">Liquidités</div>
                                    </div>
                                    <div className="bg-white/60 rounded-lg px-3 py-2">
                                        <div className="text-sm font-semibold text-gray-900">{positions.length}</div>
                                        <div className="text-xs text-gray-500">Position{positions.length > 1 ? 's' : ''}</div>
                                    </div>
                                </div>

                                <Link
                                    to="/dashboard"
                                    className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800"
                                >
                                    Voir le détail sur le Dashboard
                                    <ChevronRight className="w-3 h-3" />
                                </Link>
                                <p className="mt-2 text-[11px] text-gray-400 leading-snug">
                                    Portefeuille virtuel · simulation pédagogique. Ne reflète pas une performance réelle.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Watchlist (Actions suivies) */}
                {(watchlist.length > 0 || (!isOwnProfile && !showWatchlist)) && (
                    <div className="relative">
                        {!showWatchlist && !isOwnProfile ? (
                            <div className="flex items-center justify-center py-4 bg-gray-50 rounded-xl">
                                <Lock className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-500">Watchlist privée</span>
                            </div>
                        ) : watchlist.length > 0 ? (
                            <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Bookmark className="w-5 h-5 text-amber-600" />
                                        <span className="font-medium text-gray-900">Actions suivies</span>
                                    </div>
                                    {isOwnProfile && (
                                        <Link
                                            to="/markets"
                                            className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                                        >
                                            Marché
                                            <ChevronRight className="w-3 h-3" />
                                        </Link>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {watchlist.slice(0, 8).map((item) => (
                                        <Link
                                            key={item.ticker}
                                            to={`/markets?ticker=${item.ticker}`}
                                            className="inline-flex items-center px-3 py-1.5 bg-white/70 hover:bg-white rounded-lg text-sm font-medium text-gray-700 border border-amber-200 hover:border-amber-400 transition-colors cursor-pointer"
                                        >
                                            {item.ticker}
                                        </Link>
                                    ))}
                                    {watchlist.length > 8 && (
                                        <span className="inline-flex items-center px-3 py-1.5 text-xs text-amber-600 font-medium">
                                            +{watchlist.length - 8} autres
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : null}
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
                { key: 'show_positions', label: 'Actions achetées', description: 'Positions ouvertes dans le portefeuille' },
                { key: 'show_watchlist', label: 'Actions suivies', description: 'Votre liste de surveillance' },
            ],
        },
    ];

    const handleSave = () => {
        updatePrivacy(settings, {
            onSuccess: () => {
                toast.success('Paramètres de visibilité mis à jour');
                onClose();
            },
            onError: () => {
                toast.error('Erreur lors de la mise a jour');
            },
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
                        Visibilité du profil
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
