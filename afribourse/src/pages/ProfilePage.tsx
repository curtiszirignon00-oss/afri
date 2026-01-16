// src/pages/ProfilePage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useInvestorProfile, useSyncSocialStats } from '../hooks/useOnboarding';
import { useAuth } from '../contexts/AuthContext';
import ProfileHeader from '../components/profile/ProfileHeader';
import InvestorDNA from '../components/profile/InvestorDNA';
import SocialStats from '../components/profile/SocialStats';
import ActivityFeed from '../components/profile/ActivityFeed';
import CreateCommunityModal from '../components/community/CreateCommunityModal';
import { Loader2, ArrowLeft, Users, Plus } from 'lucide-react';

export default function ProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { userProfile } = useAuth();
    const { data: investorProfile, isLoading, error } = useInvestorProfile();
    const { mutate: syncStats } = useSyncSocialStats();
    const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);

    // Synchroniser les stats au chargement de la page profil (propre profil uniquement)
    const isOwnProfile = !userId || userId === userProfile?.id;

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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !investorProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Profil non configuré</h2>
                    <p className="text-gray-600 mb-6">
                        Vous n'avez pas encore complété votre profil investisseur.
                    </p>
                    <a
                        href="/onboarding"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        Compléter mon profil
                    </a>
                </div>
            </div>
        );
    }

    // Créer un objet profile compatible avec les composants
    const profileData = {
        id: userId || userProfile?.id || 'current-user',
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
                        <InvestorDNA profile={profileData} />
                        <SocialStats profile={profileData} />

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
                        <ActivityFeed userId={profileData.id} />
                    </div>
                </div>
            </div>

            {/* Create Community Modal */}
            {showCreateCommunityModal && (
                <CreateCommunityModal onClose={() => setShowCreateCommunityModal(false)} />
            )}
        </div>
    );
}
