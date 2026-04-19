// src/components/gamification/MilestonePopup.tsx
// Pop-up de célébration pour les micro-victoires (premier quiz, première plus-value, level up…)

import { useEffect, useState } from 'react';
import { X, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export type MilestoneType =
  | 'first_quiz'
  | 'perfect_quiz'
  | 'first_module'
  | 'first_trade'
  | 'first_gain'
  | 'level_up'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'challenge_complete'
  | 'first_community'
  | 'custom';

export interface MilestoneData {
  /** Remplace le titre par défaut */
  title?: string;
  /** Remplace le message par défaut */
  message?: string;
  /** Valeur contextuelle (ex: niveau atteint, score, montant gain…) */
  value?: string | number;
  /** XP gagnés à afficher */
  xp?: number;
}

interface MilestonePopupProps {
  type: MilestoneType;
  data?: MilestoneData;
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
}

// Config par type de milestone
const MILESTONE_CONFIG: Record<
  MilestoneType,
  { emoji: string; title: string; message: string; gradient: string; confettiColors: string[] }
> = {
  first_quiz: {
    emoji: '🎯',
    title: 'Premier quiz validé !',
    message: 'Tu viens de passer ton tout premier quiz avec succès. C\'est le début d\'une belle aventure !',
    gradient: 'from-blue-500 to-indigo-600',
    confettiColors: ['#3B82F6', '#6366F1', '#60A5FA', '#A5B4FC'],
  },
  perfect_quiz: {
    emoji: '🌟',
    title: 'Quiz parfait !',
    message: 'Incroyable — 100% de bonnes réponses ! Tu maîtrises ce sujet à la perfection.',
    gradient: 'from-amber-400 to-orange-500',
    confettiColors: ['#F59E0B', '#F97316', '#FCD34D', '#FED7AA'],
  },
  first_module: {
    emoji: '📚',
    title: 'Premier module terminé !',
    message: 'Tu viens de compléter ton premier module de formation. Continue sur ta lancée !',
    gradient: 'from-green-500 to-emerald-600',
    confettiColors: ['#22C55E', '#10B981', '#86EFAC', '#6EE7B7'],
  },
  first_trade: {
    emoji: '💼',
    title: 'Premier trade effectué !',
    message: 'Tu viens d\'effectuer ta toute première transaction sur AfriBourse. Bienvenue dans le monde du trading !',
    gradient: 'from-purple-500 to-violet-600',
    confettiColors: ['#8B5CF6', '#7C3AED', '#C4B5FD', '#A78BFA'],
  },
  first_gain: {
    emoji: '📈',
    title: 'Première plus-value réalisée !',
    message: 'Félicitations ! Tu viens de réaliser ta première plus-value. Tu sais maintenant ce que ça fait de gagner sur les marchés !',
    gradient: 'from-green-400 to-teal-500',
    confettiColors: ['#4ADE80', '#2DD4BF', '#86EFAC', '#99F6E4'],
  },
  level_up: {
    emoji: '🎯',
    title: 'Nouveau niveau atteint !',
    message: 'Tu viens de franchir un nouveau palier. Tes efforts paient — continue comme ça !',
    gradient: 'from-amber-400 to-yellow-500',
    confettiColors: ['#F59E0B', '#EAB308', '#FCD34D', '#FEF08A'],
  },
  streak_7: {
    emoji: '🔥',
    title: '7 jours de suite !',
    message: 'Une semaine sans interruption ! Ta régularité est exemplaire. Continue à maintenir ta série !',
    gradient: 'from-orange-400 to-red-500',
    confettiColors: ['#F97316', '#EF4444', '#FED7AA', '#FCA5A5'],
  },
  streak_30: {
    emoji: '🔥',
    title: '30 jours de suite !',
    message: 'Un mois entier de présence quotidienne ! Tu es un vrai investisseur engagé.',
    gradient: 'from-red-500 to-pink-600',
    confettiColors: ['#EF4444', '#EC4899', '#FCA5A5', '#F9A8D4'],
  },
  streak_100: {
    emoji: '👑',
    title: '100 jours de suite !',
    message: 'Cent jours de régularité absolue — tu es une légende vivante d\'AfriBourse !',
    gradient: 'from-violet-500 to-fuchsia-600',
    confettiColors: ['#8B5CF6', '#D946EF', '#C4B5FD', '#F0ABFC'],
  },
  challenge_complete: {
    emoji: '🏆',
    title: 'Défi de la semaine accompli !',
    message: 'Tu as relevé le défi ! Tes récompenses sont en route. Prêt pour le prochain ?',
    gradient: 'from-amber-500 to-yellow-400',
    confettiColors: ['#F59E0B', '#EAB308', '#FBBF24', '#FDE047'],
  },
  first_community: {
    emoji: '🤝',
    title: 'Tu rejoins la communauté !',
    message: 'Bienvenue dans ta première communauté AfriBourse. Échanges, idées et opportunités t\'attendent !',
    gradient: 'from-sky-500 to-blue-600',
    confettiColors: ['#0EA5E9', '#3B82F6', '#7DD3FC', '#93C5FD'],
  },
  custom: {
    emoji: '🎉',
    title: 'Félicitations !',
    message: 'Tu viens d\'accomplir quelque chose de remarquable !',
    gradient: 'from-blue-500 to-indigo-600',
    confettiColors: ['#3B82F6', '#8B5CF6', '#60A5FA', '#A78BFA'],
  },
};

export function MilestonePopup({ type, data, isOpen, onClose, onShare }: MilestonePopupProps) {
  const [visible, setVisible] = useState(false);
  const config = MILESTONE_CONFIG[type] || MILESTONE_CONFIG.custom;

  const title = data?.title ?? config.title;
  const message = data?.message ?? config.message;

  useEffect(() => {
    if (isOpen) {
      // Légère attente pour que l'animation d'entrée soit fluide
      const t = setTimeout(() => setVisible(true), 30);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.55 },
        colors: config.confettiColors,
      });

      // Second burst latéral pour les grandes victoires
      if (['perfect_quiz', 'streak_30', 'streak_100', 'first_gain'].includes(type)) {
        setTimeout(() => {
          confetti({ particleCount: 40, angle: 60, spread: 45, origin: { x: 0 }, colors: config.confettiColors });
          confetti({ particleCount: 40, angle: 120, spread: 45, origin: { x: 1 }, colors: config.confettiColors });
        }, 250);
      }

      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOpen, type, config.confettiColors]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card */}
      <div
        className={`
          relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden
          transition-all duration-300
          ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'}
        `}
      >
        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${config.gradient} p-8 text-center relative overflow-hidden`}>
          {/* Halo lumineux décoratif */}
          <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl scale-75 mx-auto" />

          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Emoji animé */}
          <div
            className="text-6xl mb-3 relative"
            style={{ animation: 'milestone-bounce 0.6s ease-out' }}
          >
            {config.emoji}
          </div>

          {/* Titre */}
          <h2 className="text-xl font-extrabold text-white leading-tight">
            {title}
          </h2>

          {/* Valeur contextuelle */}
          {data?.value != null && (
            <div className="mt-2 inline-block px-3 py-1 bg-white/25 rounded-full text-white font-semibold text-sm">
              {data.value}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5 text-center">
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {message}
          </p>

          {/* XP badge */}
          {data?.xp != null && data.xp > 0 && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-full mb-4">
              <span className="text-amber-500 text-base">⚡</span>
              <span className="font-bold text-amber-700 text-sm">+{data.xp} XP</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Continuer
            </button>
            {onShare && (
              <button
                onClick={() => { handleClose(); onShare(); }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe CSS injecté */}
      <style>{`
        @keyframes milestone-bounce {
          0%   { transform: scale(0.5) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
          80%  { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

export default MilestonePopup;
