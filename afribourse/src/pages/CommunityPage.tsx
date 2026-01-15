// src/pages/CommunityPage.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Globe, MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import PostCard from '../components/profile/PostCard';

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
    const [page, setPage] = useState(1);

    const { data, isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['community-posts', page],
        queryFn: async () => {
            const response = await apiClient.get(`/social/community?page=${page}&limit=10`);
            return response.data;
        },
    });

    const posts: CommunityPost[] = data?.data || [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || 0;

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
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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
    );
}
