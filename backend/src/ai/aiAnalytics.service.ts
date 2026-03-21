/**
 * AI Analytics Service — Monitoring du Coach SIMBA
 *
 * Métriques trackées via UserActionTracking :
 *  - Temps de réponse          (action_type: 'ai_call')
 *  - Provider utilisé           (groq / huggingface / guardrail / fallback)
 *  - Tokens consommés           (metadata.tokensUsed)
 *  - Topics bloqués             (metadata.blocked, metadata.blockedReason)
 *  - Endpoint                   (metadata.endpoint)
 *  - Satisfaction utilisateur   (action_type: 'ai_feedback', metadata.rating)
 *  - Questions les plus posées  (agrégation sur metadata.question)
 */

import prisma from '../config/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AICallEvent {
  userId: string;
  sessionId: string;
  endpoint: string;
  provider: string;
  responseTimeMs: number;
  tokensUsed?: number;
  blocked: boolean;
  blockedReason?: string;
  question?: string;        // premiers 200 chars (anonymisé)
  success: boolean;
}

export interface AIFeedbackEvent {
  userId: string;
  sessionId: string;
  endpoint: string;
  messageId: string;        // ID côté frontend pour corréler question/réponse
  rating: 'positive' | 'negative';
}

// ─── Track un appel IA ────────────────────────────────────────────────────────

export async function trackAICall(event: AICallEvent): Promise<void> {
  try {
    await prisma.userActionTracking.create({
      data: {
        userId: event.userId,
        sessionId: event.sessionId,
        action_type: 'ai_call',
        action_name: `SIMBA — ${event.endpoint}`,
        metadata: {
          endpoint: event.endpoint,
          provider: event.provider,
          responseTimeMs: event.responseTimeMs,
          tokensUsed: event.tokensUsed ?? null,
          blocked: event.blocked,
          blockedReason: event.blockedReason ?? null,
          question: event.question ? event.question.slice(0, 200) : null,
          success: event.success,
        },
      },
    });
  } catch {
    // Ne jamais bloquer la réponse IA pour une erreur de tracking
  }
}

// ─── Track un feedback (👍 / 👎) ──────────────────────────────────────────────

export async function trackAIFeedback(event: AIFeedbackEvent): Promise<void> {
  await prisma.userActionTracking.create({
    data: {
      userId: event.userId,
      sessionId: event.sessionId,
      action_type: 'ai_feedback',
      action_name: `Feedback SIMBA — ${event.endpoint}`,
      metadata: {
        endpoint: event.endpoint,
        messageId: event.messageId,
        rating: event.rating,
      },
    },
  });
}

// ─── Agrégations (Admin Dashboard) ───────────────────────────────────────────

export interface AISummary {
  totalCalls: number;
  avgResponseTimeMs: number;
  satisfactionRate: number;    // % de feedbacks positifs
  blockedRate: number;         // % de messages bloqués
  callsByEndpoint: Record<string, number>;
  callsByProvider: Record<string, number>;
  topBlockedReasons: Array<{ reason: string; count: number }>;
  topQuestions: Array<{ question: string; count: number }>;
}

export async function getAISummary(since?: Date): Promise<AISummary> {
  const from = since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours par défaut

  const [calls, feedbacks] = await Promise.all([
    prisma.userActionTracking.findMany({
      where: { action_type: 'ai_call', created_at: { gte: from } },
      select: { metadata: true },
    }),
    prisma.userActionTracking.findMany({
      where: { action_type: 'ai_feedback', created_at: { gte: from } },
      select: { metadata: true },
    }),
  ]);

  // Temps de réponse moyen
  const times = calls
    .map((c) => (c.metadata as any)?.responseTimeMs as number)
    .filter(Boolean);
  const avgResponseTimeMs = times.length
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;

  // Taux de satisfaction
  const positiveFeedbacks = feedbacks.filter((f) => (f.metadata as any)?.rating === 'positive').length;
  const satisfactionRate = feedbacks.length
    ? Math.round((positiveFeedbacks / feedbacks.length) * 100)
    : 0;

  // Taux de blocage
  const blockedCalls = calls.filter((c) => (c.metadata as any)?.blocked === true).length;
  const blockedRate = calls.length
    ? Math.round((blockedCalls / calls.length) * 100)
    : 0;

  // Répartition par endpoint
  const callsByEndpoint: Record<string, number> = {};
  for (const c of calls) {
    const ep = (c.metadata as any)?.endpoint ?? 'unknown';
    callsByEndpoint[ep] = (callsByEndpoint[ep] ?? 0) + 1;
  }

  // Répartition par provider
  const callsByProvider: Record<string, number> = {};
  for (const c of calls) {
    const prov = (c.metadata as any)?.provider ?? 'unknown';
    callsByProvider[prov] = (callsByProvider[prov] ?? 0) + 1;
  }

  // Top raisons de blocage
  const blockedMap: Record<string, number> = {};
  for (const c of calls.filter((c) => (c.metadata as any)?.blocked)) {
    const reason = (c.metadata as any)?.blockedReason ?? 'inconnu';
    blockedMap[reason] = (blockedMap[reason] ?? 0) + 1;
  }
  const topBlockedReasons = Object.entries(blockedMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([reason, count]) => ({ reason, count }));

  // Top questions
  const questionMap: Record<string, number> = {};
  for (const c of calls) {
    const q = (c.metadata as any)?.question;
    if (q) questionMap[q] = (questionMap[q] ?? 0) + 1;
  }
  const topQuestions = Object.entries(questionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([question, count]) => ({ question, count }));

  return {
    totalCalls: calls.length,
    avgResponseTimeMs,
    satisfactionRate,
    blockedRate,
    callsByEndpoint,
    callsByProvider,
    topBlockedReasons,
    topQuestions,
  };
}
