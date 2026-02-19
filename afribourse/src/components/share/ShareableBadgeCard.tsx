// src/components/share/ShareableBadgeCard.tsx
import { Zap } from 'lucide-react';
import type { Achievement } from '../../types';
import CardBranding from './CardBranding';

interface ShareableBadgeCardProps {
    achievement: Achievement;
    unlockedDate?: string;
}

const RARITY_LABELS: Record<string, string> = {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire',
};

const RARITY_GRADIENTS: Record<string, string> = {
    common: 'from-gray-100 to-slate-100 border-gray-300',
    rare: 'from-blue-50 to-indigo-50 border-blue-300',
    epic: 'from-purple-50 to-fuchsia-50 border-purple-300',
    legendary: 'from-amber-50 to-yellow-50 border-amber-400',
};

const RARITY_TEXT: Record<string, string> = {
    common: 'text-gray-700 bg-gray-200',
    rare: 'text-blue-700 bg-blue-100',
    epic: 'text-purple-700 bg-purple-100',
    legendary: 'text-amber-700 bg-amber-100',
};

export default function ShareableBadgeCard({ achievement, unlockedDate }: ShareableBadgeCardProps) {
    const gradient = RARITY_GRADIENTS[achievement.rarity] || RARITY_GRADIENTS.common;
    const rarityText = RARITY_TEXT[achievement.rarity] || RARITY_TEXT.common;

    return (
        <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 border-2`}>
            {/* Header */}
            <div className="text-center mb-4">
                <div className="text-6xl mb-3">{achievement.icon || '🏆'}</div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${rarityText}`}>
                    {RARITY_LABELS[achievement.rarity] || achievement.rarity}
                </span>
            </div>

            {/* Badge Name & Description */}
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{achievement.name}</h3>
                <p className="text-sm text-gray-600">{achievement.description}</p>
            </div>

            {/* XP Reward */}
            {achievement.xp_reward > 0 && (
                <div className="flex items-center justify-center gap-2 p-3 bg-white/60 rounded-lg mb-4">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-amber-600">+{achievement.xp_reward} XP</span>
                </div>
            )}

            {/* Unlock date */}
            {unlockedDate && (
                <p className="text-center text-xs text-gray-500 mb-2">
                    Débloqué le {new Date(unlockedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            )}

            {/* CTA */}
            <div className="text-center mb-2">
                <p className="text-xs font-semibold text-blue-600">
                    Rejoins AfriBourse et débloque tes badges !
                </p>
                <p className="text-[10px] text-gray-400">africbourse.com/register</p>
            </div>

            {/* Branding */}
            <CardBranding />
        </div>
    );
}
