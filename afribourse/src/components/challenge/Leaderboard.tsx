// src/components/challenge/Leaderboard.tsx
import React from 'react';
import { useLeaderboard, useMyRank } from '../../hooks/useChallenge';
import './Leaderboard.css';

interface LeaderboardProps {
    limit?: number;
    showMyRank?: boolean;
}

export function Leaderboard({ limit = 20, showMyRank = true }: LeaderboardProps) {
    const { data: rankings, isLoading } = useLeaderboard(limit);
    const { data: myRank } = useMyRank();

    if (isLoading) {
        return (
            <div className="leaderboard-loading">
                <div className="spinner" />
                <p>Chargement du classement...</p>
            </div>
        );
    }

    if (!rankings || rankings.length === 0) {
        return (
            <div className="leaderboard-empty">
                <p>📊 Aucun classement disponible pour le moment</p>
            </div>
        );
    }

    return (
        <div className="leaderboard">
            <div className="leaderboard-header">
                <h2>🏆 Top {limit} Challenge AfriBourse 2026</h2>
                {showMyRank && myRank && myRank.rank && (
                    <div className="my-rank-badge">
                        Votre rang : <strong>#{myRank.rank}</strong> / {myRank.totalParticipants}
                        {myRank.percentile && (
                            <span className="percentile">(Top {(100 - myRank.percentile).toFixed(1)}%)</span>
                        )}
                    </div>
                )}
            </div>

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
                            <span className={`performance ${entry.gainLossPercent >= 0 ? 'positive' : 'negative'}`}>
                                {entry.gainLossPercent >= 0 ? '+' : ''}
                                {entry.gainLossPercent.toFixed(2)}%
                            </span>
                            <div className="gain-loss">
                                {entry.gainLoss >= 0 ? '+' : ''}
                                {entry.gainLoss.toLocaleString()} FCFA
                            </div>
                        </div>

                        <div className="col-value">
                            {entry.totalValue.toLocaleString()} FCFA
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
