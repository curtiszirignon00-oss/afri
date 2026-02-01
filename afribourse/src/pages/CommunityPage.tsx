// src/pages/CommunityPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Globe, MessageCircle, Loader2, RefreshCw, Plus, Lock, Shield, ChevronRight, Sparkles, UserPlus, CheckCircle, UserCheck } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import PostCard from '../components/profile/PostCard';
import { useAuth } from '../contexts/AuthContext';
import { useCommunities } from '../hooks/useCommunity';
import { useFollowSuggestions, useFollowUser } from '../hooks/useSocial';
import CreateCommunityModal from '../components/community/CreateCommunityModal';
import CommunityRulesModal from '../components/community/CommunityRulesModal';

interface CommunityPost {
    id: string;
    type: string;
    content: string;
    title?: string;
    stock_symbol?: string;
    stock_price?: number;
    stock_change?: number;
    images?: string[];
    tags?: string[];
    likes_count: number;
    comments_count: number;
    created_at: string;
    author: {
        id: string;
        name: string;
        lastname: string;
        profile?: {
            username?: string;
            avatar_url?: string;
            verified_investor?: boolean;
            level?: number;
            country?: string;
        };
    };
    hasLiked?: boolean;
}

export default function CommunityPage() {
    const { isLoggedIn } = useAuth();
    const [page, setPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(() => {
        // Check if user has seen the rules before
        return !localStorage.getItem('hasSeenCommunityRules');
    });

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['community-posts', page],
        queryFn: async () => {
            const response = await apiClient.get(`/social/community?page=${page}&limit=10`);
            return response.data;
        },
    });

    // Fetch communities to discover
    const { data: communitiesData, isLoading: communitiesLoading } = useCommunities(1, { limit: 5 });
    const communities = communitiesData?.data || [];

    // Fetch follow suggestions
    const { data: suggestions, isLoading: suggestionsLoading } = useFollowSuggestions();
    const followMutation = useFollowUser();
    const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

    const posts: CommunityPost[] = data?.data || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

    const getVisibilityIcon = (visibility: string) => {
        switch (visibility) {
            case 'PUBLIC':
                return <Globe className="w-3 h-3 text-green-500" />;
            case 'PRIVATE':
                return <Lock className="w-3 h-3 text-yellow-500" />;
            case 'SECRET':
                return <Shield className="w-3 h-3 text-red-500" />;
            default:
                return <Globe className="w-3 h-3" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Communaute</h1>
                            <p className="text-blue-100">
                                Decouvrez les analyses et opinions des investisseurs
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-6 mt-6">
                        <div className="flex items-center gap-2 text-blue-100">
                            <MessageCircle className="w-5 h-5" />
                            <span>{total} publications</span>
                        </div>
                        <div className="flex items-center gap-2 text-blue-100">
                            <Globe className="w-5 h-5" />
                            <span>Posts publics et partages</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Left Sidebar - Communities to Discover */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Create Community Card */}
                        {isLoggedIn && (
                            <div className="bg-white rounded-2xl shadow-sm p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Creer</h3>
                                        <p className="text-xs text-gray-500">Votre communaute</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Creer une communaute
                                </button>
                            </div>
                        )}

                        {/* Communities to Discover */}
                        <div className="bg-white rounded-2xl shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <h3 className="font-semibold text-gray-900">A decouvrir</h3>
                                </div>
                                <Link
                                    to="/communities"
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                    Voir tout
                                </Link>
                            </div>

                            {communitiesLoading && (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                                </div>
                            )}

                            {!communitiesLoading && communities.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    Aucune communaute pour le moment
                                </p>
                            )}

                            {!communitiesLoading && communities.length > 0 && (
                                <div className="space-y-3">
                                    {communities.map((community: any) => (
                                        <Link
                                            key={community.id}
                                            to={`/communities/${community.slug}`}
                                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                                        >
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {community.avatar_url ? (
                                                    <img
                                                        src={community.avatar_url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Users className="w-5 h-5 text-indigo-600" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-medium text-gray-900 text-sm truncate">
                                                        {community.name}
                                                    </span>
                                                    {getVisibilityIcon(community.visibility)}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {community.members_count} membre{community.members_count > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            )}

                            <Link
                                to="/communities"
                                className="flex items-center justify-center gap-2 w-full mt-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors font-medium"
                            >
                                Explorer les communautes
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Suggested Profiles */}
                        {isLoggedIn && (
                            <div className="bg-white rounded-2xl shadow-sm p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <UserPlus className="w-5 h-5 text-purple-500" />
                                    <h3 className="font-semibold text-gray-900">Suggestions</h3>
                                </div>

                                {suggestionsLoading && (
                                    <div className="flex justify-center py-6">
                                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                                    </div>
                                )}

                                {!suggestionsLoading && (!suggestions || suggestions.length === 0) && (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        Aucune suggestion pour le moment
                                    </p>
                                )}

                                {!suggestionsLoading && suggestions && suggestions.length > 0 && (
                                    <div className="space-y-3">
                                        {suggestions.map((user: any) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                                            >
                                                <Link
                                                    to={`/profile/${user.id}`}
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden"
                                                    style={{
                                                        background: user.avatar_url
                                                            ? undefined
                                                            : `linear-gradient(135deg, ${user.avatar_color || '#6366f1'}, ${user.avatar_color || '#8b5cf6'})`,
                                                    }}
                                                >
                                                    {user.avatar_url ? (
                                                        <img
                                                            src={user.avatar_url}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <>{user.name?.[0]}{user.lastname?.[0]}</>
                                                    )}
                                                </Link>
                                                <div className="flex-1 min-w-0">
                                                    <Link
                                                        to={`/profile/${user.id}`}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <span className="font-medium text-gray-900 text-sm truncate">
                                                            {user.name} {user.lastname}
                                                        </span>
                                                        {user.verified_investor && (
                                                            <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                                        )}
                                                    </Link>
                                                    <p className="text-xs text-gray-500">
                                                        {user.followers_count} abonne{user.followers_count > 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (!followedIds.has(user.id)) {
                                                            followMutation.mutate(user.id);
                                                            setFollowedIds(prev => new Set(prev).add(user.id));
                                                        }
                                                    }}
                                                    disabled={followedIds.has(user.id) || followMutation.isPending}
                                                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium transition-colors flex-shrink-0 ${
                                                        followedIds.has(user.id)
                                                            ? 'bg-gray-100 text-gray-500'
                                                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                                    }`}
                                                >
                                                    {followedIds.has(user.id) ? (
                                                        <>
                                                            <UserCheck className="w-3 h-3" />
                                                            Suivi
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserPlus className="w-3 h-3" />
                                                            Suivre
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Main Content - Posts */}
                    <div className="lg:col-span-3">
                        {/* Refresh Button */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Publications recentes
                            </h2>
                            <button
                                onClick={() => refetch()}
                                disabled={isFetching}
                                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                                Actualiser
                            </button>
                        </div>

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                <p className="text-red-600 mb-4">Erreur lors du chargement des publications</p>
                                <button
                                    onClick={() => refetch()}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Reessayer
                                </button>
                            </div>
                        )}

                        {/* Empty State */}
                        {!isLoading && !error && posts.length === 0 && (
                            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Aucune publication pour le moment
                                </h3>
                                <p className="text-gray-600">
                                    Les publications des comptes publics et les posts partages apparaitront ici.
                                </p>
                            </div>
                        )}

                        {/* Posts List */}
                        {!isLoading && posts.length > 0 && (
                            <div className="space-y-6">
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Precedent
                                </button>
                                <span className="px-4 py-2 text-gray-600">
                                    Page {page} sur {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Community Modal */}
            {showCreateModal && (
                <CreateCommunityModal onClose={() => setShowCreateModal(false)} />
            )}

            {/* Community Rules Modal - First Visit */}
            {showRulesModal && (
                <CommunityRulesModal onAccept={() => setShowRulesModal(false)} />
            )}
        </div>
    );
}
