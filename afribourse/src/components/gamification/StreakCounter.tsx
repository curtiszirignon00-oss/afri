// src/components/gamification/StreakCounter.tsx
// Compteur de série avec flamme animée

import { Flame, Snowflake, AlertTriangle } from 'lucide-react';
import type { StreakData } from '../../types';

interface StreakCounterProps {
  streak: StreakData;
  size?: 'sm' | 'md' | 'lg';
  showFreezes?: boolean;
  showWarning?: boolean;
  className?: string;
}

export function StreakCounter({
  streak,
  size = 'md',
  showFreezes = true,
  showWarning = true,
  className = ''
}: StreakCounterProps) {
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 gap-1',
      icon: 'w-4 h-4',
      text: 'text-sm',
      subtext: 'text-xs'
    },
    md: {
      container: 'px-3 py-2 gap-2',
      icon: 'w-5 h-5',
      text: 'text-base',
      subtext: 'text-sm'
    },
    lg: {
      container: 'px-4 py-3 gap-3',
      icon: 'w-7 h-7',
      text: 'text-xl',
      subtext: 'text-base'
    }
  };

  const sizes = sizeClasses[size];

  // Couleur de la flamme basée sur la longueur du streak
  const getFlameColor = (days: number): string => {
    if (days >= 100) return 'text-purple-500';
    if (days >= 30) return 'text-red-500';
    if (days >= 7) return 'text-orange-500';
    if (days >= 3) return 'text-amber-500';
    return 'text-yellow-500';
  };

  const flameColor = getFlameColor(streak.current_streak);

  // Animation CSS pour la flamme
  const flameAnimation = streak.current_streak > 0 ? 'animate-pulse' : '';

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Compteur principal */}
      <div className={`inline-flex items-center bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 ${sizes.container}`}>
        <Flame className={`${sizes.icon} ${flameColor} ${flameAnimation}`} />
        <div className="flex flex-col">
          <span className={`font-bold ${sizes.text} text-gray-800`}>
            {streak.current_streak} jour{streak.current_streak !== 1 ? 's' : ''}
          </span>
          {streak.longest_streak > streak.current_streak && (
            <span className={`${sizes.subtext} text-gray-500`}>
              Record: {streak.longest_streak} jours
            </span>
          )}
        </div>

        {/* Indicateur freezes */}
        {showFreezes && streak.streak_freezes > 0 && (
          <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-blue-100 rounded-lg">
            <Snowflake className={`${sizes.icon} text-blue-500`} />
            <span className={`${sizes.subtext} font-medium text-blue-700`}>
              {streak.streak_freezes}
            </span>
          </div>
        )}
      </div>

      {/* Avertissement streak à risque */}
      {showWarning && streak.streak_at_risk && streak.current_streak > 0 && (
        <div className="flex items-center gap-1.5 mt-2 text-amber-600">
          <AlertTriangle className="w-4 h-4" />
          <span className={`${sizes.subtext}`}>
            {streak.streak_freezes > 0
              ? `Série à risque! Vous avez ${streak.streak_freezes} freeze(s) disponible(s).`
              : 'Série à risque! Faites une activité pour la maintenir.'}
          </span>
        </div>
      )}
    </div>
  );
}

export default StreakCounter;
