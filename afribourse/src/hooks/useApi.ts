// src/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

// ========================================
// 🔧 FONCTION UTILITAIRE FETCH
// ========================================

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

// Helper pour détecter si on est sur mobile
const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// Helper pour récupérer le token depuis localStorage
const getAuthToken = (): string | null => {
  // Essayer d'abord 'auth_token', puis 'token' comme fallback
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    return authToken;
  }

  // Fallback pour compatibilité
  const token = localStorage.getItem('token');
  if (token) {
    return token;
  }

  return null;
};

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Construire l'URL avec les paramètres de requête
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // Préparer les headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Ajouter le token dans le header Authorization s'il existe
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 [API] Using auth token for request to', endpoint);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include', // Toujours envoyer les cookies (desktop)
    headers,
  });

  // Gestion des erreurs HTTP
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.message || `Erreur ${response.status}`;
    throw new Error(errorMessage);
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
}

export interface StockFilters {
  search?: string;
  sector?: string;
  sort?: 'name' | 'change' | 'price' | 'volume';
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
    enabled: !!symbol, // Ne lance la requête que si symbol existe
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
    retry: false, // Ne pas réessayer si non connecté
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
    mutationFn: (data: { stockTicker: string; quantity: number; pricePerShare: number }) =>
      apiFetch('/portfolios/my/buy', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Recharger le portfolio et les transactions
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
    mutationFn: (data: { stockTicker: string; quantity: number; pricePerShare: number }) =>
      apiFetch('/portfolios/my/sell', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
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
  });
}

// ========================================
// 👁️ HOOKS POUR LA WATCHLIST
// ========================================

export interface WatchlistItem {
  id: string;
  stock_ticker: string;
  created_at: string;
}

// Hook pour récupérer la watchlist
export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => apiFetch<WatchlistItem[]>('/watchlist/my'),
    retry: false,
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