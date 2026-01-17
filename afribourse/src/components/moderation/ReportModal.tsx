// src/components/moderation/ReportModal.tsx
import { useState } from 'react';
import { X, AlertTriangle, Flag, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../lib/api-client';

interface Props {
    contentType: 'POST' | 'COMMENT' | 'COMMUNITY_POST' | 'COMMUNITY_COMMENT' | 'USER';
    contentId: string;
    contentAuthorName?: string;
    onClose: () => void;
}

type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'FALSE_INFO' | 'OTHER';

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
    {
        value: 'SPAM',
        label: 'Spam ou contenu promotionnel',
        description: 'Publication répétitive ou promotionnelle excessive'
    },
    {
        value: 'HARASSMENT',
        label: 'Harcèlement ou intimidation',
        description: 'Comportement abusif envers d\'autres membres'
    },
    {
        value: 'INAPPROPRIATE',
        label: 'Contenu inapproprié',
        description: 'Contenu offensant, vulgaire ou non professionnel'
    },
    {
        value: 'FALSE_INFO',
        label: 'Fausses informations',
        description: 'Informations financières trompeuses ou fausses'
    },
    {
        value: 'OTHER',
        label: 'Autre',
        description: 'Autre raison non listée'
    }
];

export default function ReportModal({ contentType, contentId, contentAuthorName, onClose }: Props) {
    const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReason) {
            toast.error('Veuillez sélectionner une raison');
            return;
        }

        setIsSubmitting(true);

        try {
            await apiClient.post('/moderation/reports', {
                contentType,
                contentId,
                reason: selectedReason,
                description: description.trim() || undefined
            });

            toast.success('Signalement envoyé. Merci de contribuer à une communauté saine !');
            onClose();
        } catch (error: any) {
            console.error('Error reporting content:', error);
            if (error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Erreur lors de l\'envoi du signalement');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <Flag className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Signaler ce contenu</h2>
                            {contentAuthorName && (
                                <p className="text-sm text-gray-500">Par {contentAuthorName}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Warning */}
                    <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium mb-1">Signalement anonyme</p>
                            <p>Votre signalement sera examiné par notre équipe de modération. Les faux signalements peuvent entraîner des sanctions.</p>
                        </div>
                    </div>

                    {/* Reason Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                            Pourquoi signalez-vous ce contenu ? *
                        </label>
                        <div className="space-y-2">
                            {REPORT_REASONS.map((reason) => (
                                <button
                                    key={reason.value}
                                    type="button"
                                    onClick={() => setSelectedReason(reason.value)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedReason === reason.value
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedReason === reason.value
                                                ? 'border-red-500 bg-red-500'
                                                : 'border-gray-300'
                                            }`}>
                                            {selectedReason === reason.value && (
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{reason.label}</p>
                                            <p className="text-sm text-gray-600 mt-0.5">{reason.description}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Informations complémentaires (optionnel)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ajoutez des détails pour aider notre équipe..."
                            rows={4}
                            maxLength={500}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">{description.length}/500 caractères</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedReason || isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Envoi...
                                </>
                            ) : (
                                <>
                                    <Flag className="w-4 h-4" />
                                    Envoyer le signalement
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
