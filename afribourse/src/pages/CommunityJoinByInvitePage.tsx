// src/pages/CommunityJoinByInvitePage.tsx
import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Globe, Lock, Shield, Loader2, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useGetCommunityByInviteToken, useJoinByInvite } from '../hooks/useCommunity';
import { useAuth } from '../contexts/AuthContext';

export default function CommunityJoinByInvitePage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const { data: community, isLoading, error } = useGetCommunityByInviteToken(token || '');
    const joinByInvite = useJoinByInvite();

    // Redirect to login if not authenticated, preserving the invite URL
    useEffect(() => {
        if (!isLoggedIn && !isLoading && community) {
            navigate(`/login?redirect=/communities/join/${token}`);
        }
    }, [isLoggedIn, isLoading, community, token, navigate]);

    const handleJoin = async () => {
        if (!token) return;
        try {
            const result = await joinByInvite.mutateAsync(token);
            if (result.status === 'already_member') {
                toast.success('Vous êtes déjà membre de cette communauté');
            } else {
                toast.success(`Bienvenue dans ${result.community.name} !`);
            }
            navigate(`/communities/${result.community.slug}`);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur lors de l\'adhésion');
        }
    };

    const getVisibilityLabel = (v: string) => {
        if (v === 'PUBLIC') return { label: 'Publique', icon: <Globe className="w-4 h-4 text-green-500" /> };
        if (v === 'PRIVATE') return { label: 'Privée', icon: <Lock className="w-4 h-4 text-yellow-500" /> };
        return { label: 'Secrète', icon: <Shield className="w-4 h-4 text-red-500" /> };
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error || !community) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h2>
                    <p className="text-gray-600 mb-6">Ce lien d'invitation est invalide ou a expiré.</p>
                    <Link
                        to="/communities"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        <Users className="w-4 h-4" />
                        Voir les communautés
                    </Link>
                </div>
            </div>
        );
    }

    const vis = getVisibilityLabel(community.visibility);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
                {/* Banner placeholder */}
                <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-600" />

                <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className="-mt-10 mb-4">
                        <div className="w-20 h-20 rounded-2xl shadow bg-white flex items-center justify-center overflow-hidden border-4 border-white">
                            {community.avatar_url ? (
                                <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
                            ) : (
                                <Users className="w-10 h-10 text-indigo-600" />
                            )}
                        </div>
                    </div>

                    <div className="mb-1 flex items-center gap-2">
                        <h1 className="text-xl font-bold text-gray-900">{community.name}</h1>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                            {vis.icon} {vis.label}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> {community.members_count} membre{community.members_count > 1 ? 's' : ''}
                        </span>
                    </div>

                    {community.description && (
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">{community.description}</p>
                    )}

                    <p className="text-sm text-gray-500 mb-5">
                        Vous avez été invité(e) à rejoindre cette communauté par{' '}
                        <span className="font-medium text-gray-700">
                            {community.creator.profile?.username || `${community.creator.name} ${community.creator.lastname}`}
                        </span>.
                    </p>

                    {isLoggedIn ? (
                        <button
                            onClick={handleJoin}
                            disabled={joinByInvite.isPending}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                        >
                            {joinByInvite.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <UserPlus className="w-4 h-4" />
                            )}
                            Rejoindre la communauté
                        </button>
                    ) : (
                        <Link
                            to={`/login?redirect=/communities/join/${token}`}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                        >
                            Se connecter pour rejoindre
                        </Link>
                    )}

                    <Link to="/communities" className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3">
                        Voir toutes les communautés
                    </Link>
                </div>
            </div>
        </div>
    );
}
