// src/components/gamification/RewardsShop.tsx
// Boutique de récompenses

import { useState, useMemo } from 'react';
import { Store, Zap, DollarSign, Snowflake, MessageSquare, Palette, Gift } from 'lucide-react';
import { RewardCard } from './RewardCard';
import type { Reward, UserReward, RewardType } from '../../types';

interface RewardsShopProps {
  rewards: Reward[];
  userRewards: UserReward[];
  userXP: number;
  onClaimReward: (rewardId: string) => void;
  claimingId?: string | null;
  className?: string;
}

export function RewardsShop({
  rewards,
  userRewards,
  userXP,
  onClaimReward,
  claimingId,
  className = ''
}: RewardsShopProps) {
  const [selectedCategory, setSelectedCategory] = useState<RewardType | 'all'>('all');

  // Set des récompenses déjà réclamées
  const claimedRewardIds = useMemo(() => {
    const set = new Set<string>();
    userRewards.forEach(ur => set.add(ur.reward.id));
    return set;
  }, [userRewards]);

  // Catégories
  const categories: { key: RewardType | 'all'; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tout', icon: <Gift className="w-4 h-4" /> },
    { key: 'virtual_cash', label: 'Argent virtuel', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'freeze', label: 'Protections', icon: <Snowflake className="w-4 h-4" /> },
    { key: 'consultation', label: 'Consultations', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'cosmetic', label: 'Cosmétiques', icon: <Palette className="w-4 h-4" /> }
  ];

  // Filtrer par catégorie
  const filteredRewards = useMemo(() => {
    if (selectedCategory === 'all') return rewards;
    return rewards.filter(r => r.reward_type === selectedCategory);
  }, [rewards, selectedCategory]);

  // Trier: disponibles d'abord, puis par coût XP
  const sortedRewards = useMemo(() => {
    return [...filteredRewards].sort((a, b) => {
      const aAffordable = userXP >= a.xp_required ? 0 : 1;
      const bAffordable = userXP >= b.xp_required ? 0 : 1;
      if (aAffordable !== bAffordable) return aAffordable - bAffordable;
      return a.xp_required - b.xp_required;
    });
  }, [filteredRewards, userXP]);

  // Stats
  const affordableCount = rewards.filter(r => userXP >= r.xp_required && r.is_active).length;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Boutique de Récompenses</h2>
            <p className="text-sm text-gray-500">
              Échangez vos XP contre des récompenses exclusives
            </p>
          </div>
        </div>

        {/* Solde XP */}
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-xl">
          <Zap className="w-5 h-5 text-amber-600" />
          <span className="font-bold text-amber-700">{userXP.toLocaleString()} XP</span>
          <span className="text-amber-600 text-sm">disponibles</span>
        </div>
      </div>

      {/* Info récompenses accessibles */}
      {affordableCount > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-700">
            <span className="font-medium">{affordableCount} récompense{affordableCount > 1 ? 's' : ''}</span>
            {' '}accessible{affordableCount > 1 ? 's' : ''} avec vos XP actuels !
          </p>
        </div>
      )}

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
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Grille des récompenses */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedRewards.map(reward => (
          <RewardCard
            key={reward.id}
            reward={reward}
            userXP={userXP}
            alreadyClaimed={claimedRewardIds.has(reward.id)}
            onClaim={() => onClaimReward(reward.id)}
            isClaimLoading={claimingId === reward.id}
          />
        ))}
      </div>

      {/* Message si aucune récompense */}
      {sortedRewards.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Store className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune récompense dans cette catégorie</p>
        </div>
      )}

      {/* Section récompenses réclamées */}
      {userRewards.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Vos récompenses ({userRewards.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {userRewards.map(ur => (
              <div
                key={ur.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
              >
                <span>{ur.reward.icon || '🎁'}</span>
                <span className="font-medium">{ur.reward.title}</span>
                <span className="text-gray-400">
                  {new Date(ur.claimed_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RewardsShop;
