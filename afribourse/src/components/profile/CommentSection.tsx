// src/components/profile/CommentSection.tsx
import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { usePostComments, useCommentPost } from '../../hooks/useSocial';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface CommentSectionProps {
    postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
    const { userProfile, isLoggedIn } = useAuth();
    const [commentText, setCommentText] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const { data: comments, isLoading, error } = usePostComments(postId);
    const { mutate: addComment, isPending } = useCommentPost();

    const handleSubmit = (parentId?: string) => {
        if (!commentText.trim()) return;
        if (!isLoggedIn) {
            toast.error('Connectez-vous pour commenter');
            return;
        }

        addComment(
            { postId, content: commentText.trim(), parentId },
            {
                onSuccess: () => {
                    setCommentText('');
                    setReplyTo(null);
                    toast.success('Commentaire ajouté !');
                },
                onError: () => {
                    toast.error('Erreur lors de l\'ajout du commentaire');
                },
            }
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4 text-ink-600">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Chargement des commentaires...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-4 text-red-500">
                Erreur lors du chargement des commentaires
            </div>
        );
    }

    const userInitials = userProfile
        ? `${userProfile.name?.[0] || ''}${userProfile.lastname?.[0] || ''}`
        : 'U';

    return (
        <div className="space-y-4">
            {/* Comment Input */}
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-navy to-[#173F66] flex items-center justify-center text-white font-bold text-sm">
                    {userInitials}
                </div>
                <div className="flex-1">
                    <textarea
                        placeholder={isLoggedIn ? "Ajouter un commentaire..." : "Connectez-vous pour commenter"}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={2}
                        disabled={!isLoggedIn}
                        className="w-full px-4 py-2 border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent resize-none text-sm disabled:bg-ink-100 disabled:cursor-not-allowed"
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={() => handleSubmit(replyTo || undefined)}
                            disabled={isPending || !commentText.trim() || !isLoggedIn}
                            className="px-4 py-2 bg-brand-orange text-white rounded-xl font-semibold hover:bg-brand-orange-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 text-sm"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Commenter
                        </button>
                    </div>
                </div>
            </div>

            {/* Reply indicator */}
            {replyTo && (
                <div className="flex items-center gap-2 text-sm text-brand-navy bg-ink-50 border border-ink-100 px-3 py-2 rounded-xl">
                    <span>Répondre au commentaire</span>
                    <button
                        onClick={() => setReplyTo(null)}
                        className="text-ink-500 hover:text-ink-700"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
                {comments?.data?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-navy to-brand-navy-hover flex items-center justify-center text-white font-bold text-sm">
                            {comment.author.name?.[0]}{comment.author.lastname?.[0]}
                        </div>
                        <div className="flex-1">
                            <div className="bg-ink-50 border border-ink-100 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-ink-900 text-sm">
                                        {comment.author.name} {comment.author.lastname}
                                    </span>
                                    {comment.author.profile?.verified_investor && (
                                        <CheckCircle className="w-3 h-3 text-brand-orange-dark" />
                                    )}
                                    <span className="text-xs text-ink-500">
                                        {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                                <p className="text-ink-700 text-sm">{comment.content}</p>
                            </div>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-4 mt-3 space-y-3">
                                    {comment.replies.map((reply: any) => (
                                        <div key={reply.id} className="flex gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-navy to-[#173F66] flex items-center justify-center text-white font-bold text-xs">
                                                {reply.author.name?.[0]}{reply.author.lastname?.[0]}
                                            </div>
                                            <div className="flex-1 bg-ink-50 border border-ink-100 rounded-xl p-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-ink-900 text-xs">
                                                        {reply.author.name} {reply.author.lastname}
                                                    </span>
                                                    <span className="text-xs text-ink-500">
                                                        {new Date(reply.created_at).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                                <p className="text-ink-700 text-xs">{reply.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isLoggedIn && (
                                <button
                                    onClick={() => setReplyTo(comment.id)}
                                    className="text-xs font-medium text-brand-navy hover:text-brand-orange-dark mt-2 cursor-pointer"
                                >
                                    Répondre
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {(!comments?.data || comments.data.length === 0) && (
                <p className="text-center text-ink-500 text-sm py-4">
                    Aucun commentaire. Soyez le premier à commenter !
                </p>
            )}
        </div>
    );
}
