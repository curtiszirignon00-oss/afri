// src/components/gamification/StreakFreezeIndicator.tsx
// Indicateur des freezes disponibles

import { Snowflake, Plus } from 'lucide-react';

interface StreakFreezeIndicatorProps {
  freezesCount: number;
  maxFreezes?: number;
  onBuyFreeze?: () => void;
  showBuyButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StreakFreezeIndicator({
  freezesCount,
  maxFreezes = 5,
  onBuyFreeze,
  showBuyButton = false,
  size = 'md',
  className = ''
}: StreakFreezeIndicatorProps) {
  const sizeClasses = {
    sm: {
      container: 'gap-0.5',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      container: 'gap-1',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    lg: {
      container: 'gap-1.5',
      icon: 'w-6 h-6',
      text: 'text-base'
    }
  };

  const sizes = sizeClasses[size];

  // Créer les indicateurs visuels des freezes
  const freezeIndicators = Array.from({ length: maxFreezes }, (_, index) => {
    const isActive = index < freezesCount;
    return (
      <div
        key={index}
        className={`
          p-1 rounded-lg transition-all duration-300
          ${isActive
            ? 'bg-brand-navy/10 text-brand-navy'
            : 'bg-ink-100 text-ink-300'}
        `}
      >
        <Snowflake className={sizes.icon} />
      </div>
    );
  });

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className={`flex items-center ${sizes.text} text-ink-600 mb-1`}>
        <span className="font-medium">Protections de série</span>
        <span className="ml-1 text-ink-400">({freezesCount}/{maxFreezes})</span>
      </div>

      <div className={`flex items-center ${sizes.container}`}>
        {freezeIndicators}

        {showBuyButton && freezesCount < maxFreezes && onBuyFreeze && (
          <button
            onClick={onBuyFreeze}
            className={`
              p-1 rounded-lg bg-brand-orange/10 text-brand-orange-dark
              hover:bg-brand-orange/20 transition-colors
              ml-1
            `}
            title="Acheter un freeze (300 XP)"
          >
            <Plus className={sizes.icon} />
          </button>
        )}
      </div>

      <p className={`${sizes.text} text-ink-400 mt-1`}>
        Les freezes protègent votre série quand vous ratez un jour
      </p>
    </div>
  );
}

export default StreakFreezeIndicator;
