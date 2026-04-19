// src/components/gamification/AchievementUnlockModal.tsx
// Modal de célébration lors du déblocage d'un badge

import { useEffect, useState } from 'react';
import { X, Zap, Share2, Users, Download, Smartphone } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Achievement, AchievementRarity } from '../../types';
import { RARITY_COLORS } from '../../types';

interface AchievementUnlockModalProps {
  achievement: Achievement;
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void; // ouvre BadgeShareModal (fourni par CelebrationContext)
}

export function AchievementUnlockModal({
  achievement,
  isOpen,
  onClose,
  onShare,
}: AchievementUnlockModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const rarityColors = RARITY_COLORS[achievement.rarity as AchievementRarity] || RARITY_COLORS.common;

  const rarityLabels: Record<string, string> = {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire',
  };

  // Confetti à l'ouverture
  useEffect(() => {
    if (!isOpen) { setIsAnimating(false); return; }

    setIsAnimating(true);

    const confettiColors: Record<string, string[]> = {
      common: ['#9CA3AF', '#D1D5DB'],
      rare: ['#3B82F6', '#60A5FA'],
      epic: ['#8B5CF6', '#A78BFA'],
      legendary: ['#F59E0B', '#FBBF24', '#FCD34D'],
    };
    const colors = confettiColors[achievement.rarity] || confettiColors.common;

    confetti({ particleCount: achievement.rarity === 'legendary' ? 150 : 100, spread: 70, origin: { y: 0.6 }, colors });

    if (achievement.rarity === 'epic' || achievement.rarity === 'legendary') {
      setTimeout(() => {
        confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 }, colors });
      }, 200);
    }
  }, [isOpen, achievement.rarity]);

  if (!isOpen) return null;

  const shareText = `${achievement.icon || '🏆'} J'ai débloqué le badge "${achievement.name}" sur AfriBourse !`;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(shareText + '\n\nRejoins-moi sur https://africbourse.com');
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareX = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent('https://africbourse.com');
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden
          transition-all duration-500
          ${isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}
      >
        {/* Header coloré selon rareté */}
        <div className={`p-7 ${rarityColors.bg} text-center relative overflow-hidden`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/25 hover:bg-white/45 transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Badge rareté */}
          <span className={`inline-block mb-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/40 ${rarityColors.text} border ${rarityColors.border}`}>
            {rarityLabels[achievement.rarity]}
          </span>

          {/* Icône animée */}
          <div className="text-7xl mb-2" style={{ animation: 'badge-pop 0.55s cubic-bezier(.36,1.8,.44,.95) both' }}>
            {achievement.icon || '🏆'}
          </div>

          <p className="text-sm font-semibold text-gray-700 opacity-80">Badge débloqué !</p>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
            {achievement.name}
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            {achievement.description}
          </p>

          {/* XP Reward */}
          {achievement.xp_reward > 0 && (
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-amber-50 border border-amber-200 rounded-full mb-5">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-lg font-bold text-amber-700">+{achievement.xp_reward} XP</span>
            </div>
          )}

          {/* Actions principales */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              Continuer
            </button>
            {onShare && (
              <button
                onClick={onShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            )}
          </div>

          {/* Partage rapide (sans ouvrir le modal complet) */}
          {onShare && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-3">Partage rapide</p>
              <div className="flex justify-center gap-3">
                {/* Communauté */}
                <button
                  onClick={onShare}
                  title="Partager dans la communauté"
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[10px] text-gray-500">Commu.</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  title="Partager sur WhatsApp"
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
                    <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <span className="text-[10px] text-gray-500">WhatsApp</span>
                </button>

                {/* X */}
                <button
                  onClick={handleShareX}
                  title="Partager sur X"
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                    <svg className="w-4 h-4 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <span className="text-[10px] text-gray-500">X</span>
                </button>

                {/* Plus (ouvre le modal complet) */}
                <button
                  onClick={onShare}
                  title="Plus d'options"
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                  </div>
                  <span className="text-[10px] text-gray-500">Plus</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes badge-pop {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          70%  { transform: scale(1.15) rotate(5deg); opacity: 1; }
          85%  { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

export default AchievementUnlockModal;
