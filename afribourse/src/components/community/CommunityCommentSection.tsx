// src/components/community/CommunityCommentSection.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Loader2, Clock, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { useCommunityPostComments, useCommentCommunityPost } from '../../hooks/useCommunity';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
    postId: string;
}

export default function CommunityCommentSection({ postId }: Props) {
    const { isLoggedIn } = useAuth();
    const [content, setContent] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    const { data, isLoading } = useCommunityPostComments(postId);
    const commentPost = useCommentCommunityPost();

    const comments = data?.data || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) return;

        try {
            await commentPost.mutateAsync({
                postId,
                content: content.trim(),
                parentId: replyTo?.id,
            });
            setContent('');
            setReplyTo(null);
            toast.success('Commentaire ajoute');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur');
        }
    };

    const toggleReplies = (commentId: string) => {
        const newExpanded = new Set(expandedReplies);
        if (newExpanded.has(commentId)) {
            newExpanded.delete(commentId);
        } else {
            newExpanded.add(commentId);
        }
        setExpandedReplies(newExpanded);
    };

    return (
        <div className="border-t">
            {/* Comment Input */}
            {isLoggedIn && (
                <form onSubmit={handleSubmit} className="p-4 border-b">
                    {replyTo && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                            <Reply className="w-4 h-4" />
                            <span>Reponse a {replyTo.name}</span>
                            <button
                                type="button"
                                onClick={() => setReplyTo(null)}
                                className="text-red-500 hover:text-red-700"
                            >
                                Annuler
                            </button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={replyTo ? 'Ecrire une reponse...' : 'Ajouter un commentaire...'}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                            type="submit"
                            disabled={commentPost.isPending || !content.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {commentPost.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
            )}

            {/* Comments List */}
            {!isLoading && comments.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                    Aucun commentaire. Soyez le premier!
                </div>
            )}

            {!isLoading && comments.length > 0 && (
                <div className="divide-y">
                    {comments.map((comment: any) => (
                        <div key={comment.id} className="p-4">
                            {/* Main Comment */}
                            <div className="flex gap-3">
                                <Link
                                    to={`/profile/${comment.author.id}`}
                                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                                >
                                    {comment.author.profile?.avatar_url ? (
                                        <img
                                            src={comment.author.profile.avatar_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-medium text-gray-600">
                                            {comment.author.name[0]}
                                        </span>
                                    )}
                                </Link>

                                <div className="flex-1">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <Link
                                            to={`/profile/${comment.author.id}`}
                                            className="font-medium text-gray-900 hover:underline"
                                        >
                                            {comment.author.name} {comment.author.lastname}
                                        </Link>
                                        <p className="text-gray-700 mt-1">{comment.content}</p>
                                    </div>

                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDistanceToNow(new Date(comment.created_at), {
                                                addSuffix: true,
                                                locale: fr,
                                            })}
                                        </span>
                                        {isLoggedIn && (
                                            <button
                                                onClick={() =>
                                                    setReplyTo({
                                                        id: comment.id,
                                                        name: `${comment.author.name} ${comment.author.lastname}`,
                                                    })
                                                }
                                                className="flex items-center gap-1 hover:text-indigo-600"
                                            >
                                                <Reply className="w-3 h-3" />
                                                Repondre
                                            </button>
                                        )}
                                    </div>

                                    {/* Replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => toggleReplies(comment.id)}
                                                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                                            >
                                                {expandedReplies.has(comment.id) ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                                {comment.replies.length} reponse
                                                {comment.replies.length > 1 ? 's' : ''}
                                            </button>

                                            {expandedReplies.has(comment.id) && (
                                                <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
                                                    {comment.replies.map((reply: any) => (
                                                        <div key={reply.id} className="flex gap-3">
                                                            <Link
                                                                to={`/profile/${reply.author.id}`}
                                                                className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                                                            >
                                                                {reply.author.profile?.avatar_url ? (
                                                                    <img
                                                                        src={reply.author.profile.avatar_url}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <span className="text-xs font-medium text-gray-600">
                                                                        {reply.author.name[0]}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                            <div className="flex-1">
                                                                <div className="bg-gray-50 rounded-lg p-2">
                                                                    <Link
                                                                        to={`/profile/${reply.author.id}`}
                                                                        className="font-medium text-sm text-gray-900 hover:underline"
                                                                    >
                                                                        {reply.author.name} {reply.author.lastname}
                                                                    </Link>
                                                                    <p className="text-sm text-gray-700 mt-1">
                                                                        {reply.content}
                                                                    </p>
                                                                </div>
                                                                <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {formatDistanceToNow(new Date(reply.created_at), {
                                                                        addSuffix: true,
                                                                        locale: fr,
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
