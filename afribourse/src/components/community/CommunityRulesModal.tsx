// src/components/community/CommunityRulesModal.tsx
import { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Users, TrendingUp, Heart, MessageCircle } from 'lucide-react';

interface Props {
    onAccept: () => void;
}

const COMMUNITY_RULES = [
    {
        icon: Users,
        title: 'Respectez les autres membres',
        description: 'Traitez tous les investisseurs avec courtoisie et professionnalisme. Aucune attaque personnelle ou insulte ne sera tolérée.',
        color: 'blue'
    },
    {
        icon: AlertCircle,
        title: 'Pas de spam ou promotion excessive',
        description: 'Évitez les publications répétitives et le contenu purement promotionnel. Partagez des analyses de qualité.',
        color: 'orange'
    },
    {
        icon: Shield,
        title: 'Aucun harcèlement ou discours haineux',
        description: 'Le harcèlement, les menaces, et tout discours haineux entraîneront un bannissement immédiat.',
        color: 'red'
    },
    {
        icon: TrendingUp,
        title: 'Informations financières vérifiées',
        description: 'Assurez-vous que vos analyses sont basées sur des données réelles. Citez vos sources pour les affirmations importantes.',
        color: 'green'
    },
    {
        icon: MessageCircle,
        title: 'Pas de manipulation de marché',
        description: 'Les tentatives de manipulation de cours, pump & dump, ou diffusion d\'informations trompeuses sont strictement interdites.',
        color: 'purple'
    },
    {
        icon: Heart,
        title: 'Contenu approprié uniquement',
        description: 'Gardez vos publications professionnelles. Pas de contenu offensant, vulgaire ou non pertinent.',
        color: 'pink'
    }
];

const COLOR_CLASSES: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-900', icon: 'text-blue-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-900', icon: 'text-orange-600' },
    red: { bg: 'bg-red-100', text: 'text-red-900', icon: 'text-red-600' },
    green: { bg: 'bg-green-100', text: 'text-green-900', icon: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-900', icon: 'text-purple-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-900', icon: 'text-pink-600' }
};

export default function CommunityRulesModal({ onAccept }: Props) {
    const [hasRead, setHasRead] = useState(false);

    const handleAccept = () => {
        if (!hasRead) return;
        localStorage.setItem('hasSeenCommunityRules', 'true');
        onAccept();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-t-2xl">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-1">Bienvenue dans la Communauté !</h2>
                            <p className="text-indigo-100">Ensemble, construisons une communauté d'investisseurs responsables</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Introduction */}
                    <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <p className="text-indigo-900 leading-relaxed">
                            Pour garantir une expérience enrichissante et professionnelle pour tous, veuillez prendre connaissance de nos règles communautaires. Le respect de ces règles est essentiel.
                        </p>
                    </div>

                    {/* Rules */}
                    <div className="space-y-4 mb-8">
                        {COMMUNITY_RULES.map((rule, index) => {
                            const Icon = rule.icon;
                            const colors = COLOR_CLASSES[rule.color];

                            return (
                                <div
                                    key={index}
                                    className="flex gap-4 p-5 bg-gray-50 rounded-xl hover:shadow-md transition-shadow"
                                >
                                    <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <h3 className="font-bold text-gray-900">{rule.title}</h3>
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed">{rule.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Consequences */}
                    <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-900 mb-2">Conséquences en cas de non-respect</p>
                                <ul className="text-sm text-amber-800 space-y-1">
                                    <li>• Avertissement pour première infraction mineure</li>
                                    <li>• Suspension temporaire pour infractions répétées</li>
                                    <li>• Bannissement permanent pour infractions graves</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Checkbox */}
                    <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors mb-6">
                        <input
                            type="checkbox"
                            checked={hasRead}
                            onChange={(e) => setHasRead(e.target.checked)}
                            className="w-5 h-5 mt-0.5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 leading-relaxed">
                            J'ai lu et je comprends les règles de la communauté. Je m'engage à les respecter et je comprends que leur non-respect peut entraîner des sanctions.
                        </span>
                    </label>

                    {/* Action Button */}
                    <button
                        onClick={handleAccept}
                        disabled={!hasRead}
                        className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-lg transition-all ${hasRead
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <CheckCircle className="w-5 h-5" />
                        Commencer à explorer la communauté
                    </button>
                </div>
            </div>
        </div>
    );
}
