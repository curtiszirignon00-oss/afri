// Relais navigateur → API Conversions Meta (serveur).
// Chaque évènement est aussi envoyé au Pixel avec le MÊME event_id (déduplication).
import { API_BASE_URL } from '../config/api';

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export interface CapiUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  country?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  externalId?: string | null;
}

/**
 * Transmet un évènement au backend qui le relaie à l'API Conversions.
 * Fire-and-forget : n'interrompt jamais le parcours utilisateur.
 */
export function sendCapiEvent(
  eventName: string,
  eventId: string,
  customData?: Record<string, unknown>,
  userData?: CapiUserData,
): void {
  try {
    const payload = JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      eventTime: Math.floor(Date.now() / 1000),
      customData,
      userData: userData || {},
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc'),
    });

    fetch(`${API_BASE_URL}/meta/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
