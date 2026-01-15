// src/components/profile/ActivityFeed.tsx
import { useState } from 'react';
import { useUserPosts } from '../../hooks/useSocial';
import PostCard from './PostCard';
import PostComposer from './PostComposer';
import { Loader2, FileText } from 'lucide-react';
import { Card } from '../ui';

interface ActivityFeedProps {
    userId: string;
}

export default function ActivityFeed({ userId }: ActivityFeedProps) {
    const [page, setPage] = useState(1);
    const { data, isLoading, error } = useUserPosts(userId, page);

    return (
        <div className="space-y-6">
            {/* Post Composer */}
            <PostComposer />

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
