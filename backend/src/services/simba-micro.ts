/**
 * simba-micro.ts — Singleton Groq partagé pour les usages courts de SIMBA
 * (pulse du marché quotidien + résumé email watchlist hebdomadaire)
 *
 * Remplace les imports dynamiques `await import('groq-sdk')` dans pulse-marche.job.ts
 * et watchlist-summary.service.ts — une seule connexion HTTP Groq pour les deux.
 */

import Groq from 'groq-sdk';
import { log } from '../config/logger';

// ─── Singleton ────────────────────────────────────────────────────────────────

let _groq: Groq | null = null;

function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });
  }
  return _groq;
}

// ─── System prompt minimal aligné avec la charte SIMBA ───────────────────────

const SIMBA_MICRO_SYSTEM = `Tu es SIMBA, le coach financier d'Afribourse, spécialisé sur la BRVM (Afrique de l'Ouest).
Tu réponds en français, ton bienveillant et professionnel.
Ne fais jamais de conseil direct d'achat ou de vente.
⚠️ Tout investissement comporte des risques de perte en capital.`.trim();

// ─── Question d'engagement pour le Pulse du marché ───────────────────────────

interface StockSummary {
  symbol: string;
  company_name: string | null;
  current_price: number | null;
  daily_change_percent: number | null;
}

function fallbackPulseQuestion(stock: StockSummary): string {
  const change = stock.daily_change_percent != null
    ? `${stock.daily_change_percent >= 0 ? '+' : ''}${stock.daily_change_percent.toFixed(2)}%`
    : 'en mouvement';
  return `${stock.symbol} est à ${change} aujourd'hui — est-ce le moment d'agir ou préférez-vous attendre une confirmation ? 👇`;
}

export async function generatePulseQuestion(stock: StockSummary): Promise<string> {
  try {
    const change = stock.daily_change_percent != null
      ? `${stock.daily_change_percent >= 0 ? '+' : ''}${stock.daily_change_percent.toFixed(2)}%`
      : 'en mouvement';
    const price = stock.current_price != null
      ? `${stock.current_price.toLocaleString('fr-FR')} FCFA`
      : '';

    const chat = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL_FAST || 'llama-3.1-8b-instant',
      max_tokens: 120,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SIMBA_MICRO_SYSTEM },
        {
          role: 'user',
          content: `${stock.symbol} (${stock.company_name ?? 'N/D'}) est à ${change} aujourd'hui${price ? `, coté ${price}` : ''}. Pose une seule question courte et engageante (max 2 phrases) pour lancer la discussion sur ce titre dans la communauté.`,
        },
      ],
    });

    return chat.choices[0]?.message?.content?.trim() ?? fallbackPulseQuestion(stock);
  } catch (err: any) {
    log.warn('[simba-micro] generatePulseQuestion fallback :', err?.message);
    return fallbackPulseQuestion(stock);
  }
}

// ─── Résumé watchlist pour l'email hebdomadaire ───────────────────────────────

export async function generateWatchlistSummary(
  items: Array<{ stock_ticker: string; pnl_pct?: number | null }>,
  scores: Array<{ ticker: string; score: number; zone: string }>,
): Promise<string> {
  try {
    const scoreMap = Object.fromEntries(scores.map((s) => [s.ticker, s]));
    const lines = items
      .map((i) => {
        const s = scoreMap[i.stock_ticker];
        const pnl = i.pnl_pct != null
          ? `P&L: ${i.pnl_pct >= 0 ? '+' : ''}${i.pnl_pct.toFixed(1)}%`
          : '';
        const zone = s ? `Score: ${s.score}/100 (${s.zone})` : '';
        return `${i.stock_ticker} — ${[pnl, zone].filter(Boolean).join(', ')}`;
      })
      .join('\n');

    const chat = await getGroq().chat.completions.create({
      model: process.env.GROQ_MODEL_FAST || 'llama-3.1-8b-instant',
      max_tokens: 200,
      temperature: 0.5,
      messages: [
        { role: 'system', content: SIMBA_MICRO_SYSTEM },
        {
          role: 'user',
          content: `Voici la watchlist de cette semaine :\n${lines}\nFais un bref résumé de la situation en 3 phrases maximum. Pas de bullet points. Rappelle l'importance de la diversification si pertinent.`,
        },
      ],
    });

    return chat.choices[0]?.message?.content?.trim() ?? '';
  } catch (err: any) {
    log.warn('[simba-micro] generateWatchlistSummary fallback :', err?.message);
    return '';
  }
}
