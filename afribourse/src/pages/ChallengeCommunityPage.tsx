// src/pages/ChallengeCommunityPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaderboard } from '../components/challenge/Leaderboard';
import { useChallengeStatus, useWeeklyStocks, useChallengeStats } from '../hooks/useChallenge';
import './ChallengeCommunityPage.css';

export default function ChallengeCommunityPage() {
    const navigate = useNavigate();
    const { data: challengeStatus, isLoading: statusLoading } = useChallengeStatus();
    const { data: weeklyStocks } = useWeeklyStocks();
    const { data: stats } = useChallengeStats();

    // Rediriger si pas inscrit
    React.useEffect(() => {
        if (!statusLoading && !challengeStatus?.enrolled) {
            navigate('/');
        }
    }, [challengeStatus, statusLoading, navigate]);

    if (statusLoading) {
        return (
            <div className="page-loading">
                <div className="spinner" />
                <p>Chargement...</p>
            </div>
        );
    }

    if (!challengeStatus?.enrolled) {
        return null; // Redirection en cours
    }

    return (
        <div className="challenge-community-page">
            <header className="page-header">
                <div className="header-content">
                    <h1>🏆 Challenge AfriBourse 2026</h1>
                    <p className="subtitle">
                        Communauté des Investisseurs - Classement en Temps Réel
                    </p>
                </div>

                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-value">{stats.totalParticipants}</div>
                            <div className="stat-label">Participants</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.eligibleParticipants}</div>
                            <div className="stat-label">Éligibles</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value">{stats.totalTransactions}</div>
                            <div className="stat-label">Transactions</div>
                        </div>
                    </div>
                )}
            </header>

            {/* Section Documents */}
            <section className="documents-section">
                <h2>📄 Documents Officiels</h2>
                <div className="documents-grid">
                    <a
                        href="/docs/reglement_challenge_2026.pdf"
                        download
                        className="document-card"
                    >
                        <span className="doc-icon">📋</span>
                        <div className="doc-info">
                            <strong>Règlement du Challenge 2026</strong>
                            <small>PDF - Règles et conditions de participation</small>
                        </div>
                        <span className="download-icon">⬇️</span>
                    </a>
                </div>
            </section>

            {/* Leaderboard */}
            <section className="leaderboard-section">
                <Leaderboard limit={20} showMyRank={true} />
            </section>

            {/* Baromètre du Marché */}
            {weeklyStocks && (
                <section className="market-barometer">
                    <h2>📊 Baromètre du Marché</h2>
                    <div className="barometer-grid">
                        <div className="top-stocks">
                            <h3>🚀 Top 3 de la Semaine</h3>
                            <div className="stocks-list">
                                {weeklyStocks.top3.map((stock) => (
                                    <div key={stock.ticker} className="stock-item positive">
                                        <div className="stock-name">
                                            <strong>{stock.ticker}</strong>
                                            <span>{stock.company_name}</span>
                                        </div>
                                        <div className="stock-performance">
                                            <span className="change">
                                                +{stock.change_percent.toFixed(2)}%
                                            </span>
                                            <small>{stock.tradingVolume} trades</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flop-stocks">
                            <h3>📉 Flop 3 de la Semaine</h3>
                            <div className="stocks-list">
                                {weeklyStocks.flop3.map((stock) => (
                                    <div key={stock.ticker} className="stock-item negative">
                                        <div className="stock-name">
                                            <strong>{stock.ticker}</strong>
                                            <span>{stock.company_name}</span>
                                        </div>
                                        <div className="stock-performance">
                                            <span className="change">
                                                {stock.change_percent.toFixed(2)}%
                                            </span>
                                            <small>{stock.tradingVolume} trades</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Progression personnelle */}
            {challengeStatus && (
                <section className="personal-progress">
                    <h2>📈 Votre Progression</h2>
                    <div className="progress-card">
                        <div className="progress-stat">
                            <span className="label">Transactions Validées</span>
                            <span className="value">
                                {challengeStatus.validTransactions} / 5
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${(challengeStatus.validTransactions / 5) * 100}%`,
                                }}
                            />
                        </div>
                        {challengeStatus.isEligible ? (
                            <div className="eligible-badge">
                                ✓ Éligible pour le classement final
                            </div>
                        ) : (
                            <div className="not-eligible-badge">
                                Effectuez {5 - challengeStatus.validTransactions} transactions
                                sur des tickers différents pour devenir éligible
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
