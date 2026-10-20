// src/hooks/useRealPortfolio.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { realPortfolioApi, type DiscoveryState } from '../services/realPortfolioApi';

export const REAL_PORTFOLIO_KEYS = {
  all: ['real-portfolio'] as const,
  dashboard: ['real-portfolio', 'dashboard'] as const,
  history: ['real-portfolio', 'history'] as const,
  transactions: ['real-portfolio', 'transactions'] as const,
  discovery: ['real-portfolio', 'discovery'] as const,
};

export function useRealDashboard() {
  return useQuery({ queryKey: REAL_PORTFOLIO_KEYS.dashboard, queryFn: realPortfolioApi.getDashboard, staleTime: 60_000 });
}

export function useRealHistory(enabled: boolean) {
  return useQuery({ queryKey: REAL_PORTFOLIO_KEYS.history, queryFn: realPortfolioApi.getHistory, enabled, staleTime: 5 * 60_000 });
}

export function useRealTransactions(enabled: boolean) {
  return useQuery({ queryKey: REAL_PORTFOLIO_KEYS.transactions, queryFn: realPortfolioApi.getTransactions, enabled });
}

/** Invalide toutes les vues après une écriture (valorisation recalculée côté serveur). */
export function useInvalidateRealPortfolio() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: REAL_PORTFOLIO_KEYS.all });
}

export function useUpdateRealCash() {
  const invalidate = useInvalidateRealPortfolio();
  return useMutation({ mutationFn: realPortfolioApi.updateCash, onSuccess: invalidate });
}

export function useDeleteRealTransaction() {
  const invalidate = useInvalidateRealPortfolio();
  return useMutation({ mutationFn: realPortfolioApi.deleteTransaction, onSuccess: invalidate });
}

export function useUpdateRealSettings() {
  const invalidate = useInvalidateRealPortfolio();
  return useMutation({ mutationFn: realPortfolioApi.updateSettings, onSuccess: invalidate });
}

export function useDeleteRealPortfolio() {
  const invalidate = useInvalidateRealPortfolio();
  return useMutation({ mutationFn: realPortfolioApi.deletePortfolio, onSuccess: invalidate });
}

// ─── Découverte (guide + encart « Nouveau ») ───────────────────────────────

export function useRealPortfolioDiscovery(enabled: boolean) {
  return useQuery({
    queryKey: REAL_PORTFOLIO_KEYS.discovery,
    queryFn: realPortfolioApi.getDiscovery,
    enabled,
    staleTime: 10 * 60_000,
    retry: false,
  });
}

export function useRecordDiscovery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: realPortfolioApi.recordDiscovery,
    // Optimiste : l'encart / le guide disparaissent même si le réseau est lent.
    onMutate: event => {
      qc.setQueryData<DiscoveryState>(REAL_PORTFOLIO_KEYS.discovery, prev => prev && {
        ...prev,
        ...(event === 'banner_dismissed' ? { bannerDismissed: true } : { guideSeen: true }),
        ...(event === 'guide_completed' ? { guideCompleted: true } : {}),
      });
    },
    onSuccess: data => qc.setQueryData(REAL_PORTFOLIO_KEYS.discovery, data),
  });
}

