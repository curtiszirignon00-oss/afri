// src/components/challenge/WalletSwitcher.tsx
//
// Bascule entre le portefeuille d'apprentissage et celui du concours. Rendu en
// interrupteur segmente : une piste grise, la cellule active en navy plein.
// Les emojis 🎓 et 🏆 laissent la place a des icones, et les degrades indigo
// et orange de l'ancienne feuille de style disparaissent avec elle.
import { GraduationCap, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useChallengeStatus } from '../../hooks/useChallenge';

export type WalletMode = 'SANDBOX' | 'CONCOURS';

interface WalletSwitcherProps {
    currentMode: WalletMode;
    onModeChange: (mode: WalletMode) => void;
    className?: string;
}

const MODES: { mode: WalletMode; icon: LucideIcon; label: string; sublabel: string }[] = [
    { mode: 'SANDBOX', icon: GraduationCap, label: 'Sandbox', sublabel: 'Apprentissage' },
    { mode: 'CONCOURS', icon: Trophy, label: 'Concours', sublabel: 'Challenge 2026' },
];

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
        <div className={`inline-flex gap-1 p-1 rounded-xl bg-gray-100 ${className}`}>
            {MODES.map(({ mode, icon: Icon, label, sublabel }) => {
                const active = currentMode === mode;
                const locked = mode === 'CONCOURS' && !challengeStatus?.enrolled;

                return (
                    <button
                        key={mode}
                        onClick={() => handleSwitch(mode)}
                        disabled={locked}
                        aria-label={`Mode ${label}`}
                        aria-pressed={active}
                        title={locked ? 'Inscrivez-vous au Challenge pour activer' : ''}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-left transition-colors ${
                            active
                                ? 'bg-brand-navy text-white shadow-sm'
                                : locked
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-white hover:text-brand-navy'
                        }`}
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold leading-none">{label}</span>
                            <span className={`block text-[11px] mt-1 ${active ? 'text-white/60' : 'text-gray-400'}`}>
                                {sublabel}
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
