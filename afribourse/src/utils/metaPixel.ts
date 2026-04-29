// Meta Pixel event helpers — wraps window.fbq with a safe guard

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
}

export const metaPixel = {
  /** Inscription terminée (email ou OAuth) */
  completeRegistration() {
    fbq('track', 'CompleteRegistration');
  },

  /** Début de processus de paiement (clic Abonnement payant) */
  initiateCheckout(planName: string, value: number) {
    fbq('track', 'InitiateCheckout', {
      content_name: planName,
      value,
      currency: 'XOF',
    });
  },

  /** Abonnement payant confirmé */
  subscribe(planName: string, value: number) {
    fbq('track', 'Subscribe', {
      content_name: planName,
      value,
      currency: 'XOF',
      predicted_ltv: value,
    });
  },

  /** Essai gratuit activé */
  startTrial() {
    fbq('track', 'StartTrial', {
      value: '0.00',
      currency: 'XOF',
      predicted_ltv: '0.00',
    });
  },

  /** Formulaire de contact envoyé */
  contact() {
    fbq('track', 'Contact');
  },

  /** Lead qualifié : survey onboarding complété */
  lead(source: string) {
    fbq('track', 'Lead', { content_name: source });
  },

  /** Recherche d'action */
  search(query: string) {
    fbq('track', 'Search', { search_string: query });
  },

  /** Vue d'une fiche action */
  viewContent(symbol: string) {
    fbq('track', 'ViewContent', {
      content_ids: [symbol],
      content_type: 'product',
      content_name: symbol,
    });
  },

  /** Ajout à la watchlist (≈ liste d'envies) */
  addToWishlist(symbol: string) {
    fbq('track', 'AddToWishlist', {
      content_ids: [symbol],
      content_type: 'product',
    });
  },
};
