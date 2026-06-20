// src/components/profile/InvestorScore.tsx
// Score Investisseur composite (Passeport) — affichage explicable des 5 composantes.
import { useQuery } from '@tanstack/react-query';
import { Gauge, Lock, ChevronRight } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

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
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-teal-600';
    if (score >= 25) return 'text-amber-600';
    return 'text-gray-500';
}

function barColor(score: number): string {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 50) return 'bg-teal-500';
    if (score >= 25) return 'bg-amber-500';
    return 'bg-gray-400';
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                    <div className="h-5 w-40 bg-gray-100 rounded mb-4" />
                    <div className="h-16 bg-gray-100 rounded" />
                </div>
            );
        }
        return null;
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-700 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Gauge className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Score Investisseur</h3>
                        <p className="text-white/70 text-sm">Bons comportements, pas gains rapides</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Score principal */}
                <div className="flex items-end gap-3">
                    <div className={`text-4xl font-bold ${scoreColor(score.total)}`}>{score.total}</div>
                    <div className="text-gray-400 text-lg font-medium mb-1">/100</div>
                    {score.percentile != null && (
                        <span className="ml-auto mb-1 inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                            Top {score.percentile}%
                        </span>
                    )}
                </div>
                {score.summary && <p className="text-sm text-gray-500 mt-1">{score.summary}</p>}

                {/* Décomposition des 5 composantes */}
                <div className="mt-5 space-y-3">
                    {score.components.map((c) => (
                        <div key={c.key}>
                            <div className="flex items-center justify-between text-sm mb-1">
                                <span className="flex items-center gap-1.5 text-gray-700">
                                    {!c.available && <Lock className="w-3 h-3 text-gray-400" />}
                                    {c.label}
                                    <span className="text-gray-400 text-xs">· {Math.round(c.weight * 100)}%</span>
                                </span>
                                <span className={`font-semibold ${c.available ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {c.available ? c.score : '—'}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${c.available ? barColor(c.score) : 'bg-gray-200'}`}
                                    style={{ width: c.available ? `${c.score}%` : '0%' }}
                                />
                            </div>
                            {/* Action concrète pour progresser */}
                            {c.score < 100 && (
                                <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                    <ChevronRight className="w-3 h-3" />
                                    {c.action}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
