// src/pages/LeaderboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Trophy, TrendingUp, Crown, Medal,
    Loader2, ArrowLeft, Users
} from 'lucide-react';
import { apiClient } from '../lib/api-client';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatar_url: string | null;
    level: number;
    total_xp: number;
    title: string;
    title_emoji: string;
}

interface LeaderboardResponse {
    type: string;
    entries: LeaderboardEntry[];
    total_participants: number;
    updated_at: string;
}

const RANK_DECORATIONS: Record<number, { icon: React.ReactNode; bg: string; ring: string }> = {
    1: { icon: <Crown className="w-5 h-5 text-amber-500" />, bg: 'bg-gradient-to-br from-amber-50 to-yellow-50', ring: 'ring-2 ring-amber-300' },
    2: { icon: <Medal className="w-5 h-5 text-gray-400" />, bg: 'bg-gradient-to-br from-gray-50 to-slate-50', ring: 'ring-2 ring-gray-300' },
    3: { icon: <Medal className="w-5 h-5 text-orange-400" />, bg: 'bg-gradient-to-br from-orange-50 to-amber-50', ring: 'ring-2 ring-orange-300' },
};

export default function LeaderboardPage() {
    const { data, isLoading } = useQuery<LeaderboardResponse>({
        queryKey: ['leaderboard-page-roi'],
        queryFn: async () => {
            const response = await apiClient.get<LeaderboardResponse>(
                '/gamification/leaderboard/roi?limit=10'
            );
            return response.data;
        },
    });

    const entries = data?.entries || [];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        to="/community"
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-amber-500" />
                            Top 10 des meilleurs portfolios
                        </h1>
                        <p className="text-sm text-gray-500">
                            Simulateur de portefeuille
                        </p>
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && entries.length === 0 && (
                    <div className="text-center py-16">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Aucun participant pour le moment</p>
                        <p className="text-sm text-gray-400 mt-1">Le classement sera disponible bientôt</p>
                    </div>
                )}

                {/* Leaderboard list */}
                {!isLoading && entries.length > 0 && (
                    <div className="space-y-2">
                        {entries.map((entry) => {
                            const roi = entry.total_xp / 100;
                            const isPositive = roi >= 0;
                            const decoration = RANK_DECORATIONS[entry.rank];

                            return (
                                <Link
                                    key={entry.userId}
                                    to={`/profile/${entry.userId}`}
                                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all hover:shadow-md ${
                                        decoration
                                            ? `${decoration.bg} ${decoration.ring}`
                                            : 'bg-white border border-gray-100 hover:border-gray-200'
                                    }`}
                                >
                                    {/* Rank */}
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        !decoration ? 'bg-gray-100' : ''
                                    }`}>
                                        {decoration?.icon || (
                                            <span className="text-sm font-bold text-gray-400">{entry.rank}</span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {entry.avatar_url ? (
                                            <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-indigo-600">
                                                {entry.username.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate text-sm">
                                            {entry.username}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {entry.title_emoji} Niv. {entry.level} · {entry.title}
                                        </p>
                                    </div>

                                    {/* ROI */}
                                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold flex-shrink-0 ${
                                        isPositive
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-red-50 text-red-600'
                                    }`}>
                                        <TrendingUp className={`w-3.5 h-3.5 ${!isPositive ? 'rotate-180' : ''}`} />
                                        {isPositive ? '+' : ''}{roi.toFixed(1)}%
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
