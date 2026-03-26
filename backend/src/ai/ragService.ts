/**
 * RAG Service — Retrieval Augmented Generation pour SIMBA
 *
 * Sources intégrées :
 *  1. Modules d'apprentissage (16 modules + quiz Q&A)
 *  2. Données marché : prix, fondamentaux, ratios, CompanyInfo
 *  3. Indices BRVM (BRVM Composite, BRVM 10…)
 *  4. Actualités financières récentes
 *
 * Architecture :
 *  - Cache in-memory TTL (évite les requêtes DB répétitives)
 *  - Scoring par mots-clés (rapide, sans dépendance externe)
 *  - Injection du contexte dans le prompt SIMBA
 */

import prisma from '../config/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgeDoc {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: 'module' | 'quiz' | 'stock' | 'fundamental' | 'index' | 'news' | 'company';
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// ─── Cache TTL ────────────────────────────────────────────────────────────────

const cache = new Map<string, CacheEntry<KnowledgeDoc[]>>();

function getCache(key: string): KnowledgeDoc[] | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data;
}

function setCache(key: string, data: KnowledgeDoc[], ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ─── Loaders DB ───────────────────────────────────────────────────────────────

/** Modules pédagogiques + contenu des quiz (Q/A) */
async function loadModules(): Promise<KnowledgeDoc[]> {
  const cached = getCache('modules');
  if (cached) return cached;

  const modules = await prisma.learningModule.findMany({
    where: { is_published: true },
    select: {
      id: true,
      title: true,
      description: true,
      content: true,
      difficulty_level: true,
      quizzes: { select: { questions: true } },
    },
    orderBy: { order_index: 'asc' },
  });

  const docs: KnowledgeDoc[] = [];

  for (const mod of modules) {
    // Document principal du module
    docs.push({
      id: `module-${mod.id}`,
      title: mod.title,
      content: [mod.description, mod.content].filter(Boolean).join('\n').slice(0, 3000),
      tags: ['module', 'apprentissage', mod.difficulty_level, ...mod.title.toLowerCase().split(' ')],
      source: 'module',
    });

    // Questions/réponses du quiz
    for (const quiz of mod.quizzes) {
      const questions = quiz.questions as any[];
      if (!Array.isArray(questions)) continue;

      const qaText = questions.map((q: any) => {
        const options = Array.isArray(q.options) ? q.options.join(' | ') : '';
        const explanation = q.explanation || '';
        return `Q: ${q.question}\nOptions: ${options}\nExplication: ${explanation}`;
      }).join('\n\n');

      if (qaText.length > 0) {
        docs.push({
          id: `quiz-${mod.id}`,
          title: `Quiz — ${mod.title}`,
          content: qaText.slice(0, 2000),
          tags: ['quiz', 'evaluation', mod.difficulty_level, ...mod.title.toLowerCase().split(' ')],
          source: 'quiz',
        });
      }
    }
  }

  setCache('modules', docs, 30 * 60 * 1000); // TTL 30 min
  return docs;
}

/** Indices BRVM actuels */
async function loadIndices(): Promise<KnowledgeDoc[]> {
  const cached = getCache('indices');
  if (cached) return cached;

  const indices = await prisma.marketIndex.findMany({
    orderBy: { date: 'desc' },
    take: 10,
  });

  const docs: KnowledgeDoc[] = indices.map((idx) => ({
    id: `index-${idx.id}`,
    title: `Indice ${idx.index_name}`,
    content: `L'indice ${idx.index_name} est à ${idx.index_value.toFixed(2)} points au ${idx.date.toLocaleDateString('fr-FR')}, variation journalière : ${idx.daily_change_percent >= 0 ? '+' : ''}${idx.daily_change_percent.toFixed(2)}%.`,
    tags: ['indice', 'brvm', idx.index_name.toLowerCase(), 'marché'],
    source: 'index',
  }));

  setCache('indices', docs, 5 * 60 * 1000); // TTL 5 min (données en temps réel)
  return docs;
}

/** Actions cotées avec fondamentaux et info entreprise */
async function loadStocks(symbol?: string): Promise<KnowledgeDoc[]> {
  const cacheKey = symbol ? `stock-${symbol}` : 'stocks-all';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const stocks = await prisma.stock.findMany({
    where: symbol ? { symbol } : { is_active: true },
    select: {
      symbol: true,
      company_name: true,
      sector: true,
      description: true,
      current_price: true,
      daily_change_percent: true,
      market_cap: true,
      volume: true,
      fundamentals: {
        orderBy: { year: 'desc' },
        take: 1,
        select: {
          pe_ratio: true, pb_ratio: true, dividend_yield: true,
          roe: true, roa: true, profit_margin: true, debt_to_equity: true,
          eps: true, book_value: true, revenue: true, net_income: true, year: true,
        },
      },
    },
    take: symbol ? 1 : 60,
  });

  const docs: KnowledgeDoc[] = stocks.map((s) => {
    const f = s.fundamentals[0];
    const fundamentalStr = f ? [
      f.pe_ratio != null ? `PER: ${f.pe_ratio.toFixed(2)}` : null,
      f.pb_ratio != null ? `PBR: ${f.pb_ratio.toFixed(2)}` : null,
      f.dividend_yield != null ? `Rendement dividende: ${f.dividend_yield.toFixed(2)}%` : null,
      f.roe != null ? `ROE: ${f.roe.toFixed(2)}%` : null,
      f.profit_margin != null ? `Marge nette: ${f.profit_margin.toFixed(2)}%` : null,
      f.eps != null ? `BPA: ${f.eps.toFixed(2)} FCFA` : null,
      // revenue & net_income sont en millions de FCFA (÷1000 = Mds)
      f.revenue != null ? `CA: ${f.revenue >= 1000 ? (f.revenue / 1000).toFixed(0) + ' Mds' : f.revenue.toFixed(0) + ' M'} FCFA` : null,
      f.net_income != null ? `Résultat net: ${f.net_income >= 1000 ? (f.net_income / 1000).toFixed(0) + ' Mds' : f.net_income.toFixed(0) + ' M'} FCFA` : null,
      f.year ? `Année: ${f.year}` : null,
    ].filter(Boolean).join(' | ') : 'Fondamentaux non disponibles';

    return {
      id: `stock-${s.symbol}`,
      title: `${s.company_name} (${s.symbol})`,
      content: [
        `Secteur : ${s.sector ?? 'N/D'}.`,
        s.description ? s.description.slice(0, 300) : '',
        `Prix : ${s.current_price} FCFA | Variation : ${s.daily_change_percent >= 0 ? '+' : ''}${s.daily_change_percent.toFixed(2)}%`,
        `Capitalisation : ${s.market_cap ? (s.market_cap / 1e9).toFixed(2) + ' Mds FCFA' : 'N/D'}`,
        `Fondamentaux — ${fundamentalStr}`,
      ].join('\n'),
      tags: [s.symbol.toLowerCase(), s.company_name.toLowerCase(), s.sector?.toLowerCase() ?? '', 'action', 'bourse'],
      source: 'stock',
    };
  });

  setCache(cacheKey, docs, 5 * 60 * 1000); // TTL 5 min
  return docs;
}

/** Actualités financières récentes */
async function loadNews(): Promise<KnowledgeDoc[]> {
  const cached = getCache('news');
  if (cached) return cached;

  const articles = await prisma.newsArticle.findMany({
    orderBy: { published_at: 'desc' },
    take: 20,
    select: {
      id: true, title: true, summary: true, category: true,
      sector: true, published_at: true,
    },
  });

  const docs: KnowledgeDoc[] = articles.map((a) => ({
    id: `news-${a.id}`,
    title: a.title,
    content: [
      a.summary ?? '',
      a.published_at ? `Publié le ${a.published_at.toLocaleDateString('fr-FR')}` : '',
    ].join(' '),
    tags: ['actualité', 'news', a.category ?? '', a.sector ?? ''].filter(Boolean),
    source: 'news',
  }));

  setCache('news', docs, 10 * 60 * 1000); // TTL 10 min
  return docs;
}

// ─── Scoring & Retrieval ──────────────────────────────────────────────────────

function scoreDoc(doc: KnowledgeDoc, queryWords: string[]): number {
  let score = 0;
  const contentLower = doc.content.toLowerCase();
  const titleLower = doc.title.toLowerCase();

  for (const word of queryWords) {
    if (word.length < 3) continue;
    if (titleLower.includes(word)) score += 4;
    if (doc.tags.some((tag) => tag.includes(word))) score += 3;
    if (contentLower.includes(word)) score += 2;
  }
  return score;
}

/** Recherche et retourne les topK documents les plus pertinents */
export async function retrieveContext(
  query: string,
  topK = 4,
  sources?: KnowledgeDoc['source'][],
): Promise<KnowledgeDoc[]> {
  const queryWords = query.toLowerCase().split(/\s+/);

  // Chargement parallèle de toutes les sources
  const [modules, indices, stocks, news] = await Promise.all([
    loadModules(),
    loadIndices(),
    loadStocks(),
    loadNews(),
  ]);

  let allDocs = [...modules, ...indices, ...stocks, ...news];

  // Filtre par source si spécifié
  if (sources?.length) {
    allDocs = allDocs.filter((d) => sources.includes(d.source));
  }

  return allDocs
    .map((doc) => ({ doc, score: scoreDoc(doc, queryWords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ doc }) => doc);
}

/** Charge le contexte pour un ticker spécifique (page action) */
export async function retrieveStockContext(symbol: string): Promise<KnowledgeDoc[]> {
  return loadStocks(symbol);
}

// ─── Injection du contexte dans le prompt ────────────────────────────────────

/** Retourne le message user augmenté avec le contexte RAG */
export async function buildContextualPrompt(userQuery: string): Promise<string> {
  const docs = await retrieveContext(userQuery, 4);

  if (docs.length === 0) return userQuery;

  const contextStr = docs
    .map((doc) => `[${doc.title}] : ${doc.content}`)
    .join('\n\n');

  return `CONTEXTE AFRIBOURSE PERTINENT :
${contextStr}

QUESTION DE L'UTILISATEUR :
${userQuery}

Réponds en utilisant prioritairement le contexte fourni ci-dessus.`;
}

/** Efface le cache (utile après une mise à jour des données) */
export function clearRAGCache(): void {
  cache.clear();
}
