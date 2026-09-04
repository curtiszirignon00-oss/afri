// src/pages/ProfilePage.tsx
import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useSyncSocialStats } from '../hooks/useOnboarding';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import ProfileHeader from '../components/profile/ProfileHeader';
import InvestorDNA from '../components/profile/InvestorDNA';
import InvestorScore from '../components/profile/InvestorScore';
import ActivityHeatmap from '../components/profile/ActivityHeatmap';
import SimilarProfiles from '../components/profile/SimilarProfiles';
import ProfileStats from '../components/profile/ProfileStats';
import ActivityFeed from '../components/profile/ActivityFeed';
import ProfileSectionCard, { SECTION_ACTION_CLASS } from '../components/profile/ProfileSectionCard';
import CreateCommunityModal from '../components/community/CreateCommunityModal';
import { Loader2, Plus, Trophy, UserCircle2 } from 'lucide-react';
import { useUserProfile } from '../hooks/useApi';

// Gamification imports
import { useMyAchievements, useStreak, useGlobalLeaderboard } from '../hooks/useGamification';
import { AchievementCard, StreakFreezeIndicator, NextAchievements } from '../components/gamification';
import BadgeShareModal from '../components/share/BadgeShareModal';
import BadgeDetailModal from '../components/profile/BadgeDetailModal';
import ShareCardModal from '../components/profile/ShareCardModal';
import MyCertificates from '../components/certificate/MyCertificates';
import { getTopRareBadges } from '../components/common/RareBadgeIcon';
import type { Achievement } from '../types';

