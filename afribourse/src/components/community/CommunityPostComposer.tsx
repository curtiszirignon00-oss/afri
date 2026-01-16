// src/components/community/CommunityPostComposer.tsx
import { useState } from 'react';
import { Send, Image, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCreateCommunityPost, type PostType } from '../../hooks/useCommunity';

interface Props {
    communityId: string;
}

const POST_TYPES: { value: PostType; label: string }[] = [
    { value: 'OPINION', label: 'Opinion' },
    { value: 'ANALYSIS', label: 'Analyse' },
    { value: 'QUESTION', label: 'Question' },
    { value: 'TRANSACTION', label: 'Transaction' },
    { value: 'ARTICLE', label: 'Article' },
];

export default function CommunityPostComposer({ communityId }: Props) {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [type, setType] = useState<PostType>('OPINION');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const createPost = useCreateCommunityPost();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            toast.error('Le contenu est requis');
            return;
        }

        try {
            await createPost.mutateAsync({
                communityId,
                data: {
                    type,
                    content: content.trim(),
                    title: title.trim() || undefined,
                },
            });
            toast.success('Publication creee!');
            setContent('');
            setTitle('');
            setType('OPINION');
            setShowAdvanced(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la publication');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            <form onSubmit={handleSubmit}>
                {/* Type selector */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {POST_TYPES.map((postType) => (
                        <button
                            key={postType.value}
                            type="button"
                            onClick={() => setType(postType.value)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                type === postType.value
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {postType.label}
                        </button>
                    ))}
                </div>

                {/* Title (optional) */}
                {showAdvanced && (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Titre (optionnel)"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                )}

                {/* Content */}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Partagez quelque chose avec la communaute..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                {/* Actions */}
                <div className="flex items-center justify-between mt-3">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        {showAdvanced ? 'Moins d\'options' : 'Plus d\'options'}
                    </button>

                    <button
                        type="submit"
                        disabled={createPost.isPending || !content.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {createPost.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Publier
                    </button>
                </div>
            </form>
        </div>
    );
}
