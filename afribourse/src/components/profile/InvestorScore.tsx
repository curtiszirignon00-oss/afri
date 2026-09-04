// src/components/profile/InvestorScore.tsx
// Score Investisseur composite (Passeport) — affichage explicable des 5 composantes.
//
// L'entete degradee teal -> emeraude et les jauges vert/ambre venaient d'une
// palette etrangere au logo. Le bloc suit maintenant le chrome commun des cartes
// du profil (ProfileSectionCard) et gradue le score du navy vers l'orange de
// marque : plus le score monte, plus la barre se rapproche de l'accent.
import { useQuery } from '@tanstack/react-query';
import { Lock, ChevronRight } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import ProfileSectionCard from './ProfileSectionCard';

interface ScoreComponent {
    key: string;
    label: string;
    weight: number;
    score: number;
    available: boolean;
    action: string;
}

interface PassportScore {
    total: number;
    percentile: number | null;
    summary: string;
    components: ScoreComponent[];
}

interface InvestorScoreProps {
    /** Score déjà disponible (profil public) ; sinon le composant le charge (profil perso). */
    score?: PassportScore | null;
    enabled?: boolean;
}

function scoreColor(score: number): string {
    if (score >= 75) return 'text-brand-orange-dark';
    if (score >= 50) return 'text-brand-navy';
    if (score >= 25) return 'text-ink-600';
    return 'text-ink-400';
}

function barColor(score: number): string {
    if (score >= 75) return 'bg-brand-orange';
    if (score >= 50) return 'bg-brand-navy';
    if (score >= 25) return 'bg-ink-400';
    return 'bg-ink-300';
}

export default function InvestorScore({ score: scoreProp, enabled = true }: InvestorScoreProps) {
    const { data: fetched, isLoading } = useQuery({
        queryKey: ['passport-score'],
        queryFn: async () => {
            const res = await apiClient.get('/investor-profile/passport-score');
            return res.data.data as PassportScore;
        },
        enabled: enabled && !scoreProp,
        staleTime: 2 * 60 * 1000,
    });

    const score = scoreProp ?? fetched;

    if (!score) {
        if (isLoading) {
            return (
                <div className="bg-white rounded-2xl border border-ink-100 shadow-sm p-5 animate-pulse">
                    <div className="h-5 w-40 bg-ink-100 rounded mb-4" />
                    <div className="h-16 bg-ink-100 rounded" />
                </div>
            );
        }
        return null;
    }

    return (
        <ProfileSectionCard
            title="Score Investisseur"
            subtitle="Bons comportements, pas gains rapides"
        >
            {/* Score principal */}
            <div className="flex items-end gap-2">
                <span className={`font-mono text-5xl font-bold tabular-nums leading-none ${scoreColor(score.total)}`}>
                    {score.total}
                </span>
                <span className="text-ink-400 text-lg font-medium">/100</span>
                {score.percentile != null && (
                    <span className="ml-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-orange/10 text-brand-orange-dark">
                        Top {score.percentile}%
                    </span>
                )}
            </div>
            {score.summary && <p className="text-sm text-ink-500 mt-2">{score.summary}</p>}

            {/* Décomposition des 5 composantes */}
            <div className="mt-5 space-y-3.5">
                {score.components.map((c) => (
                    <div key={c.key}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="flex items-center gap-1.5 text-ink-700">
                                {!c.available && <Lock className="w-3 h-3 text-ink-400" />}
                                {c.label}
                                <span className="text-ink-400 text-xs font-mono">· {Math.round(c.weight * 100)}%</span>
                            </span>
                            <span className={`font-mono font-semibold tabular-nums ${c.available ? 'text-ink-900' : 'text-ink-400'}`}>
                                {c.available ? c.score : '—'}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-ink-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${c.available ? barColor(c.score) : 'bg-ink-200'}`}
                                style={{ width: c.available ? `${c.score}%` : '0%' }}
                            />
                        </div>
                        {/* Action concrète pour progresser */}
                        {c.score < 100 && (
                            <p className="flex items-center gap-1 text-xs text-ink-400 mt-1">
                                <ChevronRight className="w-3 h-3" />
                                {c.action}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </ProfileSectionCard>
    );
}
