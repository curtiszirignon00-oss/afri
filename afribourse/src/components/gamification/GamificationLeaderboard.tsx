// src/components/gamification/GamificationLeaderboard.tsx
// Tableau de classement gamification (par XP)

import { useState } from 'react';
import { Trophy, Globe, MapPin, Users, Flame, Zap, Medal, Crown, Award } from 'lucide-react';
import { LevelBadge } from './LevelBadge';
import type { GamificationLeaderboardResponse, GamificationLeaderboardEntry } from '../../types';

type LeaderboardType = 'global' | 'country' | 'friends' | 'streak';

interface GamificationLeaderboardProps {
  data: GamificationLeaderboardResponse;
  currentUserId?: string;
  type?: LeaderboardType;
  onTypeChange?: (type: LeaderboardType) => void;
  loading?: boolean;
  className?: string;
}

export function GamificationLeaderboard({
  data,
  currentUserId,
  type = 'global',
  onTypeChange,
  loading = false,
  className = ''
}: GamificationLeaderboardProps) {
  const [selectedType, setSelectedType] = useState<LeaderboardType>(type);

  const handleTypeChange = (newType: LeaderboardType) => {
    setSelectedType(newType);
    onTypeChange?.(newType);
  };

  // Types de classement
  const leaderboardTypes: { key: LeaderboardType; label: string; icon: React.ReactNode }[] = [
    { key: 'global', label: 'Mondial', icon: <Globe className="w-4 h-4" /> },
    { key: 'country', label: 'Pays', icon: <MapPin className="w-4 h-4" /> },
    { key: 'friends', label: 'Amis', icon: <Users className="w-4 h-4" /> },
    { key: 'streak', label: 'Séries', icon: <Flame className="w-4 h-4" /> }
  ];

  // Médaille selon le rang
  const getRankDisplay = (rank: number): React.ReactNode => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
  };

  // Style de ligne selon le rang
  const getRowStyle = (rank: number, isCurrentUser: boolean): string => {
    if (isCurrentUser) return 'bg-blue-50 border-blue-300';
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300';
    return 'bg-white border-gray-200 hover:bg-gray-50';
  };

  return (
    <div className={className}>
      {/* Filtres de type */}
      {onTypeChange && (
        <div className="flex flex-wrap gap-2 mb-6">
          {leaderboardTypes.map(lt => (
            <button
              key={lt.key}
              onClick={() => handleTypeChange(lt.key)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg
                text-sm font-medium transition-all
                ${selectedType === lt.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {lt.icon}
              <span>{lt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Stats utilisateur */}
      {data.user_entry && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Votre position</p>
                <p className="text-2xl font-bold text-blue-600">
                  #{data.user_rank || '-'}
                </p>
              </div>
            </div>

            {data.percentile && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Percentile</p>
                <p className="text-xl font-bold text-green-600">
                  Top {(100 - data.percentile).toFixed(1)}%
                </p>
              </div>
            )}

            <div className="text-right">
              <p className="text-sm text-gray-600">Total XP</p>
              <div className="flex items-center gap-1 text-amber-600">
                <Zap className="w-5 h-5" />
                <span className="text-xl font-bold">
                  {data.user_entry.total_xp.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* En-tête du tableau */}
      <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-500 border-b border-gray-200">
        <div className="col-span-1">Rang</div>
        <div className="col-span-5">Utilisateur</div>
        <div className="col-span-2 text-center">Niveau</div>
        <div className="col-span-2 text-right">XP Total</div>
        <div className="col-span-2 text-right">Pays</div>
      </div>

      {/* Liste des entrées */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse grid grid-cols-12 gap-4 px-4 py-4">
              <div className="col-span-1 h-6 bg-gray-200 rounded" />
              <div className="col-span-5 h-6 bg-gray-200 rounded" />
              <div className="col-span-2 h-6 bg-gray-200 rounded" />
              <div className="col-span-2 h-6 bg-gray-200 rounded" />
              <div className="col-span-2 h-6 bg-gray-200 rounded" />
            </div>
          ))
        ) : (
          data.entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            return (
              <div
                key={entry.userId}
                className={`
                  grid grid-cols-12 gap-4 px-4 py-3 items-center
                  border-l-4 transition-colors
                  ${getRowStyle(entry.rank, isCurrentUser)}
                `}
              >
                {/* Rang */}
                <div className="col-span-1 flex justify-center">
                  {getRankDisplay(entry.rank)}
                </div>

                {/* Utilisateur */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {entry.avatar_url ? (
                      <img
                        src={entry.avatar_url}
                        alt={entry.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                        {entry.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${isCurrentUser ? 'text-blue-700' : 'text-gray-800'}`}>
                      {entry.username || 'Anonyme'}
                      {isCurrentUser && <span className="ml-1 text-xs text-blue-500">(vous)</span>}
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.title_emoji} {entry.title}
                    </p>
                  </div>
                </div>

                {/* Niveau */}
                <div className="col-span-2 flex justify-center">
                  <LevelBadge level={entry.level} showTitle={false} size="sm" />
                </div>

                {/* XP */}
                <div className="col-span-2 text-right">
                  <div className="flex items-center justify-end gap-1 text-amber-600">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold">
                      {entry.total_xp.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Pays */}
                <div className="col-span-2 text-right text-gray-500">
                  {entry.country || '-'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Total participants */}
      <div className="mt-4 text-center text-sm text-gray-500">
        {data.total_participants.toLocaleString()} participants au total
      </div>
    </div>
  );
}

export default GamificationLeaderboard;
