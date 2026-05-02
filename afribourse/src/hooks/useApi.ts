// src/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { API_BASE_URL, getCsrfToken, fetchCsrfToken, getAuthToken } from '../config/api';
import { SESSION_EXPIRED_EVENT } from '../contexts/AuthContext';
import { RateLimitError } from '../lib/errors';

// ========================================
// 🔧 FONCTION UTILITAIRE FETCH
// ========================================

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  const isMutation = MUTATION_METHODS.has(method);

  // Récupérer le token CSRF pour les mutations si pas encore en cache
  if (isMutation && !getCsrfToken()) {
    await fetchCsrfToken();
  }

  const csrfToken = getCsrfToken();
  const authToken = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
    ...(isMutation && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    // Fallback Safari iOS ITP : les cookies cross-site sont bloqués, on utilise le Bearer token en mémoire
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
  };

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include', // Cookie httpOnly envoyé automatiquement
    headers,
  });

  // Retry automatique si token CSRF expiré (403) — renouvelle et retente une fois
  if (response.status === 403 && isMutation) {
    await fetchCsrfToken();
    const newToken = getCsrfToken();
    if (newToken) headers['X-CSRF-Token'] = newToken;
    const retryResponse = await fetch(url, { ...fetchOptions, credentials: 'include', headers });
    if (!retryResponse.ok) {
      const errorData = await retryResponse.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Erreur ${retryResponse.status}`);
    }
    return retryResponse.json();
  }

  // Gestion des erreurs HTTP
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // 401 — session expirée : notifier le AuthContext via un événement global
    if (response.status === 401) {
      // Ne pas déclencher sur les routes de login/refresh (boucle infinie)
      const isAuthRoute = endpoint.startsWith('/login') || endpoint.startsWith('/refresh') || endpoint.startsWith('/me');
      if (!isAuthRoute) {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      }
    }

    // 429 — trop de requêtes
    // GET : silencieux — React Query garde les données stale, l'user ne voit rien
    // Mutations : on remonte l'erreur mais sans afficher le délai exact
    if (response.status === 429) {
      throw new RateLimitError(method === 'GET');
    }

    const errorMessage = errorData.error || errorData.message || `Erreur ${response.status}`;
    const err = new Error(errorMessage);
    (err as any).status = response.status;
    throw err;
  }

  return response.json();
}

// ========================================
// 📊 HOOKS POUR LES STOCKS
// ========================================

export interface Stock {
  id: string;
  symbol: string;
  company_name: string;
  sector: string | null;
  country: string | null;
  current_price: number;
  previous_close: number;
  daily_change_percent: number;
  volume: number;
  market_cap: number;
  logo_url?: string | null;
  fundamentals?: Array<{
    pe_ratio?: number | null;
    dividend_yield?: number | null;
  }>;
}

export interface StockFilters {
  search?: string;
  sector?: string;
  sort?: 'name' | 'change' | 'price' | 'volume' | 'pe' | 'dividend';
  minMarketCap?: string;
  maxMarketCap?: string;
  minPE?: string;
  maxPE?: string;
  minDividend?: string;
  maxDividend?: string;
}

// Hook pour récupérer la liste des actions
export function useStocks(filters: StockFilters = {}) {
  return useQuery({
    queryKey: ['stocks', filters], // La clé change si les filtres changent
    queryFn: () => apiFetch<Stock[]>('/stocks', { params: filters as Record<string, string> }),
    staleTime: 30000, // Les données restent fraîches pendant 30 secondes
    gcTime: 5 * 60 * 1000, // Cache pendant 5 minutes (anciennement cacheTime)
    placeholderData: (previousData) => previousData, // Garde les données précédentes pendant le chargement
    refetchOnWindowFocus: false, // Ne pas recharger au focus de la fenêtre
  });
}

// Hook pour récupérer une action spécifique
export function useStock(symbol: string | undefined) {
  return useQuery({
    queryKey: ['stock', symbol],
    queryFn: () => apiFetch<Stock>(`/stocks/${symbol}`),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });
}

// ========================================
// 📈 HOOKS POUR LE PORTFOLIO
// ========================================

export interface Portfolio {
  id: string;
  name: string;
  initial_balance: number;
  cash_balance: number;
  is_virtual: boolean;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  stock_ticker: string;
  quantity: number;
  average_buy_price: number;
}

export interface Transaction {
  id: string;
  stock_ticker: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price_per_share: number;
  created_at: string;
}

// Hook pour récupérer le portfolio de l'utilisateur
export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: () => apiFetch<Portfolio>('/portfolios/my'),
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
}

// Hook pour créer un portfolio
export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; initial_balance: number }) =>
      apiFetch<Portfolio>('/portfolios/my', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalider et recharger le portfolio
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Portfolio créé avec succès !');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création du portfolio');
    },
  });
}

// Hook pour acheter une action
export function useBuyStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      stockTicker: string;
      quantity: number;
      pricePerShare: number;
      walletType?: 'SANDBOX' | 'CONCOURS';
    }) =>
      apiFetch('/portfolios/my/buy', {
        method: 'POST',
        body: JSON.stringify({
          stockTicker: data.stockTicker,
          quantity: data.quantity,
          pricePerShare: data.pricePerShare,
          wallet_type: data.walletType || 'SANDBOX',
        }),
      }),
    onSuccess: (_, variables) => {
      // Recharger le portfolio et les transactions
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', variables.walletType] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['challenge', 'status'] });
      toast.success('Achat effectué avec succès !');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de l\'achat');
    },
  });
}

// Hook pour vendre une action
export function useSellStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      stockTicker: string;
      quantity: number;
      pricePerShare: number;
      walletType?: 'SANDBOX' | 'CONCOURS';
    }) =>
      apiFetch('/portfolios/my/sell', {
        method: 'POST',
        body: JSON.stringify({
          stockTicker: data.stockTicker,
          quantity: data.quantity,
          pricePerShare: data.pricePerShare,
          wallet_type: data.walletType || 'SANDBOX',
        }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio', variables.walletType] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Vente effectuée avec succès !');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la vente');
    },
  });
}

// Hook pour récupérer les transactions
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => apiFetch<Transaction[]>('/portfolios/my/transactions'),
    staleTime: 5 * 60 * 1000,
  });
}

// ========================================
// 👁️ HOOKS POUR LA WATCHLIST
// ========================================

export interface WatchlistItem {
  id: string;
  stock_ticker: string;
  created_at: string;
  entry_price?: number | null;
  note?: string | null;
  tags?: string[];
}

export interface WatchlistItemEnriched extends WatchlistItem {
  current_price: number | null;
  change_pct: number | null;
  pnl_pct: number | null;
}

// Hook pour récupérer la watchlist
export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiFetch<WatchlistItem[]>('/watchlist/my'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour ajouter à la watchlist
export function useAddToWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stockTicker: string) =>
      apiFetch('/watchlist/my', {
        method: 'POST',
        body: JSON.stringify({ stockTicker }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success('Ajouté à la watchlist');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook pour retirer de la watchlist
export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stockTicker: string) =>
      apiFetch(`/watchlist/my/${stockTicker}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success('Retiré de la watchlist');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ── Signal scores per watchlist ticker ──────────────────────────────────────

export type SignalZone =
  | 'Vente Forte'
  | 'Signal Vente'
  | 'Neutre'
  | 'Signal Achat'
  | 'Achat Fort';

export interface TickerScore {
  ticker: string;
  score: number;
  zone: SignalZone;
  technical: number | null;
  fundamental: number | null;
  reliability: number;
  dataQuality: 'good' | 'partial' | 'low';
}

export function useWatchlistScores() {
  return useQuery({
    queryKey: ['watchlist', 'scores'],
    queryFn: () => apiFetch<TickerScore[]>('/watchlist/my/scores'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

// Hook pour récupérer la watchlist enrichie (avec prix courant et P&L)
export function useWatchlistEnriched() {
  return useQuery({
    queryKey: ['watchlist', 'enriched'],
    queryFn: () => apiFetch<WatchlistItemEnriched[]>('/watchlist/my/enriched'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook pour mettre à jour un item de watchlist (entry_price, note, tags)
export function useUpdateWatchlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stockTicker, data }: {
      stockTicker: string;
      data: { entry_price?: number | null; note?: string | null; tags?: string[] }
    }) =>
      apiFetch<WatchlistItem>(`/watchlist/my/${stockTicker}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ========================================
// 🏠 HOOKS POUR LA PAGE D'ACCUEIL
// ========================================

export interface NewsArticle {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  image_url: string | null;
  published_at: string | null;
}

export interface HomePageData {
  topStocks: Stock[];
  featuredNews: NewsArticle[];
}

export function useHomePageData() {
  return useQuery({
    queryKey: ['homepage'],
    queryFn: () => apiFetch<HomePageData>('/homepage'),
    staleTime: 5 * 60 * 1000,
  });
}

// ========================================
// 👤 HOOKS POUR LE PROFIL UTILISATEUR
// ========================================

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  lastname: string | null;
  country: string | null;
  birth_date: string | null;
  has_invested: boolean | null;
  experience_level: string | null;
  main_goals: string[] | null;
  monthly_amount: string | null;
  profile_type: string | null;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => apiFetch<UserProfile>('/users/me'),
    retry: false,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      toast.success('Profil mis à jour avec succès !');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });
}