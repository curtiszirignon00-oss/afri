// Service pour tracker les analytics
import { v4 as uuidv4 } from 'uuid';

// Générer ou récupérer l'ID de session
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Détect device type
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Get browser name
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  return 'Unknown';
};

// Get OS
const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
};

class AnalyticsService {
  private baseUrl = import.meta.env.VITE_API_URL;
  private sessionId = getSessionId();
  private currentPageViewId: string | null = null;
  private pageStartTime: number | null = null;

  /**
   * Track une page visitée
   */
  async trackPageView(pagePath: string, pageTitle?: string) {
    try {
      const referrer = document.referrer;
      const userAgent = navigator.userAgent;
      const deviceType = getDeviceType();
      const browser = getBrowser();
      const os = getOS();

      const response = await fetch(`${this.baseUrl}/analytics/page-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: this.sessionId,
          pagePath,
          pageTitle: pageTitle || document.title,
          referrer,
          userAgent,
          deviceType,
          browser,
          os,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.currentPageViewId = data.pageViewId;
        this.pageStartTime = Date.now();
      }
    } catch (error) {
      console.error('[Analytics] Erreur trackPageView:', error);
    }
  }

  /**
   * Met à jour la durée de la page actuelle
   */
  async updatePageDuration() {
    if (!this.currentPageViewId || !this.pageStartTime) return;

    try {
      const duration = Math.floor((Date.now() - this.pageStartTime) / 1000); // en secondes

      await fetch(`${this.baseUrl}/analytics/page-duration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pageViewId: this.currentPageViewId,
          duration,
        }),
      });
    } catch (error) {
      console.error('[Analytics] Erreur updatePageDuration:', error);
    }
  }

  /**
   * Track une action utilisateur
   */
  async trackAction(actionType: string, actionName: string, metadata?: Record<string, any>) {
    try {
      const pagePath = window.location.pathname;

      await fetch(`${this.baseUrl}/analytics/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: this.sessionId,
          actionType,
          actionName,
          pagePath,
          metadata: metadata || {},
        }),
      });
    } catch (error) {
      console.error('[Analytics] Erreur trackAction:', error);
    }
  }

  /**
   * Track l'utilisation d'une fonctionnalité
   */
  async trackFeatureUsage(
    featureName: string,
    featureType: 'free' | 'premium' | 'pro',
    accessGranted: boolean,
    blockedByPaywall: boolean = false,
    metadata?: Record<string, any>
  ) {
    try {
      const pagePath = window.location.pathname;

      await fetch(`${this.baseUrl}/analytics/feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          featureName,
          featureType,
          accessGranted,
          blockedByPaywall,
          pagePath,
          metadata: metadata || {},
        }),
      });
    } catch (error) {
      console.error('[Analytics] Erreur trackFeatureUsage:', error);
    }
  }
}

export const analytics = new AnalyticsService();

// Types d'actions courantes
export const ACTION_TYPES = {
  // Navigation
  NAVIGATE: 'navigate',

  // Recherche
  SEARCH_STOCK: 'search_stock',
  FILTER_STOCKS: 'filter_stocks',

  // Watchlist
  ADD_TO_WATCHLIST: 'add_to_watchlist',
  REMOVE_FROM_WATCHLIST: 'remove_from_watchlist',

  // Portfolio
  CREATE_PORTFOLIO: 'create_portfolio',
  DELETE_PORTFOLIO: 'delete_portfolio',
  SWITCH_PORTFOLIO: 'switch_portfolio',

  // Trading (simulateur)
  SIMULATE_BUY: 'simulate_buy',
  SIMULATE_SELL: 'simulate_sell',
  VIEW_TRANSACTION_HISTORY: 'view_transaction_history',

  // Graphiques
  VIEW_CHART: 'view_chart',
  CHANGE_TIMEFRAME: 'change_chart_timeframe',
  TOGGLE_INDICATOR: 'toggle_chart_indicator',

  // Learning
  START_MODULE: 'start_learning_module',
  COMPLETE_MODULE: 'complete_learning_module',
  WATCH_VIDEO: 'watch_video',
  TAKE_QUIZ: 'take_quiz',

  // IA
  USE_AI_COACH: 'use_ai_coach',
  USE_AI_ANALYST: 'use_ai_analyst',

  // Social
  FOLLOW_USER: 'follow_user',
  UNFOLLOW_USER: 'unfollow_user',
  VIEW_PROFILE: 'view_user_profile',
  VIEW_LEADERBOARD: 'view_leaderboard',

  // Subscriptions
  VIEW_PRICING: 'view_pricing',
  START_CHECKOUT: 'start_checkout',
  BLOCKED_BY_PAYWALL: 'blocked_by_paywall',
};

// Features à tracker
export const FEATURES = {
  AI_COACH: { name: 'Coach IA', type: 'premium' as const },
  AI_ANALYST: { name: 'Analyste IA', type: 'premium' as const },
  TECHNICAL_INDICATORS: { name: 'Indicateurs Techniques', type: 'premium' as const },
  ADVANCED_CHARTS: { name: 'Graphiques Avancés', type: 'pro' as const },
  PORTFOLIO_SIMULATOR: { name: 'Simulateur de Portfolio', type: 'free' as const },
  STOCK_SCREENER: { name: 'Screener d\'Actions', type: 'premium' as const },
  LEARNING_MODULES: { name: 'Modules d\'Apprentissage', type: 'free' as const },
};
