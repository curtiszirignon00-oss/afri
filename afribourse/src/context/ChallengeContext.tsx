// src/context/ChallengeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { WalletMode } from '../components/challenge';
import { useChallengeStatus } from '../hooks/useChallenge';

interface ChallengeContextType {
    walletMode: WalletMode;
    setWalletMode: (mode: WalletMode) => void;
    isEnrolled: boolean;
    isLoading: boolean;
}

const ChallengeContext = createContext<ChallengeContextType | null>(null);

export function ChallengeProvider({ children }: { children: React.ReactNode }) {
    const [walletMode, setWalletMode] = useState<WalletMode>('SANDBOX');
    const { data: challengeStatus, isLoading } = useChallengeStatus();

    // Auto-switch to SANDBOX if user tries to go to CONCOURS but isn't enrolled
    useEffect(() => {
        if (walletMode === 'CONCOURS' && !challengeStatus?.enrolled) {
            setWalletMode('SANDBOX');
        }
    }, [walletMode, challengeStatus]);

    const value: ChallengeContextType = {
        walletMode,
        setWalletMode,
        isEnrolled: challengeStatus?.enrolled || false,
        isLoading,
    };

    return (
        <ChallengeContext.Provider value={value}>
            {children}
        </ChallengeContext.Provider>
    );
}

export function useChallengeContext() {
    const context = useContext(ChallengeContext);
    if (!context) {
        throw new Error('useChallengeContext must be used within ChallengeProvider');
    }
    return context;
}
