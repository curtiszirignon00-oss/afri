// src/hooks/useNudgeTriggers.ts
// Hooks de tracking comportemental pour le système de nudges

import { useEffect, useRef } from 'react';
import { useNudgeContext } from '../contexts/NudgeContext';

// ─── Clés localStorage ────────────────────────────────────────────────────────

const LS_STOCK_VISITS = 'afribourse_stock_visits';
const LS_SESSION_COUNT = 'afribourse_session_count';
const LS_COMPARATOR_USED = 'afribourse_comparator_used';
const LS_SCREENER_USED = 'afribourse_screener_used';
const LS_MARKETS_VISITS = 'afribourse_markets_visits';
const LS_ALERTS_COUNT = 'afribourse_alerts_count';

// ─── Helpers localStorage ─────────────────────────────────────────────────────

function getStockVisits(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LS_STOCK_VISITS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function incrementStockVisit(stockId: string): number {
  const visits = getStockVisits();
  visits[stockId] = (visits[stockId] ?? 0) + 1;
  localStorage.setItem(LS_STOCK_VISITS, JSON.stringify(visits));
  return visits[stockId];
}

function getMarketsVisits(): number {
  return parseInt(localStorage.getItem(LS_MARKETS_VISITS) ?? '0', 10);
}

function incrementMarketsVisits(): number {
  const n = getMarketsVisits() + 1;
  localStorage.setItem(LS_MARKETS_VISITS, String(n));
  return n;
}

function getSessionCount(): number {
  return parseInt(localStorage.getItem(LS_SESSION_COUNT) ?? '0', 10);
}

function incrementSessionCount(): number {
  const n = getSessionCount() + 1;
  localStorage.setItem(LS_SESSION_COUNT, String(n));
  return n;
}

function getAlertsCount(): number {
  return parseInt(localStorage.getItem(LS_ALERTS_COUNT) ?? '0', 10);
}

// ─── Helpers exportés ─────────────────────────────────────────────────────────

export function markComparatorUsed() {
  localStorage.setItem(LS_COMPARATOR_USED, 'true');
}

export function markScreenerUsed() {
  localStorage.setItem(LS_SCREENER_USED, 'true');
}

export function setAlertsCount(count: number) {
  localStorage.setItem(LS_ALERTS_COUNT, String(count));
}

// ─── Hook 1 : Session counter (appelé une fois dans Layout) ──────────────────

export function useSessionCounter() {
  const counted = useRef(false);
  useEffect(() => {
    if (!counted.current) {
      counted.current = true;
      incrementSessionCount();
    }
  }, []);
}

// ─── Hook 2 : Page fiche action ───────────────────────────────────────────────

interface StockForNudge {
  daily_change_percent?: number | null;
  symbol?: string;
}

interface StockPageCallbacks {
  OPEN_WATCHLIST?: () => void;
  OPEN_ALERT_MODAL?: () => void;
  OPEN_COMPARATOR?: () => void;
}

export function useStockPageNudge(
  stockId: string,
  stock: StockForNudge | null | undefined,
  isInWatchlist: boolean,
  callbacks?: StockPageCallbacks
) {
  const { showNudge } = useNudgeContext();
  const fired = useRef(false);

  useEffect(() => {
    if (!stock || !stockId || fired.current) return;
    fired.current = true;

    const onAction = callbacks
      ? (action: string) => {
          if (action === 'OPEN_WATCHLIST') callbacks.OPEN_WATCHLIST?.();
          if (action === 'OPEN_ALERT_MODAL') callbacks.OPEN_ALERT_MODAL?.();
          if (action === 'OPEN_COMPARATOR') callbacks.OPEN_COMPARATOR?.();
        }
      : undefined;

    const visits = incrementStockVisit(stockId);

    if (visits >= 3 && !isInWatchlist) {
      showNudge('watchlist_repeat_visit', onAction);
    }

    if ((stock.daily_change_percent ?? 0) <= -2) {
      showNudge('alert_price_dip', onAction);
    }

    if (!localStorage.getItem(LS_COMPARATOR_USED)) {
      showNudge('comparator_first_visit', onAction);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId, stock?.daily_change_percent, isInWatchlist]);
}

// ─── Hook 3 : Page marchés ────────────────────────────────────────────────────

export function useMarketsPageNudge() {
  const { showNudge } = useNudgeContext();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const visits = incrementMarketsVisits();

    if (visits === 1) {
      showNudge('heatmap_first_time');
    } else if (visits >= 2 && !localStorage.getItem(LS_SCREENER_USED)) {
      showNudge('filter_screener_hint');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─── Hook 4 : Dashboard ───────────────────────────────────────────────────────

export function useDashboardNudge(
  watchlistItems: unknown[],
  isLoggedIn: boolean,
  alertsCount?: number
) {
  const { showNudge } = useNudgeContext();
  const fired = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || fired.current) return;
    fired.current = true;

    if (watchlistItems.length === 0) {
      showNudge('watchlist_empty_dashboard');
    }

    const sessions = getSessionCount();
    const alerts = alertsCount ?? getAlertsCount();
    if (sessions >= 3 && alerts === 0) {
      showNudge('alert_quota_reminder');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, watchlistItems.length, alertsCount]);
}

// ─── Hook 5 : Limite de quota ─────────────────────────────────────────────────

export function useQuotaLimitNudge(currentCount: number, maxCount: number) {
  const { showNudge } = useNudgeContext();

  useEffect(() => {
    if (currentCount >= maxCount) {
      showNudge('upgrade_limit_reached');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCount, maxCount]);
}
