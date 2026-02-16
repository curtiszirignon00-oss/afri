// src/components/gamification/NextAchievements.tsx
// Composant affichant les 3 prochains badges les plus proches

import { Target, Zap } from 'lucide-react';
import { useNextAchievements } from '../../hooks/useGamification';
import { RARITY_COLORS } from '../../types';
import type { AchievementRarity } from '../../types';

export function NextAchievements() {
  const { data: nextBadges, isLoading } = useNextAchievements(3);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!nextBadges || nextBadges.length === 0) {
    return null;
  }

  const rarityLabels: Record<string, string> = {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Epique',
    legendary: 'Legendaire'
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Target className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Prochains Badges</h3>
          <p className="text-sm text-gray-500">Vos objectifs les plus proches</p>
        </div>
      </div>

      <div className="space-y-4">
        {nextBadges.map((item) => {
          const rarityColors = RARITY_COLORS[item.achievement.rarity as AchievementRarity] || RARITY_COLORS.common;

          return (
            <div
              key={item.achievement.id}
              className="relative rounded-xl border border-gray-100 p-3 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="text-2xl flex-shrink-0 mt-0.5">
                  {item.achievement.icon || '🏆'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900 truncate">
                      {item.achievement.name}
                    </h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${rarityColors.bg} ${rarityColors.text}`}>
                      {rarityLabels[item.achievement.rarity]}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">{item.achievement.description}</p>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        item.percent >= 80 ? 'bg-emerald-500' :
                        item.percent >= 50 ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {item.remaining}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-600">
                        {item.percent}%
                      </span>
                      {item.achievement.xp_reward > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600">
                          <Zap className="w-3 h-3" />
                          +{item.achievement.xp_reward}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NextAchievements;
