// src/components/onboarding/AIScoreStep.tsx
// Step 6 — Calcul du score investisseur via Simba

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';
import type { OnboardingData } from '../../hooks/useOnboarding';

export interface ScoreBreakdown {
  engagement: number;
  risque_horizon: number;
  regularite: number;
  diversification: number;
  contexte_brvm: number;
  total: number;
}

interface Props {
  formData: Partial<OnboardingData>;
  onNext: (score: number, breakdown: ScoreBreakdown) => void;
  onBack: () => void;
}

const PILLARS = [
  { key: 'engagement', label: 'Engagement', max: 25, color: '#1D9E75' },
  { key: 'risque_horizon', label: 'Risque / Horizon', max: 20, color: '#3B82F6' },
  { key: 'regularite', label: 'Régularité', max: 15, color: '#8B5CF6' },
  { key: 'diversification', label: 'Diversification', max: 15, color: '#F59E0B' },
  { key: 'contexte_brvm', label: 'Contexte BRVM', max: 25, color: '#EF4444' },
] as const;

function getProfileLabel(score: number): string {
  if (score < 30) return 'Investisseur Prudent';
  if (score < 50) return 'Investisseur Modéré';
  if (score < 70) return 'Investisseur Équilibré';
  if (score < 85) return 'Investisseur Dynamique';
  return 'Investisseur Avisé';
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-36 h-36 -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#1D9E75"
            strokeWidth="10"
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-emerald-600">{score}</span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
      <p className="text-lg font-semibold text-gray-900">{getProfileLabel(score)}</p>
    </div>
  );
}

export default function AIScoreStep({ formData, onNext, onBack }: Props) {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [score, setScore] = useState(0);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [loadingLabel, setLoadingLabel] = useState('Analyse de votre profil BRVM...');

  useEffect(() => {
    const labels = [
      'Analyse de votre profil BRVM...',
      'Calibration du score investisseur...',
      'Simba prépare votre ADN...',
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % labels.length;
      setLoadingLabel(labels[i]);
    }, 900);

    apiClient
      .post('/investor-profile/ai-score', formData)
      .then((res) => {
        clearInterval(interval);
        setScore(res.data.data.investor_score);
        setBreakdown(res.data.data.score_breakdown);
        setStatus('done');
      })
      .catch(() => {
        clearInterval(interval);
        setStatus('error');
      });

    return () => clearInterval(interval);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-emerald-600 font-bold text-xs">AI</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm font-medium text-center">{loadingLabel}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-6 text-center">
        <p className="text-red-500">Une erreur est survenue lors du calcul du score.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onBack} className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Votre score investisseur</h2>
        <p className="text-gray-600 mt-1">Calculé sur 5 piliers selon votre profil BRVM</p>
      </div>

      <ScoreRing score={score} />

      {/* Détail des piliers */}
      {breakdown && (
        <div className="space-y-3">
          {PILLARS.map((pillar) => {
            const val = breakdown[pillar.key as keyof ScoreBreakdown] as number;
            const pct = Math.round((val / pillar.max) * 100);
            return (
              <div key={pillar.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{pillar.label}</span>
                  <span className="font-medium text-gray-900">
                    {val} / {pillar.max}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: pillar.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 italic text-center">
        Ce score est indicatif et basé sur vos réponses. Il ne constitue pas un conseil en investissement.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
        >
          Retour
        </button>
        <button
          onClick={() => breakdown && onNext(score, breakdown)}
          disabled={!breakdown}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-40 hover:bg-emerald-700"
        >
          Voir ma stratégie
        </button>
      </div>
    </div>
  );
}
