// src/components/profile/ActivityFeed.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserPosts } from '../../hooks/useSocial';
import PostCard from './PostCard';
import PostComposer from './PostComposer';
import { Loader2, FileText } from 'lucide-react';
import { Card } from '../ui';

interface ActivityFeedProps {
    userId: string;
    isOwnProfile?: boolean;
    investorScore?: number | null;
}

export default function ActivityFeed({ userId, isOwnProfile = false, investorScore }: ActivityFeedProps) {
    const [page, setPage] = useState(1);
    const navigate = useNavigate();
    const { data, isLoading, error } = useUserPosts(userId, page);

    const showScoreCTA = isOwnProfile && investorScore == null;

    return (
        <div className="space-y-6">
            {/* CTA Score investisseur Simba — si phase 2 non complétée */}
            {showScoreCTA && (
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-6 text-white">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🎯</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">Déterminez votre score investisseur</h3>
                            <p className="text-white/80 text-sm mt-1">
                                Simba analyse vos secteurs préférés et génère votre allocation BRVM personnalisée.
                                3 étapes rapides.
                            </p>
                            <button
                                onClick={() => navigate('/onboarding?phase=2')}
                                className="mt-4 px-5 py-2.5 bg-white text-emerald-700 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-colors inline-flex items-center gap-2"
                            >
                                Obtenir mon score Simba
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Composer - Only show for own profile */}
            {isOwnProfile && <PostComposer />}

            {/* Feed */}
            <div className="space-y-4">
                {isLoading && (
                    <Card className="p-8 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </Card>
                )}

                {error && (
                    <Card className="p-8 text-center">
                        <p className="text-red-600">Erreur lors du chargement des posts</p>
                    </Card>
                )}

                {data && data.data.length === 0 && (
                    <Card className="p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Aucune publication
                        </h3>
                        <p className="text-gray-600">
                            Commencez à partager vos analyses et opinions !
                        </p>
                    </Card>
                )}

                {data?.data.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                ))}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Précédent
                        </button>
                        <span className="px-4 py-2 text-gray-600">
                            Page {page} sur {data.totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                            disabled={page === data.totalPages}
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
