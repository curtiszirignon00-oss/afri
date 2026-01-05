// src/hooks/useGoogleAnalytics.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Déclaration du type pour gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Vérifier si gtag est disponible
    if (typeof window.gtag === 'function') {
      // Envoyer un pageview à chaque changement de route
      window.gtag('config', 'G-3CH8QXGT0P', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
};