export default function ProfilePage() {
    const { userId: routeUserId, username } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { userProfile } = useAuth();
    const { mutate: syncStats } = useSyncSocialStats();
    const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
    const [sharingBadge, setSharingBadge] = useState<Achievement | null>(null);
    const [detailBadge, setDetailBadge] = useState<{ achievement: Achievement; unlockedDate?: string | null } | null>(null);
    const [showShareCard, setShowShareCard] = useState(false);

    // Partager un badge (ouvre le modal de partage social)
    const handleShareBadge = (achievement: Achievement) => {
        setSharingBadge(achievement);
    };

    const isLoggedIn = !!userProfile?.id;

    // Résolution du profil par username (route /u/:username)
    const { data: byUsernameProfile, isLoading: loadingByUsername, error: errByUsername } = useQuery({
        queryKey: ['public-profile-username', username],
        queryFn: async () => {
            const response = await apiClient.get(`/profile/by-username/${username}`);
            return response.data;
        },
        enabled: !!username,
    });

    // userId effectif : depuis /profile/:userId, ou résolu depuis le username
    const userId = username ? byUsernameProfile?.userId : routeUserId;

    // Determiner si c'est son propre profil
    const isOwnProfile = username
        ? (!!byUsernameProfile && byUsernameProfile.userId === userProfile?.id)
        : (!routeUserId || routeUserId === userProfile?.id);

    // Gamification hooks (only for own profile - hooks doivent toujours etre appeles)
    const { data: myAchievements } = useMyAchievements();
    const { data: streakData } = useStreak();
    // Classement global pour le percentile / rang affichés dans le hero
    const { data: leaderboardData } = useGlobalLeaderboard(100);

    // Full user profile pour profile_type (déterminé par Module 3)
    const { data: fullUserProfile } = useUserProfile();

    // Recuperer son propre profil investisseur (SEULEMENT si c'est son profil ET connecte)
    const { data: investorProfile, isLoading: isLoadingOwn } = useQuery({
        queryKey: ['investor-profile'],
        queryFn: async () => {
            const response = await apiClient.get('/investor-profile');
            return response.data.data;
        },
        enabled: isOwnProfile && isLoggedIn,
    });

    // Recuperer le profil public d'un autre utilisateur (route /profile/:userId)
    const { data: otherUserProfileRaw, isLoading: isLoadingOther, error: errorOtherRaw } = useQuery({
        queryKey: ['public-profile', userId],
        queryFn: async () => {
            const response = await apiClient.get(`/profile/${userId}`);
            return response.data;
        },
        enabled: !!userId && !isOwnProfile && !username,
    });

    // Le profil "autre utilisateur" provient soit du username, soit de l'id
    const otherUserProfile = username ? byUsernameProfile : otherUserProfileRaw;
    const errorOther = username ? errByUsername : errorOtherRaw;

    // Etats combines
    const isLoading = username
        ? (loadingByUsername || (isOwnProfile && isLoadingOwn))
        : (isOwnProfile ? isLoadingOwn : isLoadingOther);

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
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-ink-50 px-4">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
                        <UserCircle2 className="w-7 h-7 text-brand-navy" />
                    </div>
                    <h2 className="text-2xl font-bold text-ink-900 mb-2">Connexion requise</h2>
                    <p className="text-ink-500 mb-6">Connectez-vous pour voir votre profil.</p>
                    <a
                        href="/login"
                        className="inline-flex items-center px-6 py-3 bg-brand-orange text-white rounded-xl hover:bg-brand-orange-hover font-semibold shadow-sm hover:shadow-md hover:shadow-brand-orange/30 transition-all"
                    >
                        Se connecter
                    </a>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-ink-50">
                <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
            </div>
        );
    }

    // Gestion des erreurs : profil d'un autre utilisateur introuvable
    if (!isOwnProfile && (errorOther || !otherUserProfile)) {
        return (
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-ink-50 px-4">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
                        <UserCircle2 className="w-7 h-7 text-brand-navy" />
                    </div>
                    <h2 className="text-2xl font-bold text-ink-900 mb-2">Profil introuvable</h2>
                    <p className="text-ink-500 mb-6">
                        Ce profil n'existe pas ou n'est pas accessible.
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center px-6 py-3 bg-brand-navy text-white rounded-xl hover:bg-brand-navy-hover font-semibold shadow-sm transition-colors cursor-pointer"
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
            achievements: myAchievements?.data || [],
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
                avatar_color: investorProfile?.avatar_color || null,
                banner_url: investorProfile?.banner_url || null,
                banner_color: investorProfile?.banner_color || null,
                country: investorProfile?.country || null,
                verified_investor: investorProfile?.verified_investor || false,
                social_links: investorProfile?.social_links || null,
                specialty_tags: investorProfile?.specialty_tags || [],
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
            achievements: otherUserProfile?.achievements || [],
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
                avatar_color: otherUserProfile?.avatar_color || null,
                banner_url: otherUserProfile?.banner_url || null,
                banner_color: otherUserProfile?.banner_color || null,
                country: otherUserProfile?.country || null,
                verified_investor: otherUserProfile?.verified_investor || false,
                social_links: otherUserProfile?.social_links || null,
                specialty_tags: otherUserProfile?.specialty_tags || [],
                followers_count: otherUserProfile?.followersCount || otherUserProfile?.followers_count || 0,
                following_count: otherUserProfile?.followingCount || otherUserProfile?.following_count || 0,
                posts_count: otherUserProfile?.posts_count || 0,
                level: otherUserProfile?.level || 1,
                total_xp: otherUserProfile?.total_xp || 0,
            },
        };

    const profileTitle = isOwnProfile
        ? 'Mon Profil | AfriBourse'
        : 'Profil Investisseur | AfriBourse';

    return (
        <>
        <Helmet>
          <title>{profileTitle}</title>
          <meta name="description"        content="Profil investisseur AfriBourse — portefeuille, badges et performances sur la BRVM."/>
          <meta property="og:title"       content={profileTitle}/>
          <meta property="og:description" content="Profil investisseur AfriBourse — portefeuille, badges et performances sur la BRVM."/>
          <meta property="og:url"         content={profileData.profile?.username ? `https://africbourse.com/u/${profileData.profile.username}` : `https://africbourse.com/profile${userId ? `/${userId}` : ''}`}/>
          <meta property="og:image"       content={profileData.profile?.username ? `${import.meta.env.VITE_API_URL || 'https://api.africbourse.com/api'}/og/image/profile/${profileData.profile.username}` : "https://africbourse.com/images/logo_afribourse.png"}/>
          <meta name="twitter:card"       content="summary_large_image"/>
        </Helmet>
        <div className="min-h-[calc(100vh-5rem)] bg-ink-50">
            {/* Profile Header (bouton Retour intégré dans la bannière) */}
            <ProfileHeader
                profile={profileData}
                isOwnProfile={isOwnProfile}
                onBack={() => navigate(-1)}
                onShareCard={() => setShowShareCard(true)}
                profileUrl={
                    typeof window !== 'undefined'
                        ? (profileData.profile?.username
                            ? `${window.location.origin}/u/${profileData.profile.username}`
                            : `${window.location.origin}/profile/${profileData.id}`)
                        : undefined
                }
                heroStats={{
                    level: isOwnProfile ? investorProfile?.level : otherUserProfile?.level,
                    totalXp: isOwnProfile ? investorProfile?.total_xp : otherUserProfile?.total_xp,
                    currentStreak: isOwnProfile
                        ? (streakData?.current_streak ?? investorProfile?.current_streak)
                        : otherUserProfile?.current_streak,
                    percentile: isOwnProfile ? (leaderboardData?.percentile ?? null) : null,
                    rank: isOwnProfile
                        ? (leaderboardData?.user_rank ?? investorProfile?.global_rank ?? null)
                        : (otherUserProfile?.global_rank ?? null),
                    monthlyRoi: null,
                    completedModules: learningData
                        ? (learningData.completedModules || learningData.completed_modules || 0)
                        : null,
                    profileType: isOwnProfile
                        ? (fullUserProfile?.profile_type ?? null)
                        : (otherUserProfile?.profile_type ?? null),
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                    {/* Left Column - Investor DNA & Stats */}
                    <div className="lg:col-span-1 space-y-5">
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
                                        cashBalance: portfolioData.cashBalance ?? portfolioData.cash_balance ?? portfolioData.liquidity ?? 0,
                                        history: portfolioData.history || portfolioData.valueHistory || portfolioData.value_history || undefined,
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

                        <InvestorDNA
                            profileType={
                                isOwnProfile
                                    ? (fullUserProfile?.profile_type ?? null)
                                    : (otherUserProfile?.profile_type ?? null)
                            }
                            isOwnProfile={isOwnProfile}
                            completionPercentage={
                                learningData && (learningData.totalModules || learningData.total_modules)
                                    ? Math.round(
                                          ((learningData.completedModules || learningData.completed_modules || 0) /
                                              (learningData.totalModules || learningData.total_modules || 10)) *
                                              100
                                      )
                                    : null
                            }
                            onShareCard={() => setShowShareCard(true)}
                        />

                        {/* Score Investisseur composite — uniquement sur son propre profil */}
                        {isOwnProfile && isLoggedIn && (
                            <div id="score-investisseur" className="scroll-mt-24">
                                <InvestorScore enabled={isOwnProfile && isLoggedIn} />
                            </div>
                        )}
                        {/* Gamification Section - Only for own profile */}
                        {isOwnProfile && (
                            <>
                                {/* Streak Freezes */}
                                {streakData && streakData.streak_freezes > 0 && (
                                    <ProfileSectionCard
                                        title="Protection de série"
                                        subtitle={`${streakData.streak_freezes} freeze${streakData.streak_freezes > 1 ? 's' : ''} disponible${streakData.streak_freezes > 1 ? 's' : ''}`}
                                    >
                                        <StreakFreezeIndicator
                                            freezesCount={streakData.streak_freezes}
                                            maxFreezes={5}
                                        />
                                    </ProfileSectionCard>
                                )}

                                {/* Recent Achievements */}
                                {myAchievements && myAchievements.length > 0 && (
                                    <ProfileSectionCard
                                        title="Mes badges"
                                        subtitle={`${myAchievements.length} débloqué${myAchievements.length > 1 ? 's' : ''} · top 3 les plus rares`}
                                        action={
                                            <button onClick={() => navigate('/achievements')} className={SECTION_ACTION_CLASS}>
                                                Voir tout
                                            </button>
                                        }
                                    >
                                        <div className="space-y-3">
                                            {getTopRareBadges(myAchievements, 3).map((ua) => (
                                                <button
                                                    key={ua.id}
                                                    type="button"
                                                    onClick={() => setDetailBadge({ achievement: ua.achievement, unlockedDate: ua.unlocked_at })}
                                                    className="w-full text-left rounded-xl cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 motion-reduce:transition-none"
                                                    aria-label={`Voir le détail du badge ${ua.achievement.name}`}
                                                >
                                                    <AchievementCard
                                                        achievement={ua.achievement}
                                                        userAchievement={ua}
                                                        isUnlocked={true}
                                                        onShare={handleShareBadge}
                                                        isSharing={false}
                                                        size="sm"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {myAchievements.length > 3 && (
                                            <button
                                                onClick={() => navigate('/achievements')}
                                                className="w-full mt-4 py-2 text-sm font-medium text-ink-600 hover:text-brand-navy bg-ink-50 border border-ink-100 rounded-xl transition-colors cursor-pointer"
                                            >
                                                +{myAchievements.length - 3} autres badges
                                            </button>
                                        )}
                                    </ProfileSectionCard>
                                )}

                                {/* Empty state badges : aucun badge encore débloqué */}
                                {(!myAchievements || myAchievements.length === 0) && (
                                    <div className="bg-white rounded-2xl border border-ink-100 shadow-sm p-6 text-center">
                                        <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                            <Trophy className="w-6 h-6 text-brand-orange-dark" />
                                        </div>
                                        <p className="text-sm font-semibold text-ink-900">Aucun badge pour l'instant</p>
                                        <p className="text-xs text-ink-500 mt-1">Termine ton premier quiz pour débloquer ton premier badge.</p>
                                        <button
                                            onClick={() => navigate('/learn')}
                                            className={`${SECTION_ACTION_CLASS} mt-3 inline-flex items-center gap-1`}
                                        >
                                            Commencer un quiz →
                                        </button>
                                    </div>
                                )}

                                {/* Heatmap d'activité (12 semaines glissantes) */}
                                <ActivityHeatmap enabled={isOwnProfile && isLoggedIn} />

                                {/* Prochains Badges - objectifs les plus proches */}
                                <NextAchievements />
                            </>
                        )}

                        {/* Profils similaires — uniquement sur son propre profil */}
                        {isOwnProfile && isLoggedIn && (
                            <SimilarProfiles enabled={isOwnProfile && isLoggedIn} dnaType={fullUserProfile?.profile_type ?? null} />
                        )}

                        {/* Mes Certificats — uniquement sur son propre profil */}
                        {isOwnProfile && isLoggedIn && (
                            <ProfileSectionCard
                                title="Mes certificats"
                                subtitle="Délivrés après chaque webinaire complété"
                            >
                                <MyCertificates />
                            </ProfileSectionCard>
                        )}

                        {/* Create Community Button - Only for own profile */}
                        {isOwnProfile && (
                            <ProfileSectionCard
                                title="Communautés"
                                subtitle="Créez votre propre communauté"
                            >
                                <button
                                    onClick={() => setShowCreateCommunityModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-navy text-white rounded-xl hover:bg-brand-navy-hover hover:shadow-md hover:shadow-brand-navy/30 transition-all font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Créer une communauté
                                </button>
                                <button
                                    onClick={() => navigate('/communities')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-brand-navy bg-ink-50 border border-ink-100 rounded-xl hover:bg-ink-100 transition-colors text-sm font-medium cursor-pointer"
                                >
                                    Voir toutes les communautés
                                </button>
                            </ProfileSectionCard>
                        )}
                    </div>

                    {/* Right Column - Activity Feed */}
                    <div className="lg:col-span-2">
                        <ActivityFeed
                            userId={profileData.id}
                            isOwnProfile={isOwnProfile}
                        />
                    </div>
                </div>
            </div>

            {/* Create Community Modal */}
            {showCreateCommunityModal && (
                <CreateCommunityModal onClose={() => setShowCreateCommunityModal(false)} />
            )}

            {/* Badge Share Modal */}
            <BadgeShareModal
                isOpen={!!sharingBadge}
                onClose={() => setSharingBadge(null)}
                achievement={sharingBadge}
                unlockedDate={sharingBadge ? myAchievements?.find(ua => ua.achievement.id === sharingBadge.id)?.unlocked_at : undefined}
            />

            {/* Badge Detail Modal (preuve sociale : % de membres) */}
            <BadgeDetailModal
                isOpen={!!detailBadge}
                onClose={() => setDetailBadge(null)}
                achievement={detailBadge?.achievement ?? null}
                unlockedDate={detailBadge?.unlockedDate}
            />

            {/* Carte ADN partageable */}
            <ShareCardModal
                isOpen={showShareCard}
                onClose={() => setShowShareCard(false)}
                username={profileData.profile?.username}
                dnaType={isOwnProfile ? (fullUserProfile?.profile_type ?? null) : (otherUserProfile?.profile_type ?? null)}
            />

        </div>
        </>
    );
}
