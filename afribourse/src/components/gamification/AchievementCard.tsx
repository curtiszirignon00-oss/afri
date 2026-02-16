// src/components/gamification/AchievementCard.tsx
// Carte badge individuel

import { Lock, Zap, CheckCircle, Share2, Loader2 } from 'lucide-react';
import type { Achievement, UserAchievement, AchievementRarity } from '../../types';
import { RARITY_COLORS } from '../../types';

interface AchievementCardProps {
  achievement: Achievement;
  userAchievement?: UserAchievement;
  isUnlocked?: boolean;
  onClick?: () => void;
  onShare?: (achievement: Achievement) => void;
  isSharing?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AchievementCard({
  achievement,
  userAchievement,
  isUnlocked = !!userAchievement,
  onClick,
  onShare,
  isSharing = false,
  size = 'md',
  className = ''
}: AchievementCardProps) {
  const rarityColors = RARITY_COLORS[achievement.rarity as AchievementRarity] || RARITY_COLORS.common;

  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'text-2xl',
      title: 'text-xs',
      desc: 'text-xs',
      badge: 'text-xs px-1.5 py-0.5'
    },
    md: {
      container: 'p-3',
      icon: 'text-3xl',
      title: 'text-sm',
      desc: 'text-xs',
      badge: 'text-xs px-2 py-0.5'
    },
    lg: {
      container: 'p-4',
      icon: 'text-4xl',
      title: 'text-base',
      desc: 'text-sm',
      badge: 'text-sm px-2 py-1'
    }
  };

  const sizes = sizeClasses[size];

  // Labels de rareté
  const rarityLabels: Record<string, string> = {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire'
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div
      className={`
        relative rounded-xl border-2 transition-all duration-300
        ${isUnlocked
          ? `${rarityColors.bg} ${rarityColors.border} cursor-pointer hover:shadow-lg`
          : 'bg-gray-50 border-gray-200 opacity-60'}
        ${onClick ? 'cursor-pointer' : ''}
        ${sizes.container}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Badge de rareté */}
      <span className={`absolute top-2 right-2 rounded-full font-medium ${sizes.badge} ${rarityColors.bg} ${rarityColors.text}`}>
        {rarityLabels[achievement.rarity]}
      </span>

      {/* Icône du badge */}
      <div className="flex flex-col items-center text-center">
        <div className={`${sizes.icon} mb-2 ${isUnlocked ? '' : 'grayscale'}`}>
          {achievement.icon || '🏆'}
        </div>

        {/* Lock overlay si non débloqué */}
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Titre */}
        <h3 className={`font-bold ${sizes.title} text-gray-800 ${!isUnlocked ? 'blur-sm' : ''}`}>
          {isUnlocked || !(achievement.is_hidden || achievement.is_secret) ? achievement.name : '???'}
        </h3>

        {/* Description */}
        <p className={`${sizes.desc} text-gray-600 mt-1 ${!isUnlocked && (achievement.is_hidden || achievement.is_secret) ? 'blur-sm' : ''}`}>
          {isUnlocked || !(achievement.is_hidden || achievement.is_secret) ? achievement.description : 'Badge secret'}
        </p>

        {/* XP Reward */}
        <div className={`flex items-center gap-1 mt-2 ${sizes.desc} text-amber-600`}>
          <Zap className="w-3 h-3" />
          <span className="font-medium">+{achievement.xp_reward} XP</span>
        </div>

        {/* Date de déblocage */}
        {isUnlocked && userAchievement && (
          <div className={`flex items-center gap-1 mt-1 ${sizes.desc} text-green-600`}>
            <CheckCircle className="w-3 h-3" />
            <span>Débloqué le {formatDate(userAchievement.unlocked_at)}</span>
          </div>
        )}

        {/* Bouton Partager */}
        {isUnlocked && onShare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(achievement);
            }}
            disabled={isSharing}
            className="mt-2 flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {isSharing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Share2 className="w-3 h-3" />
            )}
            Partager
          </button>
        )}
      </div>
    </div>
  );
}

export default AchievementCard;
