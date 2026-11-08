/**
 * Erreurs client (front) remontées automatiquement.
 *
 * - Groupement par empreinte : la même erreur vue 500 fois = 1 ligne avec count = 500.
 * - Bruit filtré (extensions navigateur, « Script error. », ResizeObserver…).
 * - Alerte email admin quand un NOUVEAU groupe apparaît (ou qu'un groupe résolu revient),
 *   au plus un email par heure (les nouveautés de l'heure sont regroupées).
 */

import crypto from 'crypto';
import { prisma } from '../config/database';
import { log } from '../config/logger';
import config from '../config/environnement';
import { sendEmail } from './email.service';

const ALERT_EMAIL = process.env.CLIENT_ERROR_ALERT_EMAIL || 'contact@africbourse.com';
const COOLDOWN_MS = 60 * 60 * 1000;
const MAX_NEW_GROUPS_PER_HOUR = 100; // garde-fou contre un flood qui remplirait la base
const MAX_USERS = 50;
const MAX_CODES = 30;

const KINDS = new Set(['render', 'route', 'silent', 'window', 'unhandledrejection']);

// Erreurs sans valeur diagnostique ou hors de notre code
const NOISE_PATTERNS = [
  /^script error\.?$/im, // m : le haystack est « message\nstack »
  /ResizeObserver loop/i,
  /chrome-extension:|moz-extension:|safari-extension:|safari-web-extension:/i,
  /__gCrWeb|webkit\.messageHandlers/i, // injections WebView iOS / Chrome iOS
  /Non-Error promise rejection captured/i,
];

export interface ClientErrorInput {
  kind: string;
  name?: string;
  message: string;
  stack?: string;
  componentStack?: string;
  route: string;
  release?: string;
  code?: string;
  userAgent?: string;
}

const clip = (s: unknown, max: number): string | undefined =>
  typeof s === 'string' && s.length ? s.slice(0, max) : undefined;

/** Valide et tronque le corps reçu ; null si inexploitable. */
export function sanitizeClientError(body: any): ClientErrorInput | null {
  const message = clip(body?.message, 1000);
  const kind = typeof body?.kind === 'string' && KINDS.has(body.kind) ? body.kind : null;
  if (!message || !kind) return null;
  const code = typeof body?.code === 'string' && /^AB-[A-Z0-9]{4,6}$/.test(body.code) ? body.code : undefined;
  return {
    kind,
    message,
    name: clip(body?.name, 100),
    stack: clip(body?.stack, 6000),
    componentStack: clip(body?.componentStack, 4000),
    route: clip(body?.route, 300) ?? '/',
    release: clip(body?.release, 40),
    code,
    userAgent: clip(body?.userAgent, 400),
  };
}

export function isNoise(e: ClientErrorInput): boolean {
  const haystack = `${e.message}\n${e.stack ?? ''}`;
  return NOISE_PATTERNS.some((re) => re.test(haystack));
}

/** Première frame de stack, sans hash de chunk ni numéros de ligne (stables d'un deploy à l'autre). */
function topFrame(stack?: string): string {
  const line = (stack ?? '').split('\n').map((l) => l.trim()).find((l) => /:\d+:\d+/.test(l)) ?? '';
  return line
    .replace(/https?:\/\/[^/\s)]+/g, '')
    .replace(/-[A-Za-z0-9_-]{8}\.js/g, '.js')
    .replace(/:\d+:\d+/g, '');
}

