// src/components/share/BadgeShareModal.tsx
import { useState, useRef } from 'react';
import { X, Send, Loader2, Download, Smartphone, Award } from 'lucide-react';
import { useCreatePost } from '../../hooks/useSocial';
import { downloadCardAsImage, cardToDataUrl, dataUrlToBlob, shareCardNative } from '../../utils/cardDownload';
import ShareableBadgeCard from './ShareableBadgeCard';
import type { Achievement } from '../../types';
import toast from 'react-hot-toast';

interface BadgeShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    achievement: Achievement | null;
    unlockedDate?: string;
}

const SITE_URL = 'https://africbourse.com';
const REGISTER_URL = 'https://africbourse.com/register';

const RARITY_LABELS: Record<string, string> = {
    common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire'
};

export default function BadgeShareModal({ isOpen, onClose, achievement, unlockedDate }: BadgeShareModalProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const { mutate: createPost, isPending } = useCreatePost();
    const cardRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !achievement) return null;

    const shareText = `${achievement.icon || '🏆'} J'ai débloqué le badge "${achievement.name}" (${RARITY_LABELS[achievement.rarity] || achievement.rarity}) sur AfriBourse !\n\n${achievement.description}${achievement.xp_reward > 0 ? `\n\n⚡ +${achievement.xp_reward} XP gagnés !` : ''}\n\nRejoins-moi sur AfriBourse !`;

    const handleShareCommunity = () => {
        createPost(
            {
                type: 'ACHIEVEMENT',
                content: shareText,
                tags: ['badge', achievement.category],
                metadata: {
                    achievement: {
                        id: achievement.id,
                        code: achievement.code,
                        name: achievement.name,
                        description: achievement.description,
                        icon: achievement.icon,
                        rarity: achievement.rarity,
                        category: achievement.category,
                        xp_reward: achievement.xp_reward,
                    }
                },
            },
            {
                onSuccess: () => {
                    toast.success('Badge partagé dans la communauté !');
                    onClose();
                },
                onError: () => {
                    toast.error('Erreur lors du partage');
                },
            }
        );
    };

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);
        try {
            await downloadCardAsImage(cardRef.current, `afribourse-badge-${achievement.code}`);
            toast.success('Image téléchargée !');
        } catch {
            toast.error('Erreur lors du téléchargement');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleNativeShare = async () => {
        if (!cardRef.current) return;
        setIsDownloading(true);
        try {
            const shared = await shareCardNative(cardRef.current, shareText + `\n\n${REGISTER_URL}`);
            if (!shared) {
                toast.error('Le partage natif n\'est pas supporté sur cet appareil');
            }
        } catch {
            toast.error('Erreur lors du partage');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShareWhatsApp = async () => {
        const text = encodeURIComponent(shareText + `\n\n👉 ${REGISTER_URL}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
        if (cardRef.current) {
            try {
                await downloadCardAsImage(cardRef.current, 'afribourse-badge');
                toast.success('Image téléchargée - vous pouvez la joindre sur WhatsApp');
            } catch { /* Silent */ }
        }
    };

    const handleShareX = async () => {
        const text = encodeURIComponent(shareText);
        const url = encodeURIComponent(REGISTER_URL);
        window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        if (cardRef.current) {
            try { await downloadCardAsImage(cardRef.current, 'afribourse-badge'); } catch { /* Silent */ }
        }
    };

    const handleShareFacebook = () => {
        const url = encodeURIComponent(REGISTER_URL);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    };

    const handleShareLinkedIn = () => {
        const url = encodeURIComponent(REGISTER_URL);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    };

    const handleCopyImage = async () => {
        try {
            if (cardRef.current) {
                const dataUrl = await cardToDataUrl(cardRef.current);
                const blob = await dataUrlToBlob(dataUrl);
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob }),
                ]);
                toast.success('Image copiée dans le presse-papier !');
            }
        } catch {
            await navigator.clipboard.writeText(shareText + `\n\n${REGISTER_URL}`);
            toast.success('Texte copié dans le presse-papier !');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <h2 className="text-xl font-bold text-gray-900">Partager mon badge</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Preview */}
                    <div ref={cardRef}>
                        <ShareableBadgeCard achievement={achievement} unlockedDate={unlockedDate} />
                    </div>

                    {/* Social Share Buttons */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Partager sur les réseaux sociaux
                        </label>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                            {/* Download */}
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                    <Download className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[11px] text-gray-600 font-medium">Télécharger</span>
                            </button>

                            {/* WhatsApp */}
                            <button
                                onClick={handleShareWhatsApp}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                </div>
                                <span className="text-[11px] text-gray-600 font-medium">WhatsApp</span>
                            </button>

                            {/* X */}
                            <button
                                onClick={handleShareX}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                </div>
                                <span className="text-[11px] text-gray-600 font-medium">X</span>
                            </button>

                            {/* Facebook */}
                            <button
                                onClick={handleShareFacebook}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </div>
                                <span className="text-[11px] text-gray-600 font-medium">Facebook</span>
                            </button>

                            {/* LinkedIn */}
                            <button
                                onClick={handleShareLinkedIn}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <div className="w-10 h-10 bg-[#0A66C2] rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                    </svg>
                                </div>
                                <span className="text-[11px] text-gray-600 font-medium">LinkedIn</span>
                            </button>

                            {/* Native Share */}
                            <button
                                onClick={handleNativeShare}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
                            >
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[11px] text-gray-600 font-medium">Plus</span>
                            </button>
                        </div>
                    </div>

                    {/* Copy image */}
                    <button
                        onClick={handleCopyImage}
                        className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200 font-medium"
                    >
                        Copier l'image dans le presse-papier
                    </button>
                </div>

                {/* Footer - Community share */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isPending}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleShareCommunity}
                        disabled={isPending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Partage...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Partager dans la communauté
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
