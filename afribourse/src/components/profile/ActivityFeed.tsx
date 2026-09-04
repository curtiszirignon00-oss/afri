// src/components/profile/ActivityFeed.tsx
import { useState } from 'react';
import { useUserPosts } from '../../hooks/useSocial';
import PostCard from './PostCard';
import PostComposer from './PostComposer';
import { Loader2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface ActivityFeedProps {
    userId: string;
    isOwnProfile?: boolean;
}

const CARD = 'bg-white rounded-2xl border border-ink-100 shadow-sm';
const PAGER =
    'inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-ink-200 text-sm font-medium text-ink-700 ' +
    'bg-white hover:bg-ink-50 hover:border-brand-navy transition-colors cursor-pointer ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-ink-200 disabled:hover:bg-white';

export default function ActivityFeed({ userId, isOwnProfile = false }: ActivityFeedProps) {
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = useUserPosts(userId, page);

    return (
        <div className="space-y-6">
            {/* Post Composer - Only show for own profile */}
            {isOwnProfile && <PostComposer />}

            {/* Feed */}
            <div className="space-y-4">
                {isLoading && (
                    <div className={`${CARD} p-8 flex items-center justify-center`}>
                        <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
                    </div>
                )}

                {error && (
                    <div className={`${CARD} p-8 text-center`}>
                        <p className="text-red-700">Erreur lors du chargement des publications</p>
                    </div>
                )}

                {data && data.data.length === 0 && (
                    <div className={`${CARD} p-12 text-center`}>
                        <div className="w-14 h-14 rounded-2xl bg-ink-100 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-7 h-7 text-brand-navy" />
                        </div>
                        <h3 className="text-lg font-semibold text-ink-900 mb-1">
                            Aucune publication
                        </h3>
                        <p className="text-ink-500 max-w-sm mx-auto">
                            {isOwnProfile
                                ? 'Partage ta première analyse : la communauté AfriBourse apprend de ce que tu observes sur la BRVM.'
                                : 'Cet investisseur n\'a encore rien publié.'}
                        </p>
                    </div>
                )}

                {data?.data.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                ))}

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={PAGER}>
                            <ChevronLeft className="w-4 h-4" />
                            Précédent
                        </button>
                        <span className="text-sm text-ink-500 font-mono tabular-nums">
                            {page} / {data.totalPages}
                        </span>
                        <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className={PAGER}>
                            Suivant
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
