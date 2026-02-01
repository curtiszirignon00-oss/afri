// src/components/gamification/RewardCard.tsx
// Carte récompense

import { Zap, Lock, Check, Gift, DollarSign, Snowflake, Palette, MessageSquare } from 'lucide-react';
import type { Reward, RewardType } from '../../types';

interface RewardCardProps {
  reward: Reward;
  userXP: number;
  alreadyClaimed?: boolean;
  onClaim?: () => void;
  isClaimLoading?: boolean;
  className?: string;
}

export function RewardCard({
  reward,
  userXP,
  alreadyClaimed = false,
  onClaim,
  isClaimLoading = false,
  className = ''
}: RewardCardProps) {
  const canAfford = userXP >= reward.xp_required;
  const isAvailable = reward.is_active;
  const canClaim = canAfford && isAvailable && !alreadyClaimed;

  // Icône selon le type de récompense
  const getRewardIcon = (type: RewardType): React.ReactNode => {
    switch (type) {
      case 'virtual_cash':
        return <DollarSign className="w-8 h-8" />;
      case 'freeze':
        return <Snowflake className="w-8 h-8" />;
      case 'consultation':
        return <MessageSquare className="w-8 h-8" />;
      case 'cosmetic':
        return <Palette className="w-8 h-8" />;
      default:
        return <Gift className="w-8 h-8" />;
    }
  };

  // Couleur selon le type
  const getRewardColors = (type: RewardType): { bg: string; icon: string; border: string } => {
    switch (type) {
      case 'virtual_cash':
        return { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' };
      case 'freeze':
        return { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' };
      case 'consultation':
        return { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' };
      case 'cosmetic':
        return { bg: 'bg-pink-50', icon: 'text-pink-600', border: 'border-pink-200' };
      default:
        return { bg: 'bg-gray-50', icon: 'text-gray-600', border: 'border-gray-200' };
    }
  };

  const colors = getRewardColors(reward.reward_type);
  const icon = getRewardIcon(reward.reward_type);

  // Formatage de la valeur depuis reward_data
  const formatRewardValue = (data: any, type: RewardType): string => {
    if (type === 'virtual_cash' && data?.amount) {
      return `+${data.amount.toLocaleString()} ${data.currency || 'FCFA'}`;
    }
    if (type === 'freeze' && data?.quantity) {
      return `${data.quantity} freeze${data.quantity > 1 ? 's' : ''}`;
    }
    if (type === 'consultation' && data?.duration_minutes) {
      return `${data.duration_minutes} min`;
    }
    return '';
  };

  return (
    <div
      className={`
        relative rounded-xl border-2 overflow-hidden transition-all duration-300
        ${canClaim ? `${colors.bg} ${colors.border} hover:shadow-lg` : 'bg-gray-50 border-gray-200'}
        ${alreadyClaimed ? 'opacity-60' : ''}
        ${className}
      `}
    >
      {/* Badge épuisé ou déjà réclamé */}
      {(!isAvailable || alreadyClaimed) && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
          {alreadyClaimed ? 'Réclamé' : 'Épuisé'}
        </div>
      )}

      <div className="p-4">
        {/* Icône et Valeur */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl ${colors.bg} ${colors.icon}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{reward.title}</h3>
            <p className="text-lg font-semibold text-gray-700">
              {formatRewardValue(reward.reward_data, reward.reward_type)}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">
          {reward.description}
        </p>

        {/* Tier */}
        {reward.tier && (
          <p className="text-xs text-gray-500 mb-3">
            Tier {reward.tier}
          </p>
        )}

        {/* Coût et bouton */}
        <div className="flex items-center justify-between">
          {/* Coût XP */}
          <div className={`flex items-center gap-1.5 ${canAfford ? 'text-amber-600' : 'text-gray-400'}`}>
            <Zap className="w-5 h-5" />
            <span className="font-bold text-lg">{reward.xp_required.toLocaleString()}</span>
            <span className="text-sm">XP</span>
          </div>

          {/* Bouton d'action */}
          {alreadyClaimed ? (
            <div className="flex items-center gap-1 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Réclamé</span>
            </div>
          ) : !canAfford ? (
            <div className="flex items-center gap-1 text-gray-400">
              <Lock className="w-4 h-4" />
              <span className="text-sm">
                {(reward.xp_required - userXP).toLocaleString()} XP manquants
              </span>
            </div>
          ) : !isAvailable ? (
            <span className="text-gray-400 text-sm">Indisponible</span>
          ) : (
            <button
              onClick={onClaim}
              disabled={isClaimLoading}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-amber-500 text-white font-medium
                hover:bg-amber-600 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <Gift className="w-4 h-4" />
              {isClaimLoading ? 'Chargement...' : 'Échanger'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RewardCard;
