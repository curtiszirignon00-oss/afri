// src/components/challenge/Leaderboard.tsx
//
// Classement du challenge, dans l'anatomie de la liste des actions : une carte
// unique, une ligne par participant separee par un filet, identite a gauche et
// chiffres alignes a droite. Les trois premiers gardent un insigne, les autres
// un simple numero en chiffres tabulaires.
import { Crown, Medal, Flame, BadgeCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useLeaderboard, useMyRank, useChallengeStats } from '../../hooks/useChallenge';

interface LeaderboardProps {
    limit?: number;
    showMyRank?: boolean;
}

const RANK_ICONS: Record<number, () => React.ReactNode> = {
    1: () => <Crown className="w-5 h-5 text-brand-orange" />,
    2: () => <Medal className="w-5 h-5 text-gray-400" />,
    3: () => <Medal className="w-5 h-5 text-brand-orange-dark" />,
};

function Avatar({ url, name }: { url?: string | null; name: string }) {
    return (
        <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-navy to-[#173F66] flex items-center justify-center overflow-hidden shrink-0">
            {url ? (
                <img src={url} alt="" className="w-full h-full object-cover" />
            ) : (
                <span className="text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
            )}
        </span>
    );
}

export function Leaderboard({ limit = 10, showMyRank = true }: LeaderboardProps) {
    const { data: rankings, isLoading, isError, refetch } = useLeaderboard(limit);
    const { data: myRank } = useMyRank();
    const { data: stats } = useChallengeStats();

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-4">Impossible de charger le classement.</p>
                <button
                    onClick={() => refetch()}
                    className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navy-hover transition-colors"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    if (!rankings || rankings.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                <p className="text-gray-700 font-medium">
                    Le classement s'affichera dès les premières transactions.
                </p>
                {stats && (
                    <p className="text-sm text-gray-400 mt-1">
                        {stats.activeParticipants} participant{stats.activeParticipants > 1 ? 's' : ''} inscrit
                        {stats.activeParticipants > 1 ? 's' : ''}, à vos ordres.
                    </p>
                )}
            </div>
        );
    }

    const isDay1 = rankings.every((e) => e.gainLossPercent === 0);

    return (
        <div className="space-y-4">
            {isDay1 && (
                <div className="bg-white rounded-2xl border-2 border-brand-orange shadow-sm px-5 py-4 flex items-start gap-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                        <span className="font-semibold text-gray-900">Challenge lancé.</span>{' '}
                        Le classement évoluera dès les premières transactions.
                    </p>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* En-tete de la carte */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <h2 className="font-bold text-gray-900">
                            Top {limit} du Challenge AfriBourse 2026
                        </h2>
                    </div>
                    {showMyRank && myRank?.rank && (
                        <div className="text-sm text-gray-500">
                            Votre rang{' '}
                            <span className="font-mono font-bold text-brand-navy tabular-nums">
                                #{myRank.rank}
                            </span>
                            {myRank.totalParticipants > 0 && (
                                <span className="text-gray-400 font-mono"> / {myRank.totalParticipants}</span>
                            )}
                            {myRank.percentile !== undefined && (
                                <span className="text-gray-400"> · Top {(100 - myRank.percentile).toFixed(1)}%</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Lignes */}
                <ul className="divide-y divide-gray-100">
                    {rankings.map((entry) => {
                        const isPositive = entry.gainLossPercent >= 0;
                        const decoration = RANK_ICONS[entry.rank];

                        return (
                            <li
                                key={entry.userId}
                                className="flex items-center gap-4 sm:gap-5 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                            >
                                {/* Rang */}
                                <span className="w-8 flex justify-center shrink-0">
                                    {decoration ? (
                                        decoration()
                                    ) : (
                                        <span className="text-sm font-mono text-gray-300 tabular-nums">
                                            {entry.rank}
                                        </span>
                                    )}
                                </span>

                                <Avatar url={entry.avatar_url} name={entry.name} />

                                {/* Identite */}
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900 truncate">
                                            {entry.name} {entry.lastname}
                                        </span>
                                        {entry.isEligible && (
                                            <BadgeCheck
                                                className="w-4 h-4 text-brand-navy shrink-0"
                                                aria-label="Éligible aux prix"
                                            />
                                        )}
                                        {entry.top3Streak >= 2 && (
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange-dark text-xs font-semibold shrink-0"
                                                title={`${entry.top3Streak} jours consécutifs dans le top ${entry.streakRank}`}
                                            >
                                                <Flame className="w-3 h-3" />
                                                {entry.top3Streak}j
                                            </span>
                                        )}
                                    </span>
                                    <span className="block text-xs text-gray-400 mt-1 truncate">
                                        {entry.username
                                            ? `@${entry.username}`
                                            : `${entry.validTransactions} transaction${entry.validTransactions > 1 ? 's' : ''}`}
                                    </span>
                                </span>

                                {/* Performance */}
                                <span className="text-right shrink-0">
                                    <span
                                        className={`block text-lg font-bold font-mono tabular-nums leading-none ${
                                            entry.gainLossPercent === 0
                                                ? 'text-gray-400'
                                                : isPositive
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        {entry.gainLossPercent !== 0 && (isPositive ? '▲ ' : '▼ ')}
                                        {isPositive ? '+' : ''}
                                        {entry.gainLossPercent.toFixed(2)}%
                                    </span>
                                    <span className="block text-xs font-mono text-gray-400 tabular-nums mt-1.5">
                                        {entry.totalValue.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ul>

                {/* Pied de carte */}
                {stats && (
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-mono tabular-nums text-gray-700">{stats.activeParticipants}</span>
                        <span>actif{stats.activeParticipants > 1 ? 's' : ''}</span>
                        <span className="text-gray-300">·</span>
                        <span className="font-mono tabular-nums text-gray-700">{stats.eligibleParticipants}</span>
                        <span>éligible{stats.eligibleParticipants > 1 ? 's' : ''}</span>
                        <span className="text-gray-300">·</span>
                        <span className="font-mono tabular-nums text-gray-700">{stats.totalTransactions}</span>
                        <span>transaction{stats.totalTransactions > 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
