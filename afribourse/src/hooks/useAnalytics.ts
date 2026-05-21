import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, ACTION_TYPES } from '../services/analytics';

// Ré-exporter ACTION_TYPES pour l'utiliser dans les composants
export { ACTION_TYPES };

/**
 * Hook pour tracker automatiquement les pages visitées.
 * Enregistre la durée via sendBeacon à la navigation ET à la fermeture d'onglet.
 */
export const usePageTracking = () => {
  const location = useLocation();
  const previousPath = useRef<string>('');

  // Fermeture / rechargement d'onglet → sendBeacon
  useEffect(() => {
    const handleUnload = () => analytics.updatePageDuration();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      analytics.trackPageView(location.pathname);
      previousPath.current = location.pathname;
    }

    // Navigation interne → envoie la durée avant de tracker la nouvelle page
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
