import { API_BASE_URL } from '../config/api';

export type Period = '1D' | '5D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

export type StockHistoryData = {
  id: string;
  stock_ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type StockHistoryResponse = {
  symbol: string;
  period: Period;
  data: StockHistoryData[];
};

export type StockFundamental = {
  id: string;
  stock_ticker: string;
  market_cap?: number | null;
  pe_ratio?: number | null;
  pb_ratio?: number | null;
  dividend_yield?: number | null;
  ex_dividend_date?: string | null;
  roe?: number | null;
  roa?: number | null;
  profit_margin?: number | null;
  debt_to_equity?: number | null;
  revenue?: number | null;
  net_income?: number | null;
  ebitda?: number | null;
  free_cash_flow?: number | null;
  shares_outstanding?: number | null;
  year?: number | null;
  eps?: number | null;
  book_value?: number | null;
  net_profit?: number | null;
};

export type CompanyInfo = {
  id: string;
  stock_ticker: string;
  description?: string | null;
  website?: string | null;
  employees?: number | null;
  founded_year?: number | null;
  headquarters?: string | null;
  ceo?: string | null;
  industry?: string | null;
};

export type StockNewsItem = {
  id: string;
  stock_ticker: string;
  title: string;
  summary?: string | null;
  source: string;
  url?: string | null;
  published_at: string;
};

export type Shareholder = {
  id: string;
  stock_ticker: string;
  name: string;
  percentage: number;
  is_public: boolean;
};

export type AnnualFinancial = {
  id: string;
  stock_ticker: string;
  year: number;
  revenue?: number | null;
  revenue_growth?: number | null;
  net_income?: number | null;
  net_income_growth?: number | null;
  eps?: number | null;
  pe_ratio?: number | null;
  dividend?: number | null;
};

export type AnnualFinancialsResponse = {
  symbol: string;
  years: number;
  data: AnnualFinancial[];
};

/**
 * Récupère l'historique de prix d'une action
 */
export async function fetchStockHistory(
  symbol: string,
  period: Period = '1Y'
): Promise<StockHistoryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/stocks/${symbol}/history?period=${period}`,
    { credentials: 'include' }
  );

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération de l'historique: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Récupère les données fondamentales d'une action
 */
export async function fetchStockFundamentals(symbol: string): Promise<StockFundamental | null> {
  const response = await fetch(`${API_BASE_URL}/stocks/${symbol}/fundamentals`, {
    credentials: 'include'
  });

  if (response.status === 404) {
    return null; // Pas de données fondamentales disponibles
  }

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des fondamentaux: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Récupère les informations sur la compagnie
 */
export async function fetchCompanyInfo(symbol: string): Promise<CompanyInfo | null> {
  const response = await fetch(`${API_BASE_URL}/stocks/${symbol}/company`, {
    credentials: 'include'
  });

  if (response.status === 404) {
    return null; // Pas d'infos disponibles
  }

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des infos de la compagnie: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Récupère les actualités liées à une action
 */
export async function fetchStockNews(
  symbol: string,
  limit: number = 10
): Promise<StockNewsItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/stocks/${symbol}/news?limit=${limit}`,
    { credentials: 'include' }
  );

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des actualités: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Récupère les actionnaires d'une action
 */
export async function fetchShareholders(symbol: string): Promise<Shareholder[]> {
  const response = await fetch(`${API_BASE_URL}/stocks/${symbol}/shareholders`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des actionnaires: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Récupère les données financières annuelles d'une action
 */
export async function fetchAnnualFinancials(
  symbol: string,
  years: number = 5
): Promise<AnnualFinancialsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/stocks/${symbol}/financials?years=${years}`,
    { credentials: 'include' }
  );

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des données financières: ${response.statusText}`);
  }

  return response.json();
}

// ========================================
// PRICE ALERTS API
// ========================================

import {
  PriceAlert,
  PriceAlertNotification,
  CreatePriceAlertPayload,
  UpdatePriceAlertPayload
} from '../types';

/**
 * Récupère toutes les alertes de l'utilisateur ou celles d'un ticker spécifique
 */
export async function fetchPriceAlerts(stockTicker?: string): Promise<PriceAlert[]> {
  const url = stockTicker
    ? `${API_BASE_URL}/price-alerts?stockTicker=${stockTicker}`
    : `${API_BASE_URL}/price-alerts`;

  const response = await fetch(url, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des alertes: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Crée une nouvelle alerte de prix
 */
export async function createPriceAlert(payload: CreatePriceAlertPayload): Promise<PriceAlert> {
  const response = await fetch(`${API_BASE_URL}/price-alerts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Erreur lors de la création de l'alerte: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Met à jour une alerte de prix existante
 */
export async function updatePriceAlert(
  alertId: string,
  payload: UpdatePriceAlertPayload
): Promise<PriceAlert> {
  const response = await fetch(`${API_BASE_URL}/price-alerts/${alertId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Erreur lors de la mise à jour de l'alerte: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Active ou désactive une alerte de prix
 */
export async function togglePriceAlert(alertId: string, isActive: boolean): Promise<PriceAlert> {
  const response = await fetch(`${API_BASE_URL}/price-alerts/${alertId}/toggle`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ isActive })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Erreur lors du changement de statut de l'alerte: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Supprime une alerte de prix
 */
export async function deletePriceAlert(alertId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/price-alerts/${alertId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Erreur lors de la suppression de l'alerte: ${response.statusText}`);
  }
}

/**
 * Récupère l'historique des notifications d'une alerte
 */
export async function fetchAlertNotifications(alertId: string): Promise<PriceAlertNotification[]> {
  const response = await fetch(`${API_BASE_URL}/price-alerts/${alertId}/notifications`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération de l'historique: ${response.statusText}`);
  }

  return response.json();
}
