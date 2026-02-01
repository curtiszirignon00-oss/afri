// src/components/challenge/ChallengeCTA.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallengeStatus, useIsChallengeOpen } from '../../hooks/useChallenge';
import { EnrollmentModal } from './EnrollmentModal';
import { useAuth } from '../../contexts/AuthContext';
import './ChallengeCTA.css';

export function ChallengeCTA() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth(); // Utiliser le contexte Auth au lieu de localStorage
    const { data: challengeStatus } = useChallengeStatus();
    const isChallengeOpen = useIsChallengeOpen();
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

    const handleCTAClick = () => {
        if (!isLoggedIn) {
            // Utilisateur non connecté → Inscription
            navigate('/signup');
        } else if (!challengeStatus?.enrolled) {
            // Connecté mais pas inscrit au challenge → Enrollment modal
            setShowEnrollmentModal(true);
        } else {
            // Déjà inscrit → Communauté officielle du Challenge sur africbourse.com
            window.location.href = 'https://www.africbourse.com/communities/-challenge-afribourse-le-hub-de-lelite';
        }
    };

    const getButtonText = () => {
        if (!isLoggedIn) return 'Participer au Concours';
        if (!challengeStatus?.enrolled) return 'S\'inscrire au Challenge';
        return 'Accéder à la Communauté';
    };

    const getDaysUntilLaunch = () => {
        const launchDate = new Date('2026-03-02T00:00:00Z');
        const now = new Date();
        const diff = launchDate.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <>
            <section className="challenge-cta">
                <div className="challenge-cta-container">
                    <div className="challenge-icon">🏆</div>

                    <h2 className="challenge-title">
                        Challenge AfriBourse : qui sera le meilleur gestionnaire de portefeuille ?
                    </h2>

                    <p className="challenge-subtitle">
                        Gérez <strong>1 000 000 FCFA</strong> virtuels, affrontez les meilleurs
                        investisseurs de la zone UEMOA et gagnez jusqu'à{' '}
                        <strong className="prize">10 000 000 FCFA</strong> de lots réels.
                    </p>

                    <div className="challenge-features">
                        <div className="feature">
                            <span className="feature-icon">💰</span>
                            <span>1M FCFA de capital virtuel</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🎯</span>
                            <span>Objectif top 10</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🏅</span>
                            <span>Prix jusqu'à 10M FCFA</span>
                        </div>
                    </div>

                    {!isChallengeOpen && challengeStatus?.enrolled && (
                        <div className="countdown-badge">
                            ⏳ Le trading ouvre le 2 mars - Dans {getDaysUntilLaunch()} jours
                        </div>
                    )}

                    <button className="challenge-cta-button" onClick={handleCTAClick}>
                        {getButtonText()}
                        <span className="arrow">→</span>
                    </button>

                    {challengeStatus?.enrolled && (
                        <div className="enrolled-status">
                            ✓ Vous êtes inscrit ! {challengeStatus.validTransactions} / 5 transactions
                        </div>
                    )}
                </div>
            </section>

            <EnrollmentModal
                isOpen={showEnrollmentModal}
                onClose={() => setShowEnrollmentModal(false)}
                onSuccess={() => {
                    setShowEnrollmentModal(false);
                    // Rediriger vers la communauté officielle du Challenge sur africbourse.com
                    window.location.href = 'https://www.africbourse.com/communities/-challenge-afribourse-le-hub-de-lelite';
                }}
            />
        </>
    );
}
