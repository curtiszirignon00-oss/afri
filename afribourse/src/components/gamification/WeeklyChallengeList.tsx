// src/components/gamification/WeeklyChallengeList.tsx
// Liste des défis de la semaine

import { Target, Clock, Gift, Zap } from 'lucide-react';
import { WeeklyChallengeCard } from './WeeklyChallengeCard';
import type { ChallengeProgress } from '../../types';

interface WeeklyChallengeListProps {
  challenges: ChallengeProgress[];
  onClaimReward: (challengeId: string) => void;
  onClaimAll?: () => void;
  claimingId?: string | null;
  className?: string;
}

export function WeeklyChallengeList({
  challenges,
  onClaimReward,
  onClaimAll,
  claimingId,
  className = ''
}: WeeklyChallengeListProps) {
  // Stats
  const totalChallenges = challenges.length;
  const completedChallenges = challenges.filter(c => c.completed).length;
  const claimableChallenges = challenges.filter(c => c.completed && !c.claimed);
  const totalClaimableXP = claimableChallenges.reduce((sum, c) => sum + c.challenge.xp_reward, 0);

  // Temps restant dans la semaine
  const getTimeRemaining = (): string => {
    if (challenges.length === 0) return '';

    const endDate = new Date(challenges[0].challenge.end_date);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();

    if (diffMs <= 0) return 'Expiré';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}j ${hours}h restants`;
    return `${hours}h restantes`;
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Défis de la semaine</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{completedChallenges}/{totalChallenges} complétés</span>
              {challenges.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{getTimeRemaining()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bouton réclamer tout */}
        {claimableChallenges.length > 1 && onClaimAll && (
          <button
            onClick={onClaimAll}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            <Gift className="w-5 h-5" />
            <span>Réclamer tout</span>
            <span className="flex items-center gap-1 ml-1 px-2 py-0.5 bg-green-500 rounded-lg">
              <Zap className="w-3 h-3" />
              <span className="text-sm">+{totalClaimableXP}</span>
            </span>
          </button>
        )}
      </div>

      {/* Progress bar global */}
      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progression globale</span>
          <span className="font-medium text-indigo-600">
            {Math.round((completedChallenges / totalChallenges) * 100)}%
          </span>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedChallenges / totalChallenges) * 100}%` }}
          />
        </div>
      </div>

      {/* Liste des défis */}
      <div className="grid gap-4">
        {challenges.map(progress => (
          <WeeklyChallengeCard
            key={progress.id}
            progress={progress}
            onClaim={() => onClaimReward(progress.challengeId)}
            isClaimLoading={claimingId === progress.challengeId}
          />
        ))}
      </div>

      {/* Message si tous complétés */}
      {completedChallenges === totalChallenges && totalChallenges > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
          <span className="text-4xl">🎉</span>
          <p className="mt-2 text-green-700 font-medium">
            Félicitations ! Vous avez complété tous les défis de la semaine !
          </p>
        </div>
      )}

      {/* Message si aucun défi */}
      {totalChallenges === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun défi disponible cette semaine</p>
          <p className="text-sm mt-1">Les nouveaux défis arrivent chaque lundi</p>
        </div>
      )}
    </div>
  );
}

export default WeeklyChallengeList;
