import { useQuery } from '@tanstack/react-query';
import {
  fetchStockHistory,
  fetchStockFundamentals,
  fetchCompanyInfo,
  fetchStockNews,
  Period
} from '../services/stockApi';

/**
 * Hook pour récupérer l'historique de prix d'une action
 */
export function useStockHistory(symbol: string, period: Period = '1Y') {
  return useQuery({
    queryKey: ['stock-history', symbol, period],
    queryFn: () => fetchStockHistory(symbol, period),
    enabled: !!symbol, // Ne lance la requête que si le symbole existe
    staleTime: 5 * 60 * 1000, // Considère les données comme fraîches pendant 5 minutes
    gcTime: 10 * 60 * 1000 // Garde en cache pendant 10 minutes
  });
}

/**
 * Hook pour récupérer les données fondamentales d'une action
 */
export function useStockFundamentals(symbol: string) {
  return useQuery({
    queryKey: ['stock-fundamentals', symbol],
    queryFn: () => fetchStockFundamentals(symbol),
    enabled: !!symbol,
    staleTime: 30 * 60 * 1000, // 30 minutes (les fondamentaux changent peu)
    gcTime: 60 * 60 * 1000 // 1 heure
  });
}

/**
 * Hook pour récupérer les informations sur la compagnie
 */
export function useCompanyInfo(symbol: string) {
  return useQuery({
    queryKey: ['company-info', symbol],
    queryFn: () => fetchCompanyInfo(symbol),
    enabled: !!symbol,
    staleTime: 60 * 60 * 1000, // 1 heure (les infos de compagnie changent rarement)
    gcTime: 24 * 60 * 60 * 1000 // 24 heures
  });
}

/**
 * Hook pour récupérer les actualités liées à une action
 */
export function useStockNews(symbol: string, limit: number = 10) {
  return useQuery({
    queryKey: ['stock-news', symbol, limit],
    queryFn: () => fetchStockNews(symbol, limit),
    enabled: !!symbol,
    staleTime: 2 * 60 * 1000, // 2 minutes (les news changent fréquemment)
    gcTime: 5 * 60 * 1000 // 5 minutes
  });
}
