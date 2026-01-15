// src/components/profile/CommentSection.tsx
import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { usePostComments, useCommentPost } from '../../hooks/useSocial';
import toast from 'react-hot-toast';

interface CommentSectionProps {
    postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
    const [commentText, setCommentText] = useState('');
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const { data: comments, isLoading } = usePostComments(postId);
    const { mutate: addComment, isPending } = useCommentPost();

    const handleSubmit = (parentId?: string) => {
        if (!commentText.trim()) return;

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
        return <div className="text-center py-4 text-gray-600">Chargement...</div>;
    }

    return (
        <div className="space-y-4">
            {/* Comment Input */}
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    U
                </div>
                <div className="flex-1">
                    <textarea
                        placeholder="Ajouter un commentaire..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    />
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={() => handleSubmit(replyTo || undefined)}
                            disabled={isPending || !commentText.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                            <Send className="w-4 h-4" />
                            Commenter
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
                {comments?.data.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {comment.author.name?.[0]}{comment.author.lastname?.[0]}
                        </div>
                        <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-gray-900 text-sm">
                                        {comment.author.name} {comment.author.lastname}
                                    </span>
                                    {comment.author.profile?.verified_investor && (
                                        <CheckCircle className="w-3 h-3 text-blue-600" />
                                    )}
                                    <span className="text-xs text-gray-500">
                                        {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                                <p className="text-gray-700 text-sm">{comment.content}</p>
                            </div>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-4 mt-3 space-y-3">
                                    {comment.replies.map((reply: any) => (
                                        <div key={reply.id} className="flex gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                                                {reply.author.name?.[0]}{reply.author.lastname?.[0]}
                                            </div>
                                            <div className="flex-1 bg-gray-50 rounded-lg p-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-900 text-xs">
                                                        {reply.author.name} {reply.author.lastname}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(reply.created_at).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 text-xs">{reply.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setReplyTo(comment.id)}
                                className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                            >
                                Répondre
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {comments?.data.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">
                    Aucun commentaire. Soyez le premier à commenter !
                </p>
            )}
        </div>
    );
}
