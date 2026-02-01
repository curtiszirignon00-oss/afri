// src/components/gamification/XPGainToast.tsx
// Toast notification pour gain XP

import { Zap, Trophy, ArrowUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface XPGainToastData {
  xpGained: number;
  bonusXP?: { reason: string; amount: number } | null;
  newAchievements?: string[];
  levelUp?: { oldLevel: number; newLevel: number };
}

/**
 * Affiche un toast de gain XP stylisé
 */
export function showXPGainToast(data: XPGainToastData) {
  const { xpGained, bonusXP, newAchievements, levelUp } = data;

  // Toast de base pour les XP
  if (xpGained > 0) {
    toast.custom(
      (t) => (
        <div
          className={`
            ${t.visible ? 'animate-enter' : 'animate-leave'}
            max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto
            border border-amber-200 overflow-hidden
          `}
        >
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2 bg-amber-100 rounded-full">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-amber-600">
                  +{xpGained} XP
                </p>
                {bonusXP && (
                  <p className="text-sm text-green-600">
                    +{bonusXP.amount} bonus ({bonusXP.reason})
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        duration: 3000,
        position: 'top-right',
      }
    );
  }

  // Toast pour level up
  if (levelUp) {
    setTimeout(() => {
      toast.custom(
        (t) => (
          <div
            className={`
              ${t.visible ? 'animate-enter' : 'animate-leave'}
              max-w-md w-full bg-gradient-to-r from-purple-500 to-indigo-500
              shadow-lg rounded-xl pointer-events-auto overflow-hidden
            `}
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 p-2 bg-white/20 rounded-full">
                  <ArrowUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-white">
                  <p className="text-lg font-bold">
                    Niveau {levelUp.newLevel} !
                  </p>
                  <p className="text-sm text-white/80">
                    Vous êtes passé du niveau {levelUp.oldLevel} au niveau {levelUp.newLevel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          duration: 5000,
          position: 'top-center',
        }
      );
    }, 500);
  }

  // Toast pour nouveaux achievements
  if (newAchievements && newAchievements.length > 0) {
    setTimeout(() => {
      newAchievements.forEach((achievementName, index) => {
        setTimeout(() => {
          toast.custom(
            (t) => (
              <div
                className={`
                  ${t.visible ? 'animate-enter' : 'animate-leave'}
                  max-w-md w-full bg-gradient-to-r from-amber-400 to-yellow-500
                  shadow-lg rounded-xl pointer-events-auto overflow-hidden
                `}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 p-2 bg-white/20 rounded-full">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-white">
                      <p className="text-lg font-bold">
                        Badge débloqué !
                      </p>
                      <p className="text-sm text-white/90">
                        {achievementName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ),
            {
              duration: 4000,
              position: 'top-right',
            }
          );
        }, index * 1000);
      });
    }, 1000);
  }
}

/**
 * Composant wrapper pour afficher les gains XP
 */
interface XPGainDisplayProps {
  data: XPGainToastData;
  className?: string;
}

export function XPGainDisplay({ data, className = '' }: XPGainDisplayProps) {
  const { xpGained, bonusXP, newAchievements } = data;

  if (xpGained === 0 && !bonusXP && (!newAchievements || newAchievements.length === 0)) {
    return null;
  }

  return (
    <div className={`p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-amber-600" />
        <span className="font-bold text-amber-700">Récompenses gagnées</span>
      </div>

      <div className="space-y-2">
        {xpGained > 0 && (
          <div className="flex items-center gap-2 text-amber-600">
            <span className="text-lg font-bold">+{xpGained} XP</span>
          </div>
        )}

        {bonusXP && (
          <div className="flex items-center gap-2 text-green-600">
            <span className="font-medium">+{bonusXP.amount} XP bonus</span>
            <span className="text-sm text-gray-500">({bonusXP.reason})</span>
          </div>
        )}

        {newAchievements && newAchievements.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {newAchievements.map((name, index) => (
              <span
                key={index}
                className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
              >
                <Trophy className="w-3 h-3" />
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default showXPGainToast;
