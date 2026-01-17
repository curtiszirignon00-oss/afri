// src/components/share/ShareModal.tsx
import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { useCreatePost } from '../../hooks/useSocial';
import type { ShareData } from '../../types/share';
import { formatShareData } from '../../utils/shareFormatters';
import ShareablePortfolioCard from './ShareablePortfolioCard';
import ShareablePerformanceCard from './ShareablePerformanceCard';
import ShareablePositionCard from './ShareablePositionCard';
import toast from 'react-hot-toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareData: ShareData | null;
}

export default function ShareModal({ isOpen, onClose, shareData }: ShareModalProps) {
    const [customMessage, setCustomMessage] = useState('');
    const { mutate: createPost, isPending } = useCreatePost();

    if (!isOpen || !shareData) return null;

    const handleShare = () => {
        const { content, metadata } = formatShareData(shareData.type, shareData.data);

        // Combine generated content with custom message
        const finalContent = customMessage.trim()
            ? `${customMessage}\n\n${content}`
            : content;

        createPost(
            {
                type: 'TRANSACTION', // Type de post pour les partages de stats
                content: finalContent,
                visibility: 'PUBLIC',
                // Store share metadata for rendering
                tags: [`share-${shareData.type.toLowerCase()}`],
            },
            {
                onSuccess: () => {
                    toast.success('Partagé avec succès !');
                    onClose();
                    setCustomMessage('');
                },
                onError: (error: any) => {
                    toast.error(error.response?.data?.error || 'Erreur lors du partage');
                },
            }
        );
    };

    const renderPreview = () => {
        switch (shareData.type) {
            case 'PORTFOLIO_VALUE':
            case 'PORTFOLIO_COMPOSITION':
                return <ShareablePortfolioCard data={shareData.data as any} />;
            case 'PERFORMANCE':
                return <ShareablePerformanceCard data={shareData.data as any} />;
            case 'POSITION':
                return <ShareablePositionCard data={shareData.data as any} />;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Partager</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Custom Message */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message personnalisé (optionnel)
                        </label>
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="Ajoutez votre commentaire..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Aperçu
                        </label>
                        {renderPreview()}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isPending}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleShare}
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
                                Partager
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
