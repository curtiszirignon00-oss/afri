// src/components/challenge/WalletSwitcher.tsx
import React from 'react';
import { useChallengeStatus } from '../../hooks/useChallenge';
import './WalletSwitcher.css';

export type WalletMode = 'SANDBOX' | 'CONCOURS';

interface WalletSwitcherProps {
    currentMode: WalletMode;
    onModeChange: (mode: WalletMode) => void;
    className?: string;
}

export function WalletSwitcher({ currentMode, onModeChange, className = '' }: WalletSwitcherProps) {
    const { data: challengeStatus } = useChallengeStatus();

    const handleSwitch = (mode: WalletMode) => {
        // Si l'utilisateur n'est pas inscrit et essaie d'aller en mode Concours
        if (mode === 'CONCOURS' && !challengeStatus?.enrolled) {
            alert('Vous devez d\'abord vous inscrire au Challenge AfriBourse 2026');
            return;
        }

        onModeChange(mode);
    };

    return (
        <div className={`wallet-switcher ${className}`}>
            <button
                className={`wallet-switcher-btn sandbox ${currentMode === 'SANDBOX' ? 'active' : ''}`}
                onClick={() => handleSwitch('SANDBOX')}
                aria-label="Mode Sandbox (Apprentissage)"
            >
                <span className="icon">🎓</span>
                <span className="label">Sandbox</span>
                <span className="sublabel">Apprentissage</span>
            </button>

            <button
                className={`wallet-switcher-btn concours ${currentMode === 'CONCOURS' ? 'active' : ''} ${!challengeStatus?.enrolled ? 'disabled' : ''}`}
                onClick={() => handleSwitch('CONCOURS')}
                disabled={!challengeStatus?.enrolled}
                aria-label="Mode Concours"
                title={!challengeStatus?.enrolled ? 'Inscrivez-vous au Challenge pour activer' : ''}
            >
                <span className="icon">🏆</span>
                <span className="label">Concours</span>
                <span className="sublabel">Challenge 2026</span>
            </button>
        </div>
    );
}
