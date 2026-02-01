// src/components/gamification/LevelBadge.tsx
// Badge de niveau avec titre et couleur

import { useMemo } from 'react';
import { getLevelTitle } from '../../hooks/useGamification';

interface LevelBadgeProps {
  level: number;
  showTitle?: boolean;
  showEmoji?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline';
  className?: string;
}

export function LevelBadge({
  level,
  showTitle = true,
  showEmoji = true,
  size = 'md',
  variant = 'filled',
  className = ''
}: LevelBadgeProps) {
  const { title, emoji } = useMemo(() => getLevelTitle(level), [level]);

  // Couleurs par niveau
  const getLevelColors = (lvl: number) => {
    if (lvl >= 100) return { bg: 'bg-yellow-500', text: 'text-yellow-900', border: 'border-yellow-500' };
    if (lvl >= 80) return { bg: 'bg-cyan-500', text: 'text-cyan-900', border: 'border-cyan-500' };
    if (lvl >= 65) return { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500' };
    if (lvl >= 50) return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500' };
    if (lvl >= 40) return { bg: 'bg-amber-500', text: 'text-amber-900', border: 'border-amber-500' };
    if (lvl >= 30) return { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-500' };
    if (lvl >= 20) return { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-500' };
    if (lvl >= 10) return { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-500' };
    if (lvl >= 5) return { bg: 'bg-green-500', text: 'text-white', border: 'border-green-500' };
    return { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-400' };
  };

  const colors = getLevelColors(level);

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  const baseClasses = `
    inline-flex items-center gap-1 font-semibold rounded-full
    ${sizeClasses[size]}
    ${className}
  `.trim();

  if (variant === 'outline') {
    return (
      <span className={`${baseClasses} border-2 ${colors.border} bg-transparent text-gray-700`}>
        {showEmoji && <span>{emoji}</span>}
        <span>Niv. {level}</span>
        {showTitle && <span className="hidden sm:inline">- {title}</span>}
      </span>
    );
  }

  return (
    <span className={`${baseClasses} ${colors.bg} ${colors.text}`}>
      {showEmoji && <span>{emoji}</span>}
      <span>Niv. {level}</span>
      {showTitle && <span className="hidden sm:inline">- {title}</span>}
    </span>
  );
}

export default LevelBadge;
