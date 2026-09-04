// src/components/profile/PostComposer.tsx
import { useState } from 'react';
import { Send, TrendingUp, X, Loader2 } from 'lucide-react';
import { useCreatePost } from '../../hooks/useSocial';
import type { CreatePostData } from '../../hooks/useSocial';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function PostComposer() {
    const { userProfile } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [type, setType] = useState<CreatePostData['type']>('OPINION');
    const [stockSymbol, setStockSymbol] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const { mutate: createPost, isPending } = useCreatePost();

    const handleSubmit = () => {
        if (!content.trim()) {
            toast.error('Le contenu ne peut pas être vide');
            return;
        }

        const postData: CreatePostData = {
            type,
            content: content.trim(),
            title: title.trim() || undefined,
            stock_symbol: stockSymbol.trim() || undefined,
            tags: tags.length > 0 ? tags : undefined,
            visibility: 'PUBLIC',
        };

        createPost(postData, {
            onSuccess: () => {
                toast.success('Post publié !');
                setContent('');
                setTitle('');
                setStockSymbol('');
                setTags([]);
                setIsExpanded(false);
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.error || 'Erreur lors de la publication');
            },
        });
    };

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    return (
        <div className="bg-white rounded-2xl border border-ink-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-navy to-brand-navy-hover flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {userProfile?.name?.[0]?.toUpperCase() ?? ''}{userProfile?.lastname?.[0]?.toUpperCase() ?? ''}
                </div>

                <div className="flex-1">
                    {!isExpanded ? (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="w-full text-left px-4 py-3 bg-ink-50 border border-ink-100 rounded-xl text-ink-500 hover:bg-ink-100 hover:border-ink-200 transition-colors cursor-pointer"
                        >
                            Partagez votre analyse ou opinion...
                        </button>
                    ) : (
                        <div className="space-y-4">
                            {/* Type Selection */}
                            <div className="flex gap-2 flex-wrap">
                                {(['OPINION', 'ANALYSIS', 'QUESTION', 'TRANSACTION'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors cursor-pointer ${type === t
                                                ? 'bg-brand-navy text-white border-brand-navy'
                                                : 'bg-white text-ink-600 border-ink-200 hover:border-brand-navy hover:text-brand-navy'
                                            }`}
                                    >
                                        {t === 'OPINION' && 'Opinion'}
                                        {t === 'ANALYSIS' && 'Analyse'}
                                        {t === 'QUESTION' && 'Question'}
                                        {t === 'TRANSACTION' && 'Transaction'}
                                    </button>
                                ))}
                            </div>

                            {/* Title */}
                            <input
                                type="text"
                                placeholder="Titre (optionnel)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent placeholder:text-ink-400"
                            />

                            {/* Content */}
                            <textarea
                                placeholder="Partagez vos réflexions..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent placeholder:text-ink-400 resize-none"
                            />

                            {/* Stock Symbol */}
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-ink-400" />
                                <input
                                    type="text"
                                    placeholder="Symbole boursier (ex: SNTS)"
                                    value={stockSymbol}
                                    onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                                    maxLength={10}
                                    className="flex-1 px-4 py-2 border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent placeholder:text-ink-400"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Ajouter un tag"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        className="flex-1 px-4 py-2 border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent placeholder:text-ink-400"
                                    />
                                    <button
                                        onClick={addTag}
                                        className="px-4 py-2 bg-ink-100 text-ink-700 rounded-xl hover:bg-ink-200 transition-colors cursor-pointer font-medium"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1 bg-ink-100 text-brand-navy rounded-full text-sm font-medium flex items-center gap-2"
                                            >
                                                #{tag}
                                                <button onClick={() => removeTag(tag)}>
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-ink-100">
                                <button
                                    onClick={() => {
                                        setIsExpanded(false);
                                        setContent('');
                                        setTitle('');
                                        setStockSymbol('');
                                        setTags([]);
                                    }}
                                    className="px-4 py-2 text-ink-700 hover:bg-ink-100 rounded-xl transition-colors cursor-pointer font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isPending || !content.trim()}
                                    className="px-6 py-2 bg-brand-orange text-white rounded-xl font-semibold shadow-sm hover:bg-brand-orange-hover hover:shadow-md hover:shadow-brand-orange/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Publication...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Publier
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
