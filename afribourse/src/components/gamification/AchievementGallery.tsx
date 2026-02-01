// src/components/gamification/AchievementGallery.tsx
// Galerie de tous les badges

import { useState, useMemo } from 'react';
import { Trophy, BookOpen, TrendingUp, Users, Flame, Star } from 'lucide-react';
import { AchievementCard } from './AchievementCard';
import type { Achievement, UserAchievement, AchievementCategory } from '../../types';

interface AchievementGalleryProps {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  onAchievementClick?: (achievement: Achievement) => void;
  className?: string;
}

export function AchievementGallery({
  achievements,
  userAchievements,
  onAchievementClick,
  className = ''
}: AchievementGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  // Map des achievements débloqués par code
  const unlockedMap = useMemo(() => {
    const map = new Map<string, UserAchievement>();
    userAchievements.forEach(ua => {
      map.set(ua.achievement.code, ua);
    });
    return map;
  }, [userAchievements]);

  // Catégories avec icônes
  const categories: { key: AchievementCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tous', icon: <Trophy className="w-4 h-4" /> },
    { key: 'formation', label: 'Formation', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'trading', label: 'Trading', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'social', label: 'Social', icon: <Users className="w-4 h-4" /> },
    { key: 'engagement', label: 'Engagement', icon: <Flame className="w-4 h-4" /> },
    { key: 'special', label: 'Spéciaux', icon: <Star className="w-4 h-4" /> }
  ];

  // Filtrer par catégorie
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return achievements;
    return achievements.filter(a => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  // Trier: débloqués en premier, puis par rareté
  const sortedAchievements = useMemo(() => {
    const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
    return [...filteredAchievements].sort((a, b) => {
      const aUnlocked = unlockedMap.has(a.code) ? 0 : 1;
      const bUnlocked = unlockedMap.has(b.code) ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });
  }, [filteredAchievements, unlockedMap]);

  // Stats
  const stats = useMemo(() => {
    const total = achievements.length;
    const unlocked = userAchievements.length;
    const categoryStats = categories.slice(1).map(cat => ({
      category: cat.key,
      total: achievements.filter(a => a.category === cat.key).length,
      unlocked: userAchievements.filter(ua => ua.achievement.category === cat.key).length
    }));
    return { total, unlocked, categoryStats };
  }, [achievements, userAchievements, categories]);

  return (
    <div className={className}>
      {/* Stats globales */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Trophy className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Badges débloqués</h3>
            <p className="text-sm text-gray-600">
              Collectez des badges en progressant sur AfriBourse
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-amber-600">{stats.unlocked}</span>
          <span className="text-xl text-gray-400">/{stats.total}</span>
          <p className="text-sm text-gray-500">
            {Math.round((stats.unlocked / stats.total) * 100)}% complété
          </p>
        </div>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg
              text-sm font-medium transition-all
              ${selectedCategory === cat.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
          >
            {cat.icon}
            <span>{cat.label}</span>
            {cat.key !== 'all' && (
              <span className={`ml-1 text-xs ${selectedCategory === cat.key ? 'text-blue-200' : 'text-gray-400'}`}>
                ({stats.categoryStats.find(s => s.category === cat.key)?.unlocked || 0}/
                {stats.categoryStats.find(s => s.category === cat.key)?.total || 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grille des badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sortedAchievements.map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            userAchievement={unlockedMap.get(achievement.code)}
            isUnlocked={unlockedMap.has(achievement.code)}
            onClick={() => onAchievementClick?.(achievement)}
            size="md"
          />
        ))}
      </div>

      {/* Message si aucun badge */}
      {sortedAchievements.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun badge dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}

export default AchievementGallery;
