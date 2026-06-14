// src/components/community/CommunitySectionComposer.tsx
import { useState, useRef } from 'react';
import { Send, Loader2, Image as ImageIcon, FileText, X, Video, Lock, Code } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    useCreateCommunityPost,
    useUploadPostImages,
    useUploadPdf,
    type PostType,
    type PostAttachment,
} from '../../hooks/useCommunity';
import { SECTION_CONFIG, type CommunitySection } from '../../config/communitySections';

interface Props {
    communityId: string;
    section: CommunitySection;
    isAdmin: boolean;
}

const TYPE_LABELS: Record<string, string> = {
    OPINION: 'Opinion',
    ANALYSIS: 'Analyse',
    QUESTION: 'Question',
    TRANSACTION: 'Transaction',
    ARTICLE: 'Article',
};

export default function CommunitySectionComposer({ communityId, section, isAdmin }: Props) {
    const cfg = SECTION_CONFIG[section];

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<PostType>(cfg.memberPostTypes[0] ?? 'ARTICLE');
    const [isHtml, setIsHtml] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [attachments, setAttachments] = useState<PostAttachment[]>([]);
    const [unlockLevel, setUnlockLevel] = useState<number>(0);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    const createPost = useCreateCommunityPost();
    const uploadImages = useUploadPostImages();
    const uploadPdf = useUploadPdf();

    // L'admin peut basculer en mode HTML ; pour les rubriques admin-only, HTML est le défaut
    const adminHtmlAvailable = isAdmin && cfg.adminHtml;
    const showTypeSelector = cfg.memberPostTypes.length > 0 && !(adminHtmlAvailable && isHtml);

    const reset = () => {
        setTitle('');
        setContent('');
        setType(cfg.memberPostTypes[0] ?? 'ARTICLE');
        setIsHtml(false);
        setImages([]);
        setVideoUrl('');
        setAttachments([]);
        setUnlockLevel(0);
    };

    const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (files.length === 0) return;
        try {
            const urls = await uploadImages.mutateAsync(files);
            setImages((prev) => [...prev, ...urls].slice(0, 10));
        } catch {
            toast.error('Erreur lors de l\'upload des images');
        } finally {
            if (imageInputRef.current) imageInputRef.current.value = '';
        }
    };

    const handlePdfPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const att = await uploadPdf.mutateAsync(file);
            setAttachments((prev) => [...prev, { url: att.url, name: att.name, size: att.size }]);
        } catch {
            toast.error('Erreur lors de l\'upload du PDF');
        } finally {
            if (pdfInputRef.current) pdfInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) {
            toast.error('Le contenu est requis');
            return;
        }

        const useHtml = adminHtmlAvailable && isHtml;
        const finalType: PostType = showTypeSelector ? type : 'ARTICLE';

        try {
            await createPost.mutateAsync({
                communityId,
                data: {
                    section,
                    type: finalType,
                    title: title.trim() || undefined,
                    content: content.trim(),
                    images: cfg.allowImages ? images : undefined,
                    video_url: cfg.allowVideo && videoUrl.trim() ? videoUrl.trim() : undefined,
                    attachments: cfg.allowPdf && attachments.length > 0 ? attachments : undefined,
                    metadata: {
                        ...(useHtml ? { is_html: true } : {}),
                        ...(cfg.levelGated && unlockLevel > 0 ? { unlock_level: unlockLevel } : {}),
                    },
                },
            });
            toast.success('Publication créée !');
            reset();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la publication');
        }
    };

    const uploading = uploadImages.isPending || uploadPdf.isPending;

    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                <span>{cfg.emoji}</span>
                <span>Publier dans {cfg.label}</span>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Sélecteur de type (rubriques où les membres postent) */}
                {showTypeSelector && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {cfg.memberPostTypes.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                    type === t
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {TYPE_LABELS[t] ?? t}
                            </button>
                        ))}
                    </div>
                )}

                {/* Toggle HTML (admin) */}
                {adminHtmlAvailable && (
                    <button
                        type="button"
                        onClick={() => setIsHtml((v) => !v)}
                        className={`flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            isHtml ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Code className="w-3 h-3" />
                        {isHtml ? 'Mode HTML activé' : 'Mode HTML'}
                    </button>
                )}

                {/* Titre */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titre (optionnel)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />

                {/* Contenu */}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={adminHtmlAvailable && isHtml ? 'Collez votre HTML ici…' : cfg.placeholder}
                    rows={adminHtmlAvailable && isHtml ? 6 : 4}
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none ${
                        adminHtmlAvailable && isHtml ? 'font-mono text-sm' : ''
                    }`}
                />

                {/* Vidéo (Récaps) */}
                {cfg.allowVideo && (
                    <div className="mt-3 flex items-center gap-2">
                        <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                            type="url"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="Lien vidéo (YouTube, Loom, Vimeo…)"
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                )}

                {/* Déblocage par niveau (Récaps) */}
                {cfg.levelGated && (
                    <div className="mt-3 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <label className="text-sm text-gray-600">Niveau requis pour débloquer les fichiers :</label>
                        <input
                            type="number"
                            min={0}
                            value={unlockLevel}
                            onChange={(e) => setUnlockLevel(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <span className="text-xs text-gray-400">(0 = accès libre)</span>
                    </div>
                )}

                {/* Aperçu images */}
                {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        {images.map((url, i) => (
                            <div key={i} className="relative group">
                                <img src={url} alt="" className="w-full h-24 object-cover rounded-lg" />
                                <button
                                    type="button"
                                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Liste PDF */}
                {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="flex-1 text-sm text-gray-700 truncate">{att.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                                >
                                    <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        {cfg.allowImages && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <ImageIcon className="w-4 h-4" /> Image
                                </button>
                                <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImagePick} />
                            </>
                        )}
                        {cfg.allowPdf && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => pdfInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <FileText className="w-4 h-4" /> PDF
                                </button>
                                <input ref={pdfInputRef} type="file" accept="application/pdf" hidden onChange={handlePdfPick} />
                            </>
                        )}
                        {uploading && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
                    </div>

                    <button
                        type="submit"
                        disabled={createPost.isPending || uploading || !content.trim()}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Publier
                    </button>
                </div>
            </form>
        </div>
    );
}
