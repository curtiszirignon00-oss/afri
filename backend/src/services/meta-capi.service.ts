import crypto from 'crypto';
import { log } from '../config/logger';

// ============================================================
// Meta — API Conversions (Conversions API / CAPI)
// Envoi serveur-à-serveur des évènements vers le point de terminaison
// https://graph.facebook.com/{version}/{DATASET_ID}/events
//
// Déduplication : chaque évènement porte un `event_id`. Le même `event_id`
// est utilisé côté navigateur (Pixel via `fbq('track', name, params, { eventID })`)
// afin que Meta fusionne les deux signaux (Pixel + CAPI).
//
// Config (variables d'environnement) :
//   META_DATASET_ID         ID de l'ensemble de données / Pixel (défaut: pixel front)
//   META_CAPI_ACCESS_TOKEN  Token d'accès généré dans le Gestionnaire d'évènements
//   META_GRAPH_VERSION      Version de l'API Graph (défaut: v21.0)
//   META_TEST_EVENT_CODE    Code « Évènements de test » (vide = production)
// ============================================================

const DATASET_ID = process.env.META_DATASET_ID || '875398595570569';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || '';

const isEnabled = (): boolean => Boolean(DATASET_ID && ACCESS_TOKEN);

// ── Hachage SHA-256 (requis pour les données personnelles) ───────────────────
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/** Normalise puis hache. Renvoie undefined si la valeur est vide. */
function hash(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return undefined;
  return sha256(normalized);
}

/** Téléphone : retirer tout sauf les chiffres (indicatif pays inclus, sans +). */
function hashPhone(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return undefined;
  return sha256(digits);
}

export interface MetaUserDataInput {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;   // code ISO 2 lettres (ex: ci, sn)
  gender?: string | null;    // 'f' | 'm'
  dateOfBirth?: string | null; // AAAAMMJJ
  externalId?: string | null;
  // Non hachés
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;       // cookie _fbp
  fbc?: string | null;       // cookie _fbc
}

/** Construit l'objet `user_data` conforme (PII hachées, identifiants techniques en clair). */
export function buildUserData(input: MetaUserDataInput): Record<string, unknown> {
  const ud: Record<string, unknown> = {};

  const em = hash(input.email);
  if (em) ud.em = [em];
  const ph = hashPhone(input.phone);
  if (ph) ud.ph = [ph];
  const fn = hash(input.firstName);
  if (fn) ud.fn = [fn];
  const ln = hash(input.lastName);
  if (ln) ud.ln = [ln];
  const ct = hash(input.city);
  if (ct) ud.ct = [ct];
  const st = hash(input.state);
  if (st) ud.st = [st];
  const zp = hash(input.zip);
  if (zp) ud.zp = [zp];
  const country = hash(input.country);
  if (country) ud.country = [country];
  const ge = hash(input.gender);
  if (ge) ud.ge = [ge];
  const db = hash(input.dateOfBirth);
  if (db) ud.db = [db];
  // external_id : haché recommandé
  const ext = hash(input.externalId);
  if (ext) ud.external_id = [ext];

  // Identifiants techniques — NE PAS hacher
  if (input.clientIpAddress) ud.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) ud.client_user_agent = input.clientUserAgent;
  if (input.fbp) ud.fbp = input.fbp;
  if (input.fbc) ud.fbc = input.fbc;

  return ud;
}

export interface MetaServerEvent {
  eventName: string;
  eventId?: string;
  eventTime?: number;           // secondes epoch (défaut: maintenant)
  actionSource?: 'website' | 'app' | 'phone_call' | 'chat' | 'email' | 'other' | 'physical_store' | 'system_generated';
  eventSourceUrl?: string;
  userData: Record<string, unknown>;
  customData?: Record<string, unknown>;
}

/**
 * Envoie un lot d'évènements à l'API Conversions.
 * Tolérant aux erreurs (fire-and-forget) : ne casse jamais le flux appelant.
 */
export async function sendMetaEvents(events: MetaServerEvent[]): Promise<void> {
  if (!isEnabled()) {
    log.debug?.('[MetaCAPI] Désactivé (META_DATASET_ID / META_CAPI_ACCESS_TOKEN manquant)');
    return;
  }
  if (!events.length) return;

  const data = events.map((e) => ({
    event_name: e.eventName,
    event_time: e.eventTime ?? Math.floor(Date.now() / 1000),
    action_source: e.actionSource ?? 'website',
    ...(e.eventId ? { event_id: e.eventId } : {}),
    ...(e.eventSourceUrl ? { event_source_url: e.eventSourceUrl } : {}),
    user_data: e.userData,
    ...(e.customData ? { custom_data: e.customData } : {}),
  }));

  const body: Record<string, unknown> = { data };
  if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${DATASET_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      log.warn('[MetaCAPI] Réponse non-OK', { status: res.status, error: json?.error });
    } else {
      log.info('[MetaCAPI] Évènement(s) envoyé(s)', {
        events: data.map((d) => d.event_name),
        received: json?.events_received,
        test: TEST_EVENT_CODE ? true : undefined,
      });
    }
  } catch (err) {
    log.error('[MetaCAPI] Échec envoi évènement', { err });
  }
}

/** Helper : un seul évènement. */
export function sendMetaEvent(event: MetaServerEvent): Promise<void> {
  return sendMetaEvents([event]);
}
