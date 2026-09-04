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
  const { title, icon: LevelIcon } = useMemo(() => getLevelTitle(level), [level]);



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
      <span className={`${baseClasses} border border-ink-200 bg-white text-brand-navy`}>
        {showEmoji && <LevelIcon className="w-3.5 h-3.5 shrink-0" />}
        <span>Niv. {level}</span>
        {showTitle && <span className="hidden sm:inline">- {title}</span>}
      </span>
    );
  }

  return (
    <span className={`${baseClasses} bg-brand-navy text-white`}>
      {showEmoji && <LevelIcon className="w-3.5 h-3.5 shrink-0" />}
      <span>Niv. {level}</span>
      {showTitle && <span className="hidden sm:inline">- {title}</span>}
    </span>
  );
}

export default LevelBadge;
