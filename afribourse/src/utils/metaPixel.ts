// Meta Pixel event helpers — wraps window.fbq with a safe guard

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const PIXEL_ID = '875398595570569';

function fbq(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
}

export interface MetaUserData {
  id?: string;
  email?: string | null;
  name?: string | null;
  lastname?: string | null;
  telephone?: string | null;
}

/**
 * Correspondance avancée — à appeler dès que les données utilisateur sont connues.
 * Le pixel hache automatiquement em/fn/ln via SHA-256.
 * Re-appeler fbq('init') avec les données utilisateur permet à Meta de lier
 * les événements suivants à un profil réel.
 */
export function metaPixelIdentify(user: MetaUserData) {
  const userData: Record<string, string> = {};

  if (user.email) userData.em = user.email.toLowerCase().trim();
  if (user.name) userData.fn = user.name.toLowerCase().trim();
  if (user.lastname) userData.ln = user.lastname.toLowerCase().trim();
  if (user.id) userData.external_id = user.id;

  // Téléphone : garder uniquement les chiffres
  if (user.telephone) {
    const digits = user.telephone.replace(/\D/g, '');
    if (digits) userData.ph = digits;
  }

  if (Object.keys(userData).length > 0) {
    fbq('init', PIXEL_ID, userData);
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
