// src/components/profile/BadgeDetailModal.tsx
// Détail d'un badge cliquable : date d'obtention, condition, % de membres l'ayant débloqué.
import { useQuery } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import type { Achievement } from '../../types';

interface BadgeStats {
    code: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    percent: number;
    unlocked_count: number;
    total_users: number;
}

interface BadgeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    achievement: Achievement | null;
    unlockedDate?: string | null;
}

const RARITY_LABEL: Record<string, string> = {
    legendary: 'Légendaire', epic: 'Épique', rare: 'Rare', common: 'Commun',
};
const RARITY_STYLE: Record<string, string> = {
    legendary: 'bg-amber-50 text-amber-700 ring-amber-300',
    epic: 'bg-purple-50 text-purple-700 ring-purple-300',
    rare: 'bg-blue-50 text-blue-700 ring-blue-300',
    common: 'bg-gray-50 text-gray-700 ring-gray-300',
};

export default function BadgeDetailModal({ isOpen, onClose, achievement, unlockedDate }: BadgeDetailModalProps) {
    const code = (achievement as any)?.code;

    const { data: stats, isLoading } = useQuery({
        queryKey: ['achievement-stats', code],
        queryFn: async () => {
            const res = await apiClient.get(`/achievements/${code}/stats`);
            return res.data as BadgeStats;
        },
        enabled: isOpen && !!code,
        staleTime: 10 * 60 * 1000,
    });

    if (!isOpen || !achievement) return null;

    const rarity = (achievement as any).rarity || 'common';
    const isRare = stats && stats.percent <= 15;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Détail du badge</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 text-center">
                    <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl ring-2 ${RARITY_STYLE[rarity]}`}>
                        {(achievement as any).icon}
                    </div>
                    <h4 className="mt-4 text-lg font-bold text-gray-900">{achievement.name}</h4>
                    <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${RARITY_STYLE[rarity]}`}>
                        {RARITY_LABEL[rarity] || rarity}
                    </span>

                    <p className="mt-3 text-sm text-gray-600">{achievement.description}</p>

                    {unlockedDate && (
                        <p className="mt-3 text-xs text-gray-500">
                            Débloqué le {new Date(unlockedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    )}

                    {/* Preuve sociale : % de membres */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
                        ) : stats ? (
                            <p className="text-sm">
                                {isRare ? (
                                    <span className="font-semibold text-amber-700">Badge rare : seulement {stats.percent}% des membres l'ont</span>
                                ) : (
                                    <span className="text-gray-700"><span className="font-semibold">{stats.percent}%</span> des membres ont ce badge</span>
                                )}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400">Statistiques indisponibles</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
