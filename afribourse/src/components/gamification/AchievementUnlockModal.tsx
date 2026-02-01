// src/components/gamification/AchievementUnlockModal.tsx
// Modal de célébration lors du déblocage d'un badge

import { useEffect, useState } from 'react';
import { X, Zap, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Achievement, AchievementRarity } from '../../types';
import { RARITY_COLORS } from '../../types';

interface AchievementUnlockModalProps {
  achievement: Achievement;
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
}

export function AchievementUnlockModal({
  achievement,
  isOpen,
  onClose,
  onShare
}: AchievementUnlockModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const rarityColors = RARITY_COLORS[achievement.rarity as AchievementRarity] || RARITY_COLORS.common;

  // Labels de rareté
  const rarityLabels: Record<string, string> = {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire'
  };

  // Confetti lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);

      // Configuration des confettis selon la rareté
      const confettiColors: Record<string, string[]> = {
        common: ['#9CA3AF', '#D1D5DB'],
        rare: ['#3B82F6', '#60A5FA'],
        epic: ['#8B5CF6', '#A78BFA'],
        legendary: ['#F59E0B', '#FBBF24', '#FCD34D']
      };

      const colors = confettiColors[achievement.rarity] || confettiColors.common;

      // Lancer les confettis
      confetti({
        particleCount: achievement.rarity === 'legendary' ? 150 : 100,
        spread: 70,
        origin: { y: 0.6 },
        colors
      });

      // Second burst pour les badges épiques/légendaires
      if (achievement.rarity === 'epic' || achievement.rarity === 'legendary') {
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors
          });
        }, 200);
      }
    }
  }, [isOpen, achievement.rarity]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden
          transform transition-all duration-500
          ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        {/* Header coloré selon rareté */}
        <div className={`p-6 ${rarityColors.bg} text-center`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          <div className="text-6xl mb-3 animate-bounce">
            {achievement.icon || '🏆'}
          </div>

          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${rarityColors.bg} ${rarityColors.text} border ${rarityColors.border}`}>
            {rarityLabels[achievement.rarity]}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Badge Débloqué !
          </h2>
          <h3 className="text-2xl font-bold text-blue-600 mb-3">
            {achievement.name}
          </h3>
          <p className="text-gray-600 mb-4">
            {achievement.description}
          </p>

          {/* XP Reward */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-xl mb-6">
            <Zap className="w-5 h-5 text-amber-600" />
            <span className="text-lg font-bold text-amber-700">
              +{achievement.xp_reward} XP
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Continuer
            </button>
            {onShare && (
              <button
                onClick={onShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                Partager
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AchievementUnlockModal;
