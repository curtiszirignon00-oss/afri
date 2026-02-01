// src/components/gamification/WeeklyChallengeCard.tsx
// Carte défi avec progression

import { Zap, CheckCircle, Gift, BookOpen, TrendingUp, Users, Flame } from 'lucide-react';
import type { ChallengeProgress, GamificationChallengeType } from '../../types';

interface WeeklyChallengeCardProps {
  progress: ChallengeProgress;
  onClaim?: () => void;
  isClaimLoading?: boolean;
  className?: string;
}

export function WeeklyChallengeCard({
  progress,
  onClaim,
  isClaimLoading = false,
  className = ''
}: WeeklyChallengeCardProps) {
  const { challenge, current, completed, claimed } = progress;

  // Pourcentage de progression
  const progressPercent = Math.min((current / challenge.target) * 100, 100);

  // Icône selon le type de défi
  const getChallengeIcon = (type: GamificationChallengeType): React.ReactNode => {
    switch (type) {
      case 'module':
        return <BookOpen className="w-5 h-5" />;
      case 'quiz':
        return <CheckCircle className="w-5 h-5" />;
      case 'trade':
        return <TrendingUp className="w-5 h-5" />;
      case 'social':
        return <Users className="w-5 h-5" />;
      case 'streak':
        return <Flame className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  // Couleur selon le type
  const getChallengeColor = (type: GamificationChallengeType): string => {
    switch (type) {
      case 'module':
        return 'from-blue-500 to-blue-400';
      case 'quiz':
        return 'from-green-500 to-green-400';
      case 'trade':
        return 'from-purple-500 to-purple-400';
      case 'social':
        return 'from-pink-500 to-pink-400';
      case 'streak':
        return 'from-orange-500 to-orange-400';
      default:
        return 'from-gray-500 to-gray-400';
    }
  };

  const gradientColor = getChallengeColor(challenge.challenge_type);
  const icon = getChallengeIcon(challenge.challenge_type);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        {/* Icône et titre */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradientColor} text-white`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{challenge.title}</h3>
            <p className="text-sm text-gray-500">{challenge.description}</p>
          </div>
        </div>

        {/* Badge complété ou récompense */}
        {completed && !claimed && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full animate-pulse">
            Terminé !
          </span>
        )}
        {claimed && (
          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
            Réclamé
          </span>
        )}
      </div>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{current} / {challenge.target}</span>
          <span className="font-medium text-gray-700">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${gradientColor} rounded-full transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Récompense et bouton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-amber-600">
          <Zap className="w-4 h-4" />
          <span className="font-semibold">+{challenge.xp_reward} XP</span>
        </div>

        {completed && !claimed && onClaim && (
          <button
            onClick={onClaim}
            disabled={isClaimLoading}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-lg
              bg-green-600 text-white font-medium
              hover:bg-green-700 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <Gift className="w-4 h-4" />
            {isClaimLoading ? 'Chargement...' : 'Réclamer'}
          </button>
        )}
      </div>
    </div>
  );
}

export default WeeklyChallengeCard;