function fingerprintOf(e: ClientErrorInput): string {
  const normalizedMsg = e.message
    .replace(/\d+/g, '#')
    .replace(/["'`][^"'`]{0,80}["'`]/g, '"…"')
    .slice(0, 300);
  return crypto
    .createHash('sha1')
    .update([e.kind, e.name ?? '', normalizedMsg, topFrame(e.stack)].join('|'))
    .digest('hex');
}

// ─── Alerte email ────────────────────────────────────────────────────────────

interface PendingAlert { message: string; route: string; kind: string; regression: boolean }
let pending: PendingAlert[] = [];
let lastAlertAt = 0;
let flushTimer: NodeJS.Timeout | null = null;
let newGroupsWindowStart = Date.now();
let newGroupsInWindow = 0;

function queueAlert(a: PendingAlert) {
  if (pending.length < 20) pending.push(a);
  const wait = lastAlertAt + COOLDOWN_MS - Date.now();
  if (wait <= 0) return flushAlerts();
  if (!flushTimer) flushTimer = setTimeout(flushAlerts, wait);
}

function flushAlerts() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (!pending.length) return;
  const batch = pending;
  pending = [];
  lastAlertAt = Date.now();

  const rows = batch
    .map((a) => `<tr><td style="padding:4px 8px">${a.regression ? '🔁 revenue' : '🆕 nouvelle'}</td><td style="padding:4px 8px">${escapeHtml(a.kind)}</td><td style="padding:4px 8px">${escapeHtml(a.route)}</td><td style="padding:4px 8px;font-family:monospace;font-size:12px">${escapeHtml(a.message.slice(0, 200))}</td></tr>`)
    .join('');
  const adminUrl = `${config.app.frontendUrl}/admin`;

  sendEmail({
    to: ALERT_EMAIL,
    subject: `🐞 ${batch.length} nouvelle(s) erreur(s) côté utilisateurs sur AfriBourse`,
    html: `
      <h2 style="color:#b45309">Erreurs côté utilisateurs</h2>
      <p>${batch.length} erreur(s) nouvelle(s) ou revenue(s) depuis la dernière alerte.</p>
      <table border="1" cellspacing="0" style="border-collapse:collapse">${rows}</table>
      <p>Détails complets (stack, utilisateurs, occurrences) dans <a href="${adminUrl}">le dashboard admin</a>, section « Erreurs client ».</p>
      <p style="color:#555;font-size:13px">Au plus une alerte par heure.</p>`,
    text: `${batch.length} nouvelle(s) erreur(s) client. Première : ${batch[0].message.slice(0, 200)} (${batch[0].route})`,
  }).catch((err) => log.error('[CLIENT-ERRORS] Envoi de l\'alerte impossible :', err?.message));
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

// ─── Enregistrement ──────────────────────────────────────────────────────────

export async function recordClientError(
  e: ClientErrorInput,
  user?: { id?: string; email?: string } | null,
): Promise<void> {
  const fingerprint = fingerprintOf(e);
  const now = new Date();
  log.warn('client_error', { kind: e.kind, route: e.route, code: e.code, msg: e.message.slice(0, 200), userId: user?.id });

  const existing = await prisma.clientError.findUnique({ where: { fingerprint } });

  if (!existing) {
    if (Date.now() - newGroupsWindowStart > COOLDOWN_MS) {
      newGroupsWindowStart = Date.now();
      newGroupsInWindow = 0;
    }
    if (++newGroupsInWindow > MAX_NEW_GROUPS_PER_HOUR) return; // déjà loggé ci-dessus

    try {
      await prisma.clientError.create({
        data: {
          fingerprint,
          kind: e.kind,
          name: e.name,
          message: e.message,
          stack: e.stack,
          componentStack: e.componentStack,
          route: e.route,
          release: e.release,
          userIds: user?.id ? [user.id] : [],
          codes: e.code ? [e.code] : [],
          lastUserEmail: user?.email,
          lastUserAgent: e.userAgent,
          firstSeen: now,
          lastSeen: now,
        },
      });
      queueAlert({ message: e.message, route: e.route, kind: e.kind, regression: false });
      return;
    } catch (err: any) {
      // Course : deux occurrences simultanées de la même nouvelle erreur → on passe à l'update
      if (err?.code !== 'P2002') throw err;
    }
  }

  const current = existing ?? (await prisma.clientError.findUnique({ where: { fingerprint } }));
  if (!current) return;

  const userIds = user?.id && !current.userIds.includes(user.id) && current.userIds.length < MAX_USERS
    ? [...current.userIds, user.id]
    : current.userIds;
  const codes = e.code ? [...current.codes, e.code].slice(-MAX_CODES) : current.codes;

  await prisma.clientError.update({
    where: { id: current.id },
    data: {
      count: { increment: 1 },
      lastSeen: now,
      route: e.route,
      release: e.release ?? current.release,
      stack: e.stack ?? current.stack,
      componentStack: e.componentStack ?? current.componentStack,
      userIds,
      codes,
      lastUserEmail: user?.email ?? current.lastUserEmail,
      lastUserAgent: e.userAgent ?? current.lastUserAgent,
      // Une erreur marquée résolue qui revient = régression : on la rouvre
      ...(current.resolved ? { resolved: false, resolvedAt: null } : {}),
    },
  });

  if (current.resolved) {
    queueAlert({ message: e.message, route: e.route, kind: e.kind, regression: true });
  }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function listClientErrors(opts: { status: 'open' | 'resolved' | 'all'; q?: string; limit: number }) {
  const where: any = {};
  if (opts.status === 'open') where.resolved = false;
  if (opts.status === 'resolved') where.resolved = true;
  if (opts.q) {
    const q = opts.q.trim();
    where.OR = /^AB-[A-Z0-9]{4,6}$/i.test(q)
      ? [{ codes: { has: q.toUpperCase() } }]
      : [
          { message: { contains: q, mode: 'insensitive' } },
          { route: { contains: q, mode: 'insensitive' } },
          { lastUserEmail: { contains: q, mode: 'insensitive' } },
        ];
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [items, openCount, seen24h] = await Promise.all([
    prisma.clientError.findMany({ where, orderBy: { lastSeen: 'desc' }, take: opts.limit }),
    prisma.clientError.count({ where: { resolved: false } }),
    prisma.clientError.count({ where: { lastSeen: { gte: since24h } } }),
  ]);

  return {
    openCount,
    seen24h,
    items: items.map((i) => ({ ...i, usersCount: i.userIds.length, userIds: undefined })),
  };
}

export async function setClientErrorResolved(id: string, resolved: boolean) {
  return prisma.clientError.update({
    where: { id },
    data: { resolved, resolvedAt: resolved ? new Date() : null },
  });
}
