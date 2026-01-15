// src/components/profile/PostCard.tsx
import { useState } from 'react';
import { Heart, MessageCircle, Share2, TrendingUp, TrendingDown, CheckCircle, MoreHorizontal, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { useLikePost, useUnlikePost, useDeletePost, useUpdatePost } from '../../hooks/useSocial';
import type { CreatePostData } from '../../hooks/useSocial';
import CommentSection from './CommentSection';
import { Card } from '../ui';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

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
    const { user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(false); // TODO: Check if user liked
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [editTitle, setEditTitle] = useState(post.title || '');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const likeMutation = useLikePost();
    const unlikeMutation = useUnlikePost();
    const deleteMutation = useDeletePost();
    const updateMutation = useUpdatePost();

    const isOwner = user?.id === post.author_id || user?.id === post.author?.id;

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

    const handleDelete = () => {
        deleteMutation.mutate(post.id, {
            onSuccess: () => {
                toast.success('Post supprimé');
                setShowDeleteConfirm(false);
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
            },
        });
    };

    const handleUpdate = () => {
        if (!editContent.trim()) {
            toast.error('Le contenu ne peut pas être vide');
            return;
        }

        updateMutation.mutate(
            {
                postId: post.id,
                data: {
                    content: editContent.trim(),
                    title: editTitle.trim() || undefined,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Post modifié');
                    setIsEditing(false);
                },
                onError: (error: any) => {
                    toast.error(error.response?.data?.error || 'Erreur lors de la modification');
                },
            }
        );
    };

    const cancelEdit = () => {
        setEditContent(post.content);
        setEditTitle(post.title || '');
        setIsEditing(false);
    };

    return (
        <Card className="p-6">
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Supprimer ce post ?
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Cette action est irréversible. Le post et tous ses commentaires seront définitivement supprimés.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
                    {post.author.profile?.avatar_url ? (
                        <img src={post.author.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <>{post.author.name?.[0]}{post.author.lastname?.[0]}</>
                    )}
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
                        {post.updated_at && post.updated_at !== post.created_at && (
                            <span className="text-gray-400 ml-1">(modifié)</span>
                        )}
                    </p>
                </div>

                {/* Menu dropdown for owner */}
                {isOwner && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Mode */}
            {isEditing ? (
                <div className="space-y-3 mb-4">
                    <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Titre (optionnel)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={cancelEdit}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Annuler
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={updateMutation.isPending || !editContent.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Enregistrer
                        </button>
                    </div>
                </div>
            ) : (
                <>
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
                </>
            )}

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
