import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, ACTION_TYPES } from '../services/analytics';

// Ré-exporter ACTION_TYPES pour l'utiliser dans les composants
export { ACTION_TYPES };

/**
 * Hook pour tracker automatiquement les pages visitées
 */
export const usePageTracking = () => {
  const location = useLocation();
  const previousPath = useRef<string>('');

  useEffect(() => {
    // Track la page seulement si le path a changé
    if (location.pathname !== previousPath.current) {
      analytics.trackPageView(location.pathname);
      previousPath.current = location.pathname;
    }

    // Cleanup: update duration quand on quitte la page
    return () => {
      analytics.updatePageDuration();
    };
  }, [location.pathname]);
};

/**
 * Hook pour tracker les actions utilisateur
 */
export const useAnalytics = () => {
  return {
    trackAction: analytics.trackAction.bind(analytics),
    trackFeatureUsage: analytics.trackFeatureUsage.bind(analytics),
    ACTION_TYPES,
  };
};
