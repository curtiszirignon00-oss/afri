/**
 * Surveillance de santé de l'IA SIMBA — alerte email admin en cas de panne.
 *
 * Chaque appel modèle (réussi ou non) est enregistré dans une fenêtre glissante
 * en mémoire. Une alerte part si, sur la dernière heure :
 *   - au moins AI_ALERT_MIN_CALLS appels et ≥ AI_ALERT_FAILURE_RATE d'échecs, ou
 *   - AI_ALERT_CONSECUTIVE échecs consécutifs (panne franche, même à faible trafic).
 * Une seule alerte par heure maximum (anti-spam).
 */

import { log } from '../config/logger';
import { sendEmail } from '../services/email.service';

const WINDOW_MS = 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 60 * 1000;
const MIN_CALLS = Number(process.env.AI_ALERT_MIN_CALLS ?? 5);
const FAILURE_RATE = Number(process.env.AI_ALERT_FAILURE_RATE ?? 0.2);
const CONSECUTIVE = Number(process.env.AI_ALERT_CONSECUTIVE ?? 3);
const ALERT_EMAIL = process.env.AI_ALERT_EMAIL || 'contact@africbourse.com';

interface Outcome {
  at: number;
  source: string;
  ok: boolean;
  error?: string;
}

const outcomes: Outcome[] = [];
let consecutiveFailures = 0;
let lastAlertAt = 0;

function prune(now: number) {
  while (outcomes.length && outcomes[0].at < now - WINDOW_MS) outcomes.shift();
}

/**
 * Enregistre le résultat d'un appel au modèle.
 * @param source  ex. 'analyst', 'coach', 'tutor', 'portfolio', 'market-analysis', 'time-machine'
 */
export function recordAIOutcome(source: string, ok: boolean, error?: unknown): void {
  const now = Date.now();
  const errMsg = error == null
    ? undefined
    : String((error as any)?.message ?? error).slice(0, 300);

  outcomes.push({ at: now, source, ok, error: errMsg });
  prune(now);
  consecutiveFailures = ok ? 0 : consecutiveFailures + 1;

  if (!ok) maybeAlert(now);
}

/** État courant (exposé à l'admin). */
export function getAIHealth() {
  const now = Date.now();
  prune(now);
  const failures = outcomes.filter((o) => !o.ok);
  return {
    windowMinutes: WINDOW_MS / 60000,
    calls: outcomes.length,
    failures: failures.length,
    failureRate: outcomes.length ? failures.length / outcomes.length : 0,
    consecutiveFailures,
    lastErrors: failures.slice(-5).map((f) => ({
      at: new Date(f.at).toISOString(),
      source: f.source,
      error: f.error,
    })),
    lastAlertAt: lastAlertAt ? new Date(lastAlertAt).toISOString() : null,
  };
}

function maybeAlert(now: number) {
  if (now - lastAlertAt < COOLDOWN_MS) return;

  const failures = outcomes.filter((o) => !o.ok);
  const rate = outcomes.length ? failures.length / outcomes.length : 0;
  const rateTriggered = outcomes.length >= MIN_CALLS && rate >= FAILURE_RATE;
  const consecutiveTriggered = consecutiveFailures >= CONSECUTIVE;
  if (!rateTriggered && !consecutiveTriggered) return;

  lastAlertAt = now;
  const health = getAIHealth();
  log.error(`[AI-HEALTH] Alerte : ${failures.length}/${outcomes.length} échecs sur 1 h, ${consecutiveFailures} consécutifs`);

  const rows = health.lastErrors
    .map((e) => `<tr><td style="padding:4px 8px">${e.at.slice(11, 19)}</td><td style="padding:4px 8px">${escapeHtml(e.source)}</td><td style="padding:4px 8px;font-family:monospace;font-size:12px">${escapeHtml(e.error ?? '')}</td></tr>`)
    .join('');

  sendEmail({
    to: ALERT_EMAIL,
    subject: `⚠️ SIMBA en panne : ${failures.length}/${outcomes.length} appels IA en échec`,
    html: `
      <h2 style="color:#b91c1c">Alerte IA SIMBA</h2>
      <p><strong>${failures.length}</strong> échecs sur <strong>${outcomes.length}</strong> appels au cours de la dernière heure
      (${Math.round(rate * 100)} %), dont <strong>${consecutiveFailures}</strong> consécutifs.</p>
      <p>Les utilisateurs voient probablement « Je suis temporairement indisponible ».</p>
      <h3>Dernières erreurs</h3>
      <table border="1" cellspacing="0" style="border-collapse:collapse">${rows}</table>
      <p style="color:#555;font-size:13px">Causes fréquentes : modèle retiré par Groq (model_decommissioned / model_not_found),
      limite de tokens par minute atteinte (429), clé GROQ_API_KEY invalide.<br>
      Modèles configurés dans <code>backend/src/ai/models.ts</code>. Prochaine alerte possible dans 1 h.</p>`,
    text: `Alerte SIMBA : ${failures.length}/${outcomes.length} échecs IA sur 1 h. Dernière erreur : ${health.lastErrors.at(-1)?.error ?? 'N/D'}`,
  }).catch((err) => log.error('[AI-HEALTH] Envoi de l\'alerte impossible :', err?.message));
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
