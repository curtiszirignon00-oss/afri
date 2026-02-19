// src/components/community/WeeklyLeaderboard.tsx
import { Trophy, TrendingUp, Crown, Medal, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWeeklyLeaderboard } from '../../hooks/useWeeklyLeaderboard';

const RANK_STYLES: Record<number, { icon: React.ReactNode; bg: string; text: string }> = {
    1: { icon: <Crown className="w-4 h-4 text-amber-500" />, bg: 'bg-amber-50', text: 'text-amber-700' },
    2: { icon: <Medal className="w-4 h-4 text-gray-400" />, bg: 'bg-gray-50', text: 'text-gray-600' },
    3: { icon: <Medal className="w-4 h-4 text-orange-400" />, bg: 'bg-orange-50', text: 'text-orange-600' },
};

export default function WeeklyLeaderboard() {
    const { data, isLoading } = useWeeklyLeaderboard(5);

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-gray-900">Top 5 Portfolios</h3>
                </div>
                <div className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    const entries = data?.entries || [];

    if (entries.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-gray-900 text-sm">Top 5 Portfolios</h3>
                </div>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                    Simulateur
                </span>
            </div>

            {/* Leaderboard entries */}
            <div className="space-y-2">
                {entries.map((entry) => {
                    const roi = entry.total_xp / 100; // total_xp stores ROI * 100
                    const rankStyle = RANK_STYLES[entry.rank];
                    const isPositive = roi >= 0;

                    return (
                        <Link
                            key={entry.userId}
                            to={`/profile/${entry.userId}`}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                            {/* Rank */}
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${rankStyle?.bg || 'bg-gray-50'}`}>
                                {rankStyle?.icon || (
                                    <span className="text-xs font-bold text-gray-400">{entry.rank}</span>
                                )}
                            </div>

                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {entry.avatar_url ? (
                                    <img
                                        src={entry.avatar_url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs font-bold text-indigo-600">
                                        {entry.username.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Name + Level */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                    {entry.username}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                    Niv. {entry.level} · {entry.title}
                                </p>
                            </div>

                            {/* ROI */}
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                                isPositive
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-red-50 text-red-600'
                            }`}>
                                <TrendingUp className={`w-3 h-3 ${!isPositive ? 'rotate-180' : ''}`} />
                                {isPositive ? '+' : ''}{roi.toFixed(1)}%
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Footer */}
            {(data?.total_participants || 0) > 5 && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                    <Link
                        to="/classement"
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Voir le classement complet →
                    </Link>
                </div>
            )}
        </div>
    );
}
