// Meta Pixel + API Conversions — dual-fire avec déduplication par event_id.
// Chaque évènement est envoyé au Pixel (navigateur) ET relayé au serveur (CAPI)
// avec le MÊME event_id : Meta fusionne les deux signaux.
import { v4 as uuidv4 } from 'uuid';
import { sendCapiEvent, type CapiUserData } from '../services/metaCapi';

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

// Données utilisateur connues (mises à jour par metaPixelIdentify) — enrichissent
// le matching côté serveur (CAPI), où le Pixel ne peut pas hacher tout seul.
let identifiedUser: CapiUserData = {};

/**
 * Émet un évènement vers le Pixel ET l'API Conversions avec un event_id partagé.
 */
function emit(eventName: string, params?: Record<string, unknown>) {
  const eventId = uuidv4();
  // Pixel — 4e argument = { eventID } pour la déduplication
  if (params && Object.keys(params).length > 0) {
    fbq('track', eventName, params, { eventID: eventId });
  } else {
    fbq('track', eventName, {}, { eventID: eventId });
  }
  // API Conversions (serveur) — même event_id
  sendCapiEvent(eventName, eventId, params, identifiedUser);
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
 * Le pixel hache automatiquement em/fn/ln via SHA-256, et on mémorise les données
 * pour enrichir les évènements CAPI (hachage côté serveur).
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

  // Mémoriser pour les évènements CAPI (le serveur se charge du hachage)
  identifiedUser = {
    email: user.email ?? undefined,
    phone: user.telephone ?? undefined,
    firstName: user.name ?? undefined,
    lastName: user.lastname ?? undefined,
    externalId: user.id ?? undefined,
  };
}

export const metaPixel = {
  /** Inscription terminée (email ou OAuth) */
  completeRegistration() {
    emit('CompleteRegistration');
  },

  /** Début de processus de paiement (clic Abonnement payant) */
  initiateCheckout(planName: string, value: number) {
    emit('InitiateCheckout', {
      content_name: planName,
      value,
      currency: 'XOF',
    });
  },

  /** Ajout des informations de paiement (saisie opérateur/numéro Mobile Money) */
  addPaymentInfo(planName: string, value: number) {
    emit('AddPaymentInfo', {
      content_name: planName,
      value,
      currency: 'XOF',
    });
  },

  /** Achat confirmé (navigateur) — dédupliqué avec le Purchase serveur si même event_id. */
  purchase(planName: string, value: number, eventId?: string) {
    const id = eventId ?? uuidv4();
    fbq('track', 'Purchase', { content_name: planName, value, currency: 'XOF' }, { eventID: id });
    sendCapiEvent('Purchase', id, { content_name: planName, value, currency: 'XOF' }, identifiedUser);
  },

  /** Abonnement payant confirmé */
  subscribe(planName: string, value: number) {
    emit('Subscribe', {
      content_name: planName,
      value,
      currency: 'XOF',
      predicted_ltv: value,
    });
  },

  /** Essai gratuit activé */
  startTrial() {
    emit('StartTrial', {
      value: '0.00',
      currency: 'XOF',
      predicted_ltv: '0.00',
    });
  },

  /** Formulaire de contact envoyé */
  contact() {
    emit('Contact');
  },

  /** Lead qualifié : survey onboarding complété */
  lead(source: string) {
    emit('Lead', { content_name: source });
  },

  /** Recherche d'action */
  search(query: string) {
    emit('Search', { search_string: query });
  },

  /** Vue d'une fiche action */
  viewContent(symbol: string) {
    emit('ViewContent', {
      content_ids: [symbol],
      content_type: 'product',
      content_name: symbol,
    });
  },

  /** Ajout à la watchlist (≈ liste d'envies) */
  addToWishlist(symbol: string) {
    emit('AddToWishlist', {
      content_ids: [symbol],
      content_type: 'product',
    });
  },
};
