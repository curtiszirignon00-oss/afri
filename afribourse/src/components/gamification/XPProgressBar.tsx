// src/components/gamification/XPProgressBar.tsx
// Barre de progression XP vers le niveau suivant

import { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { getLevelTitle } from '../../hooks/useGamification';
import type { XPStats } from '../../types';

interface XPProgressBarProps {
  stats: XPStats;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function XPProgressBar({
  stats,
  showDetails = true,
  size = 'md',
  className = ''
}: XPProgressBarProps) {
  const { title, emoji } = useMemo(() => getLevelTitle(stats.level), [stats.level]);

  const sizeClasses = {
    sm: {
      container: 'h-2',
      text: 'text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      container: 'h-3',
      text: 'text-sm',
      icon: 'w-4 h-4'
    },
    lg: {
      container: 'h-4',
      text: 'text-base',
      icon: 'w-5 h-5'
    }
  };

  const sizes = sizeClasses[size];

  // Couleur du niveau
  const getLevelColor = (level: number): string => {
    if (level >= 80) return 'from-cyan-500 to-cyan-400';
    if (level >= 65) return 'from-red-500 to-red-400';
    if (level >= 50) return 'from-orange-500 to-orange-400';
    if (level >= 40) return 'from-amber-500 to-amber-400';
    if (level >= 30) return 'from-purple-500 to-purple-400';
    if (level >= 20) return 'from-indigo-500 to-indigo-400';
    if (level >= 10) return 'from-blue-500 to-blue-400';
    if (level >= 5) return 'from-green-500 to-green-400';
    return 'from-gray-500 to-gray-400';
  };

  const gradientColor = getLevelColor(stats.level);

  return (
    <div className={`w-full ${className}`}>
      {showDetails && (
        <div className={`flex items-center justify-between mb-1 ${sizes.text}`}>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-700">
              {emoji} Niveau {stats.level}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{title}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600">
            <Zap className={sizes.icon} />
            <span className="font-semibold">{stats.total_xp.toLocaleString()} XP</span>
          </div>
        </div>
      )}

      {/* Barre de progression */}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizes.container}`}>
        <div
          className={`h-full bg-gradient-to-r ${gradientColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(Math.max(stats.progress_percent, 0), 100)}%` }}
        />
      </div>

      {showDetails && (
        <div className={`flex justify-between mt-1 ${sizes.text} text-gray-400`}>
          <span>{stats.total_xp.toLocaleString()} XP</span>
          <span>{stats.xp_for_next_level.toLocaleString()} XP</span>
        </div>
      )}
    </div>
  );
}

export default XPProgressBar;
