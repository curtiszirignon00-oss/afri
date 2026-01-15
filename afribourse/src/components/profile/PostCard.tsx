// src/components/profile/PostCard.tsx
import { useState } from 'react';
import { Heart, MessageCircle, Share2, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { useLikePost, useUnlikePost } from '../../hooks/useSocial';
import CommentSection from './CommentSection';
import { Card } from '../ui';
import toast from 'react-hot-toast';

interface PostCardProps {
    post: any;
}

const postTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
    ANALYSIS: { label: 'Analyse', color: 'blue', icon: TrendingUp },
    TRANSACTION: { label: 'Transaction', color: 'green', icon: TrendingUp },
    OPINION: { label: 'Opinion', color: 'purple', icon: MessageCircle },
    QUESTION: { label: 'Question', color: 'orange', icon: MessageCircle },
    ACHIEVEMENT: { label: 'Succès', color: 'yellow', icon: CheckCircle },
    ARTICLE: { label: 'Article', color: 'gray', icon: TrendingUp },
};

export default function PostCard({ post }: PostCardProps) {
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(false); // TODO: Check if user liked
    const likeMutation = useLikePost();
    const unlikeMutation = useUnlikePost();

    const typeConfig = postTypeConfig[post.type] || postTypeConfig.OPINION;
    const TypeIcon = typeConfig.icon;

    const handleLike = () => {
        if (isLiked) {
            unlikeMutation.mutate(post.id, {
                onSuccess: () => setIsLiked(false),
                onError: () => toast.error('Erreur'),
            });
        } else {
            likeMutation.mutate(post.id, {
                onSuccess: () => setIsLiked(true),
                onError: () => toast.error('Erreur'),
            });
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/posts/${post.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Lien copié !');
    };

    return (
        <Card className="p-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                    {post.author.name?.[0]}{post.author.lastname?.[0]}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                            {post.author.name} {post.author.lastname}
                        </span>
                        {post.author.profile?.verified_investor && (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                        <span className={`px-2 py-0.5 bg-${typeConfig.color}-100 text-${typeConfig.color}-700 text-xs rounded-full flex items-center gap-1`}>
                            <TypeIcon className="w-3 h-3" />
                            {typeConfig.label}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>
            </div>

            {/* Title */}
            {post.title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {post.title}
                </h3>
            )}

            {/* Content */}
            <div className="text-gray-700 mb-4 whitespace-pre-wrap">
                {post.content}
            </div>

            {/* Stock Info */}
            {post.stock_symbol && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                        <span className="font-semibold text-gray-900">{post.stock_symbol}</span>
                        {post.stock_price && (
                            <span className="ml-3 text-gray-600">{post.stock_price} FCFA</span>
                        )}
                    </div>
                    {post.stock_change !== undefined && (
                        <div className={`flex items-center gap-1 ${post.stock_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {post.stock_change >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-medium">
                                {post.stock_change >= 0 ? '+' : ''}{post.stock_change}%
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Images */}
            {post.images && post.images.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2">
                    {post.images.map((img: string, idx: number) => (
                        <img
                            key={idx}
                            src={img}
                            alt={`Post image ${idx + 1}`}
                            className="rounded-lg w-full h-48 object-cover"
                        />
                    ))}
                </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag: string) => (
                        <span
                            key={tag}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 ${isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'} transition-colors`}
                >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{post.likes_count || 0}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments_count || 0}</span>
                </button>

                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
                >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Partager</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <CommentSection postId={post.id} />
                </div>
            )}
        </Card>
    );
}
