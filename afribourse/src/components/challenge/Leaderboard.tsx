// src/components/challenge/Leaderboard.tsx
import { useLeaderboard, useMyRank, useChallengeStats } from '../../hooks/useChallenge';
import './Leaderboard.css';

interface LeaderboardProps {
    limit?: number;
    showMyRank?: boolean;
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316'];

function getAvatarColor(name: string) {
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function Avatar({ url, name, size = 'md' }: { url?: string | null; name: string; size?: 'sm' | 'md' | 'lg' }) {
    if (url) {
        return <img src={url} alt={name} className={`lb-avatar lb-avatar-${size}`} />;
    }
    return (
        <div
            className={`lb-avatar lb-avatar-${size} lb-avatar-initial`}
            style={{ background: getAvatarColor(name) }}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

export function Leaderboard({ limit = 10, showMyRank = true }: LeaderboardProps) {
    const { data: rankings, isLoading, isError, refetch } = useLeaderboard(limit);
    const { data: myRank } = useMyRank();
    const { data: stats } = useChallengeStats();

    if (isLoading) {
        return (
            <div className="lb-loading">
                <div className="lb-spinner" />
                <p>Chargement du classement...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="lb-empty">
                <p>⚠️ Impossible de charger le classement.</p>
                <button className="lb-retry-btn" onClick={() => refetch()}>Réessayer</button>
            </div>
        );
    }

    if (!rankings || rankings.length === 0) {
        return (
            <div className="lb-empty">
                <div className="lb-empty-icon">🚀</div>
                <p className="lb-empty-title">Le classement s'affichera dès les premières transactions.</p>
                {stats && (
                    <p className="lb-empty-sub">
                        {stats.activeParticipants} participant{stats.activeParticipants > 1 ? 's' : ''} inscrit{stats.activeParticipants > 1 ? 's' : ''} — à vos ordres !
                    </p>
                )}
            </div>
        );
    }

    const isDay1 = rankings.every((e) => e.gainLossPercent === 0);
    const top3 = rankings.slice(0, Math.min(3, rankings.length));
    const rest = rankings.slice(3);

    // Ordre podium standard : 2e à gauche, 1er au centre, 3e à droite
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const podiumPositions = [2, 1, 3];

    return (
        <div className="lb-container">

            {/* Header */}
            <div className="lb-header">
                <h2 className="lb-title">🏆 Top {limit} Challenge AfriBourse 2026</h2>
                {showMyRank && myRank?.rank && (
                    <div className="lb-my-rank">
                        Votre rang&nbsp;<strong>#{myRank.rank}</strong>
                        {myRank.totalParticipants > 0 && (
                            <span className="lb-total"> / {myRank.totalParticipants}</span>
                        )}
                        {myRank.percentile !== undefined && (
                            <span className="lb-percentile"> · Top {(100 - myRank.percentile).toFixed(1)}%</span>
                        )}
                    </div>
                )}
            </div>

            {isDay1 && (
                <div className="lb-day1">
                    🚀 Challenge lancé ! Le classement évoluera dès les premières transactions.
                </div>
            )}

            {/* Podium top 3 */}
            {top3.length >= 1 && (
                <div className="lb-podium">
                    {podiumOrder.map((entry, i) => {
                        if (!entry) return <div key={i} className="lb-podium-empty" />;
                        const pos = podiumPositions[i];
                        const perfClass = entry.gainLossPercent > 0 ? 'positive' : entry.gainLossPercent < 0 ? 'negative' : 'neutral';

                        return (
                            <div key={entry.userId} className={`lb-podium-spot lb-podium-${pos}`}>
                                {pos === 1 && <div className="lb-crown">👑</div>}

                                <div className="lb-podium-avatar-wrap">
                                    <Avatar
                                        url={entry.avatar_url}
                                        name={entry.name}
                                        size={pos === 1 ? 'lg' : 'md'}
                                    />
                                    {entry.top3Streak >= 2 && (
                                        <span
                                            className="lb-streak"
                                            title={`${entry.top3Streak} jours consécutifs en top ${entry.streakRank}`}
                                        >
                                            🔥{entry.top3Streak}j
                                        </span>
                                    )}
                                </div>

                                <p className="lb-podium-name">
                                    {entry.name} {entry.lastname}
                                </p>
                                {entry.username && (
                                    <p className="lb-podium-username">@{entry.username}</p>
                                )}

                                <div className={`lb-podium-perf ${perfClass}`}>
                                    {entry.gainLossPercent > 0 ? '+' : ''}
                                    {entry.gainLossPercent.toFixed(2)}%
                                </div>

                                <div className="lb-podium-value">
                                    {entry.totalValue.toLocaleString('fr-FR')} FCFA
                                </div>

                                {entry.isEligible && (
                                    <span className="lb-eligible-dot" title="Éligible aux prix">✓</span>
                                )}

                                <div className={`lb-podium-platform lb-platform-${pos}`}>
                                    {pos}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Liste positions 4–10 */}
            {rest.length > 0 && (
                <div className="lb-list">
                    {rest.map((entry) => {
                        const perfClass = entry.gainLossPercent > 0 ? 'positive' : entry.gainLossPercent < 0 ? 'negative' : 'neutral';
                        return (
                            <div key={entry.userId} className="lb-list-row">
                                <div className="lb-list-rank">#{entry.rank}</div>

                                <Avatar url={entry.avatar_url} name={entry.name} size="sm" />

                                <div className="lb-list-info">
                                    <span className="lb-list-name">
                                        {entry.name} {entry.lastname}
                                    </span>
                                    {entry.username && (
                                        <span className="lb-list-username">@{entry.username}</span>
                                    )}
                                </div>

                                {entry.isEligible && (
                                    <span className="lb-eligible-dot" title="Éligible aux prix">✓</span>
                                )}

                                <div className="lb-list-right">
                                    <span className={`lb-list-perf ${perfClass}`}>
                                        {entry.gainLossPercent > 0 ? '+' : ''}
                                        {entry.gainLossPercent.toFixed(2)}%
                                    </span>
                                    <span className="lb-list-value">
                                        {entry.totalValue.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer stats */}
            {stats && (
                <div className="lb-footer">
                    <span>{stats.activeParticipants} actif{stats.activeParticipants > 1 ? 's' : ''}</span>
                    <span className="lb-dot">·</span>
                    <span>{stats.eligibleParticipants} éligible{stats.eligibleParticipants > 1 ? 's' : ''}</span>
                    <span className="lb-dot">·</span>
                    <span>{stats.totalTransactions} transaction{stats.totalTransactions > 1 ? 's' : ''}</span>
                </div>
            )}
        </div>
    );
}
