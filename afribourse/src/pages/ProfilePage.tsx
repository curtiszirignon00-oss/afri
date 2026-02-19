// src/pages/ProfilePage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useSyncSocialStats } from '../hooks/useOnboarding';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import ProfileHeader from '../components/profile/ProfileHeader';
import InvestorDNA from '../components/profile/InvestorDNA';
import SocialStats from '../components/profile/SocialStats';
import ProfileStats from '../components/profile/ProfileStats';
import ActivityFeed from '../components/profile/ActivityFeed';
import CreateCommunityModal from '../components/community/CreateCommunityModal';
import { Loader2, ArrowLeft, Users, Plus, Trophy, Snowflake } from 'lucide-react';

// Gamification imports
import { useMyAchievements, useStreak } from '../hooks/useGamification';
import { AchievementCard, StreakFreezeIndicator, NextAchievements } from '../components/gamification';
import BadgeShareModal from '../components/share/BadgeShareModal';
import type { Achievement } from '../types';

export default function ProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { userProfile } = useAuth();
    const { mutate: syncStats } = useSyncSocialStats();
    const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
    const [sharingBadge, setSharingBadge] = useState<Achievement | null>(null);

    // Partager un badge (ouvre le modal de partage social)
    const handleShareBadge = (achievement: Achievement) => {
        setSharingBadge(achievement);
    };

    // Determiner si c'est son propre profil
    const isLoggedIn = !!userProfile?.id;
    const isOwnProfile = !userId || userId === userProfile?.id;

    // Gamification hooks (only for own profile - hooks doivent toujours etre appeles)
    const { data: myAchievements } = useMyAchievements();
    const { data: streakData } = useStreak();

    // Recuperer son propre profil investisseur (SEULEMENT si c'est son profil ET connecte)
    const { data: investorProfile, isLoading: isLoadingOwn, error: errorOwn } = useQuery({
        queryKey: ['investor-profile'],
        queryFn: async () => {
            const response = await apiClient.get('/investor-profile');
            return response.data.data;
        },
        enabled: isOwnProfile && isLoggedIn,
    });

    // Recuperer le profil public d'un autre utilisateur
    const { data: otherUserProfile, isLoading: isLoadingOther, error: errorOther } = useQuery({
        queryKey: ['public-profile', userId],
        queryFn: async () => {
            const response = await apiClient.get(`/profile/${userId}`);
            return response.data;
        },
        enabled: !!userId && !isOwnProfile,
    });

    // Etats combines
    const isLoading = isOwnProfile ? isLoadingOwn : isLoadingOther;

    // Fetch portfolio data (only for own profile)
    const { data: portfolioData } = useQuery({
        queryKey: ['portfolio-summary', userId || userProfile?.id],
        queryFn: async () => {
            try {
                const response = await apiClient.get('/portfolios/summary');
                return response.data.data;
            } catch {
                return null;
            }
        },
        enabled: isOwnProfile && !!userProfile?.id,
    });

    // Fetch watchlist (only for own profile)
    const { data: watchlistData } = useQuery({
        queryKey: ['watchlist-my'],
        queryFn: async () => {
            try {
                const response = await apiClient.get('/watchlist/my');
                return response.data.data || response.data;
            } catch {
                return null;
            }
        },
        enabled: isOwnProfile && !!userProfile?.id,
    });

    // Fetch learning progress
    const { data: learningData } = useQuery({
        queryKey: ['learning-progress', userId || userProfile?.id],
        queryFn: async () => {
            try {
                const response = await apiClient.get('/learning-modules/progress/summary');
                return response.data.data;
            } catch {
                return null;
            }
        },
        enabled: isOwnProfile && !!userProfile?.id,
    });

    useEffect(() => {
        if (isOwnProfile && !isLoading && investorProfile) {
            // Sync stats en arrière-plan et rafraîchir le profil
            syncStats(undefined, {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['investor-profile'] });
                },
            });
        }
    }, [isOwnProfile, isLoading]);

    // Garde : si c'est "son propre profil" mais pas connecte, rediriger
    if (isOwnProfile && !isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Connexion requise</h2>
                    <p className="text-gray-600 mb-6">Connectez-vous pour voir votre profil.</p>
                    <a
                        href="/login"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        Se connecter
                    </a>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Gestion des erreurs : propre profil (connecte + onboarding non complete)
    if (isOwnProfile && isLoggedIn && (errorOwn || !investorProfile)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Profil non configure</h2>
                    <p className="text-gray-600 mb-6">
                        Vous n'avez pas encore complete votre profil investisseur.
                    </p>
                    <a
                        href="/onboarding"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        Completer mon profil
                    </a>
                </div>
            </div>
        );
    }

    // Gestion des erreurs : profil d'un autre utilisateur introuvable
    if (!isOwnProfile && (errorOther || !otherUserProfile)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Profil non trouve</h2>
                    <p className="text-gray-600 mb-6">
                        Ce profil n'existe pas ou n'est pas accessible.
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    // Créer un objet profile compatible avec les composants
    // Différent selon qu'on consulte son propre profil ou celui d'un autre
    const profileData = isOwnProfile
        ? {
            id: userProfile?.id || 'current-user',
            name: userProfile?.name || 'Utilisateur',
            lastname: userProfile?.lastname || '',
            email: userProfile?.email || 'user@africbourse.com',
            created_at: investorProfile?.created_at || new Date().toISOString(),
            investorProfile: investorProfile,
            stats: {
                followers_count: investorProfile?.followers_count || 0,
                following_count: investorProfile?.following_count || 0,
                posts_count: investorProfile?.posts_count || 0,
                portfolios_count: 0,
            },
            role: userProfile?.role || 'user',
            profile: {
                username: investorProfile?.username || userProfile?.email?.split('@')[0] || 'user',
                bio: investorProfile?.bio || '',
                avatar_url: investorProfile?.avatar_url || null,
                banner_url: investorProfile?.banner_url || null,
                country: investorProfile?.country || null,
                verified_investor: investorProfile?.verified_investor || false,
                social_links: investorProfile?.social_links || null,
                followers_count: investorProfile?.followers_count || 0,
                following_count: investorProfile?.following_count || 0,
                posts_count: investorProfile?.posts_count || 0,
            },
        }
        : {
            // Profil d'un autre utilisateur (données de l'API /profile/:userId)
            id: otherUserProfile?.userId || userId || '',
            name: otherUserProfile?.user?.name || otherUserProfile?.name || 'Utilisateur',
            lastname: otherUserProfile?.user?.lastname || otherUserProfile?.lastname || '',
            email: '', // Non accessible pour les autres profils
            created_at: otherUserProfile?.created_at || new Date().toISOString(),
            investorProfile: otherUserProfile, // Données du profil public
            isFollowing: otherUserProfile?.isFollowing || false,
            stats: {
                followers_count: otherUserProfile?.followersCount || otherUserProfile?.followers_count || 0,
                following_count: otherUserProfile?.followingCount || otherUserProfile?.following_count || 0,
                posts_count: otherUserProfile?.posts_count || 0,
                portfolios_count: 0,
            },
            role: otherUserProfile?.user?.role || 'user',
            profile: {
                username: otherUserProfile?.username || 'user',
                bio: otherUserProfile?.bio || '',
                avatar_url: otherUserProfile?.avatar_url || null,
                banner_url: otherUserProfile?.banner_url || null,
                country: otherUserProfile?.country || null,
                verified_investor: otherUserProfile?.verified_investor || false,
                social_links: otherUserProfile?.social_links || null,
                followers_count: otherUserProfile?.followersCount || otherUserProfile?.followers_count || 0,
                following_count: otherUserProfile?.followingCount || otherUserProfile?.following_count || 0,
                posts_count: otherUserProfile?.posts_count || 0,
                level: otherUserProfile?.level || 1,
                total_xp: otherUserProfile?.total_xp || 0,
            },
        };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Bouton Retour */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Retour</span>
                    </button>
                </div>
            </div>

            {/* Profile Header */}
            <ProfileHeader profile={profileData} isOwnProfile={isOwnProfile} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Investor DNA & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Progression Stats (XP, Level, Streak, Portfolio) */}
                        <ProfileStats
                            profile={profileData}
                            isOwnProfile={isOwnProfile}
                            portfolioData={
                                isOwnProfile
                                    ? (portfolioData ? {
                                        totalValue: portfolioData.totalValue || portfolioData.total_value || 0,
                                        gainLoss: portfolioData.gainLoss || portfolioData.gain_loss || 0,
                                        gainLossPercent: portfolioData.gainLossPercent || portfolioData.gain_loss_percent || 0,
                                    } : null)
                                    : (otherUserProfile?.portfolioStats || null)
                            }
                            positions={
                                isOwnProfile
                                    ? (portfolioData?.positions || [])
                                    : (otherUserProfile?.positions || [])
                            }
                            watchlist={
                                isOwnProfile
                                    ? (watchlistData ? (Array.isArray(watchlistData) ? watchlistData : []).map((item: any) => ({
                                        ticker: item.stock_ticker || item.ticker,
                                        addedAt: item.created_at || item.addedAt,
                                    })) : [])
                                    : (otherUserProfile?.watchlist || [])
                            }
                            learningProgress={learningData ? {
                                completedModules: learningData.completedModules || learningData.completed_modules || 0,
                                totalModules: learningData.totalModules || learningData.total_modules || 10,
                                completedQuizzes: learningData.completedQuizzes || learningData.completed_quizzes || 0,
                                averageScore: learningData.averageScore || learningData.average_score || 0,
                            } : null}
                        />

                        <InvestorDNA profile={profileData} isOwnProfile={isOwnProfile} />
                        <SocialStats profile={profileData} />

                        {/* Gamification Section - Only for own profile */}
                        {isOwnProfile && (
                            <>
                                {/* Streak Freezes */}
                                {streakData && streakData.streak_freezes > 0 && (
                                    <div className="bg-white rounded-2xl shadow-sm p-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                                <Snowflake className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Protection Streak</h3>
                                                <p className="text-sm text-gray-500">
                                                    {streakData.streak_freezes} freeze{streakData.streak_freezes > 1 ? 's' : ''} disponible{streakData.streak_freezes > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <StreakFreezeIndicator
                                            freezesCount={streakData.streak_freezes}
                                            maxFreezes={5}
                                        />
                                    </div>
                                )}

                                {/* Recent Achievements */}
                                {myAchievements && myAchievements.length > 0 && (
                                    <div className="bg-white rounded-2xl shadow-sm p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                                    <Trophy className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">Mes Badges</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {myAchievements.length} badge{myAchievements.length > 1 ? 's' : ''} debloques
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate('/achievements')}
                                                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                                            >
                                                Voir tout
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {myAchievements.slice(0, 3).map((ua) => (
                                                <AchievementCard
                                                    key={ua.id}
                                                    achievement={ua.achievement}
                                                    userAchievement={ua}
                                                    isUnlocked={true}
                                                    onShare={handleShareBadge}
                                                    isSharing={false}
                                                    size="sm"
                                                />
                                            ))}
                                        </div>
                                        {myAchievements.length > 3 && (
                                            <button
                                                onClick={() => navigate('/achievements')}
                                                className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-50 rounded-lg"
                                            >
                                                +{myAchievements.length - 3} autres badges
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Prochains Badges - objectifs les plus proches */}
                                <NextAchievements />
                            </>
                        )}

                        {/* Create Community Button - Only for own profile */}
                        {isOwnProfile && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                        <Users className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Communautes</h3>
                                        <p className="text-sm text-gray-500">Creez votre propre communaute</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCreateCommunityModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    <Plus className="w-5 h-5" />
                                    Creer une communaute
                                </button>
                                <button
                                    onClick={() => navigate('/communities')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-3 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium"
                                >
                                    Voir toutes les communautes
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Activity Feed */}
                    <div className="lg:col-span-2">
                        <ActivityFeed userId={profileData.id} isOwnProfile={isOwnProfile} />
                    </div>
                </div>
            </div>

            {/* Create Community Modal */}
            {showCreateCommunityModal && (
                <CreateCommunityModal onClose={() => setShowCreateCommunityModal(false)} />
            )}

            {/* Badge Share Modal (réseaux sociaux + communauté) */}
            <BadgeShareModal
                isOpen={!!sharingBadge}
                onClose={() => setSharingBadge(null)}
                achievement={sharingBadge}
                unlockedDate={sharingBadge ? myAchievements?.find(ua => ua.achievement.id === sharingBadge.id)?.unlocked_at : undefined}
            />
        </div>
    );
}
