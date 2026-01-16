// src/components/community/CommunityPostCard.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Heart,
    MessageCircle,
    MoreHorizontal,
    Pin,
    Trash2,
    Clock,
    TrendingUp,
    TrendingDown,
    CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import {
    useLikeCommunityPost,
    useUnlikeCommunityPost,
    useDeleteCommunityPost,
    useTogglePinPost,
    type CommunityPost,
} from '../../hooks/useCommunity';
import { useAuth } from '../../contexts/AuthContext';
import CommunityCommentSection from './CommunityCommentSection';

interface Props {
    post: CommunityPost;
    communityId: string;
    canModerate?: boolean;
}

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    ANALYSIS: { label: 'Analyse', color: 'bg-blue-100 text-blue-700' },
    TRANSACTION: { label: 'Transaction', color: 'bg-green-100 text-green-700' },
    OPINION: { label: 'Opinion', color: 'bg-purple-100 text-purple-700' },
    QUESTION: { label: 'Question', color: 'bg-yellow-100 text-yellow-700' },
    ACHIEVEMENT: { label: 'Succes', color: 'bg-orange-100 text-orange-700' },
    ARTICLE: { label: 'Article', color: 'bg-gray-100 text-gray-700' },
};

export default function CommunityPostCard({ post, communityId, canModerate }: Props) {
    const { isLoggedIn, userProfile } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(post.hasLiked || false);
    const [likesCount, setLikesCount] = useState(post.likes_count);

    const likePost = useLikeCommunityPost();
    const unlikePost = useUnlikeCommunityPost();
    const deletePost = useDeleteCommunityPost();
    const togglePin = useTogglePinPost();

    const isOwner = userProfile?.id === post.author_id;
    const canDelete = isOwner || canModerate;

    const handleLike = async () => {
        if (!isLoggedIn) {
            toast.error('Connectez-vous pour aimer ce post');
            return;
        }

        try {
            if (isLiked) {
                await unlikePost.mutateAsync(post.id);
                setIsLiked(false);
                setLikesCount((c) => c - 1);
            } else {
                await likePost.mutateAsync(post.id);
                setIsLiked(true);
                setLikesCount((c) => c + 1);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Etes-vous sur de vouloir supprimer ce post?')) return;

        try {
            await deletePost.mutateAsync(post.id);
            toast.success('Post supprime');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
        }
    };

    const handleTogglePin = async () => {
        try {
            await togglePin.mutateAsync(post.id);
            toast.success(post.is_pinned ? 'Post desepingle' : 'Post epingle');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur');
        }
    };

    const typeConfig = POST_TYPE_LABELS[post.type] || POST_TYPE_LABELS.OPINION;

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Pinned indicator */}
            {post.is_pinned && (
                <div className="px-4 py-2 bg-indigo-50 border-b flex items-center gap-2 text-sm text-indigo-600">
                    <Pin className="w-4 h-4" />
                    Post epingle
                </div>
            )}

            {/* Header */}
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <Link to={`/profile/${post.author.id}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                            {post.author.profile?.avatar_url ? (
                                <img
                                    src={post.author.profile.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-lg font-semibold text-gray-600">
                                    {post.author.name[0]}
                                </span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                    {post.author.name} {post.author.lastname}
                                </span>
                                {post.author.profile?.verified_investor && (
                                    <CheckCircle className="w-4 h-4 text-blue-500" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                {post.author.profile?.username && (
                                    <span>@{post.author.profile.username}</span>
                                )}
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(post.created_at), {
                                        addSuffix: true,
                                        locale: fr,
                                    })}
                                </span>
                            </div>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                            {typeConfig.label}
                        </span>

                        {(canDelete || canModerate) && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1 hover:bg-gray-100 rounded-lg"
                                >
                                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                                </button>

                                {showMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowMenu(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-20">
                                            {canModerate && (
                                                <button
                                                    onClick={() => {
                                                        handleTogglePin();
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Pin className="w-4 h-4" />
                                                    {post.is_pinned ? 'Desepingler' : 'Epingler'}
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => {
                                                        handleDelete();
                                                        setShowMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Supprimer
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Title */}
                {post.title && (
                    <h3 className="font-semibold text-gray-900 mt-3">{post.title}</h3>
                )}

                {/* Content */}
                <p className="text-gray-800 mt-2 whitespace-pre-wrap">{post.content}</p>

                {/* Stock Info */}
                {post.stock_symbol && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <span className="font-medium text-gray-900">{post.stock_symbol}</span>
                        <div className="flex items-center gap-2">
                            {post.stock_price && (
                                <span className="font-semibold">
                                    {post.stock_price.toLocaleString()} FCFA
                                </span>
                            )}
                            {post.stock_change !== undefined && (
                                <span
                                    className={`flex items-center gap-1 text-sm ${
                                        post.stock_change >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}
                                >
                                    {post.stock_change >= 0 ? (
                                        <TrendingUp className="w-4 h-4" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4" />
                                    )}
                                    {post.stock_change >= 0 ? '+' : ''}
                                    {post.stock_change.toFixed(2)}%
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Images */}
                {post.images && post.images.length > 0 && (
                    <div
                        className={`mt-3 grid gap-2 ${
                            post.images.length === 1
                                ? 'grid-cols-1'
                                : post.images.length === 2
                                ? 'grid-cols-2'
                                : 'grid-cols-2'
                        }`}
                    >
                        {post.images.slice(0, 4).map((image, index) => (
                            <img
                                key={index}
                                src={image}
                                alt=""
                                className="w-full h-48 object-cover rounded-lg"
                            />
                        ))}
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t flex items-center gap-6">
                <button
                    onClick={handleLike}
                    disabled={likePost.isPending || unlikePost.isPending}
                    className={`flex items-center gap-2 ${
                        isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    } transition-colors`}
                >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likesCount}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-500 transition-colors"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments_count}</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <CommunityCommentSection postId={post.id} />
            )}
        </div>
    );
}
