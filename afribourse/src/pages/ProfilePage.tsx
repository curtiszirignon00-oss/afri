// src/pages/ProfilePage.tsx
import { useParams } from 'react-router-dom';
import { useInvestorProfile } from '../hooks/useOnboarding';
import ProfileHeader from '../components/profile/ProfileHeader';
import InvestorDNA from '../components/profile/InvestorDNA';
import SocialStats from '../components/profile/SocialStats';
import ActivityFeed from '../components/profile/ActivityFeed';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
    const { userId } = useParams();
    const { data: investorProfile, isLoading, error } = useInvestorProfile();

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
    const mockProfile = {
        id: userId || 'current-user',
        name: 'Utilisateur',
        lastname: 'Africbourse',
        email: 'user@africbourse.com',
        investorProfile: investorProfile,
        stats: {
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
            portfolios_count: 0,
        },
        profile: {
            username: 'user',
            bio: 'Investisseur sur Africbourse',
            avatar_url: null,
            verified_investor: false,
            followers_count: 0,
            following_count: 0,
            posts_count: 0,
        },
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Profile Header */}
            <ProfileHeader profile={mockProfile} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Investor DNA & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <InvestorDNA profile={mockProfile} />
                        <SocialStats profile={mockProfile} />
                    </div>

                    {/* Right Column - Activity Feed */}
                    <div className="lg:col-span-2">
                        <ActivityFeed userId={mockProfile.id} />
                    </div>
                </div>
            </div>
        </div>
    );
}
