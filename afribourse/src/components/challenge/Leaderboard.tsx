// src/components/challenge/Leaderboard.tsx
import { useLeaderboard, useMyRank, useChallengeStats } from '../../hooks/useChallenge';
import './Leaderboard.css';

interface LeaderboardProps {
    limit?: number;
    showMyRank?: boolean;
}

export function Leaderboard({ limit = 20, showMyRank = true }: LeaderboardProps) {
    const { data: rankings, isLoading, isError, refetch } = useLeaderboard(limit);
    const { data: myRank } = useMyRank();
    const { data: stats } = useChallengeStats();

    if (isLoading) {
        return (
            <div className="leaderboard-loading">
                <div className="spinner" />
                <p>Chargement du classement...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="leaderboard-empty">
                <p>⚠️ Impossible de charger le classement.</p>
                <button className="leaderboard-retry-btn" onClick={() => refetch()}>
                    Réessayer
                </button>
            </div>
        );
    }

    if (!rankings || rankings.length === 0) {
        return (
            <div className="leaderboard-empty">
                <p>🚀 Le classement s'affichera dès les premières transactions.</p>
                {stats && (
                    <p className="leaderboard-empty-sub">
                        {stats.activeParticipants} participant{stats.activeParticipants > 1 ? 's' : ''} inscrit{stats.activeParticipants > 1 ? 's' : ''} — à vos ordres !
                    </p>
                )}
            </div>
        );
    }

    // Jour 1 : tous les participants sont encore à 0%
    const isDay1 = rankings.every((e) => e.gainLossPercent === 0);

    return (
        <div className="leaderboard">
            <div className="leaderboard-header">
                <h2>🏆 Top {limit} Challenge AfriBourse 2026</h2>
                {showMyRank && myRank && myRank.rank && (
                    <div className="my-rank-badge">
                        Votre rang : <strong>#{myRank.rank}</strong> / {myRank.totalParticipants}
                        {myRank.percentile !== undefined && (
                            <span className="percentile">(Top {(100 - myRank.percentile).toFixed(1)}%)</span>
                        )}
                    </div>
                )}
            </div>

            {isDay1 && (
                <div className="leaderboard-day1-banner">
                    🚀 Challenge lancé aujourd'hui ! Le classement évoluera dès les premières transactions.
                </div>
            )}

            <div className="leaderboard-table">
                <div className="table-header">
                    <div className="col-rank">Rang</div>
                    <div className="col-participant">Participant</div>
                    <div className="col-performance">Performance</div>
                    <div className="col-value">Valeur Portfolio</div>
                </div>

                {rankings.map((entry) => (
                    <div
                        key={entry.userId}
                        className={`leaderboard-row ${entry.rank <= 3 ? `top-${entry.rank}` : ''}`}
                    >
                        <div className="col-rank">
                            {entry.rank <= 3 ? (
                                <span className="medal">
                                    {entry.rank === 1 && '🥇'}
                                    {entry.rank === 2 && '🥈'}
                                    {entry.rank === 3 && '🥉'}
                                </span>
                            ) : (
                                `#${entry.rank}`
                            )}
                        </div>

                        <div className="col-participant">
                            {entry.avatar_url && <img src={entry.avatar_url} alt="" className="avatar" />}
                            <div className="participant-info">
                                <div className="name">
                                    {entry.name} {entry.lastname}
                                </div>
                                {entry.username && <div className="username">@{entry.username}</div>}
                            </div>
                            {entry.isEligible && (
                                <span className="eligible-badge" title="Éligible (5+ transactions)">
                                    ✓
                                </span>
                            )}
                        </div>

                        <div className="col-performance">
                            <span className={`performance ${entry.gainLossPercent > 0 ? 'positive' : entry.gainLossPercent < 0 ? 'negative' : 'neutral'}`}>
                                {entry.gainLossPercent > 0 ? '+' : ''}
                                {entry.gainLossPercent.toFixed(2)}%
                            </span>
                            <div className="gain-loss">
                                {entry.gainLoss > 0 ? '+' : entry.gainLoss < 0 ? '' : ''}
                                {entry.gainLoss.toLocaleString('fr-FR')} FCFA
                            </div>
                        </div>

                        <div className="col-value">
                            {entry.totalValue.toLocaleString('fr-FR')} FCFA
                        </div>
                    </div>
                ))}
            </div>

            {stats && (
                <div className="leaderboard-footer">
                    {stats.activeParticipants} participant{stats.activeParticipants > 1 ? 's' : ''} actif{stats.activeParticipants > 1 ? 's' : ''} •{' '}
                    {stats.eligibleParticipants} éligible{stats.eligibleParticipants > 1 ? 's' : ''} •{' '}
                    {stats.totalTransactions} transaction{stats.totalTransactions > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
