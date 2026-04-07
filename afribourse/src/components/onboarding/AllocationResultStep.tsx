// src/components/onboarding/AllocationResultStep.tsx
// Step 7 — Allocation sectorielle Simba + acceptation du disclaimer

import { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api-client';
import type { OnboardingData } from '../../hooks/useOnboarding';

export const DISCLAIMER_TEXT =
  "Ces informations sont fournies à titre éducatif uniquement et ne constituent pas un conseil en investissement. Les performances passées sur la BRVM ne garantissent pas les performances futures. Investir comporte des risques, y compris la perte partielle ou totale du capital investi.";

interface AllocationItem {
  sector: string;
  pct: number;
  tickers: string[];
  rationale: string;
}

interface Props {
  data: Partial<OnboardingData>;
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const SECTOR_COLORS = [
  '#1D9E75',
  '#3B82F6',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#10B981',
];

export default function AllocationResultStep({ data, onComplete, onBack, isLoading }: Props) {
  const [allocation, setAllocation] = useState<AllocationItem[]>([]);
  const [loadingAlloc, setLoadingAlloc] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient
      .post('/investor-profile/ai-allocation', data)
      .then((res) => {
        const alloc = res.data.data?.allocation ?? res.data.data ?? [];
        setAllocation(Array.isArray(alloc) ? alloc : []);
        setLoadingAlloc(false);
      })
      .catch(() => {
        setError(true);
        setLoadingAlloc(false);
      });
  }, []);

  if (loadingAlloc) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-emerald-600 font-bold text-xs">AI</div>
        </div>
        <p className="text-gray-600 text-sm font-medium text-center">
          Simba construit votre stratégie BRVM...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Votre stratégie de découverte</h2>
        <p className="text-gray-600 mt-1">
          Répartition sectorielle éducative générée par Simba pour votre profil BRVM.
        </p>
      </div>

      {/* Bulle Simba */}
      <div className="bg-emerald-50 rounded-xl p-4 flex gap-3 items-start">
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          AI
        </div>
        <p className="text-sm text-emerald-800">
          Voici une répartition sectorielle basée sur votre profil. Elle est donnée à titre
          éducatif et ne constitue pas un conseil en investissement.
        </p>
      </div>

      {/* Allocation */}
      {!error && allocation.length > 0 ? (
        <div className="space-y-4">
          {allocation.map((item, idx) => (
            <div key={item.sector} className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-900">{item.sector}</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                >
                  {item.pct}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.pct}%`,
                    backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length],
                  }}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap mb-1">
                {item.tickers.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono text-gray-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 italic">{item.rationale}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
          La génération d'allocation a rencontré un problème. Votre profil a bien été enregistré.
        </div>
      )}

      {/* Disclaimer — OBLIGATOIRE */}
      <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-xs text-gray-600 leading-relaxed">{DISCLAIMER_TEXT}</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={disclaimerAccepted}
            onChange={(e) => setDisclaimerAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-600 flex-shrink-0"
          />
          <span className="text-sm text-gray-700 font-medium">
            Je comprends que ces informations sont éducatives et ne constituent pas un conseil
            en investissement.
          </span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
          disabled={isLoading}
        >
          Retour
        </button>
        <button
          onClick={onComplete}
          disabled={!disclaimerAccepted || isLoading}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium disabled:opacity-40 hover:bg-emerald-700 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Terminer mon profil'
          )}
        </button>
      </div>
    </div>
  );
}
