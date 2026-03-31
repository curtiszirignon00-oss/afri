/**
 * Tutor RAG — Recherche de modules pertinents par mots-clés pondérés
 * Pas de base vectorielle : suffisant pour < 20 modules, zéro infrastructure
 */

import prisma from '../config/prisma';
import { flattenModule, summarizeModule } from './moduleExtractor';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KnowledgeEntry {
  id: string;
  summary: ReturnType<typeof summarizeModule>;
  flatText: string;
  flatTextLower: string;
  tokens: string[];
}

// ─── Cache en mémoire ─────────────────────────────────────────────────────────

let KNOWLEDGE_BASE: KnowledgeEntry[] | null = null;

// ─── Mots vides français ──────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'est', 'en',
  'que', 'qui', 'je', 'il', 'elle', 'nous', 'vous', 'ils', 'on', 'par',
  'pour', 'dans', 'sur', 'avec', 'ce', 'se', 'sa', 'son', 'ses', 'au',
  'aux', 'ou', 'mais', 'donc', 'car', 'ni', 'si', 'ne', 'pas', 'plus',
  'comme', 'quoi', 'comment', 'pourquoi', 'quand', 'combien', 'quel',
  'quelle', 'quels', 'quelles', 'cest', 'faire', 'avoir', 'tout',
]);

// ─── Synonymes financiers BRVM ────────────────────────────────────────────────

const FINANCIAL_SYNONYMS: Record<string, string[]> = {
  action:        ['actions', 'titre', 'titres', 'part', 'parts', 'actionnaire'],
  obligation:    ['obligations', 'bond', 'bonds', 'dette'],
  brvm:          ['bourse', 'marché', 'cote', 'coté'],
  dividende:     ['dividendes', 'rendement', 'distribution'],
  per:           ['p/e', 'price earning', 'ratio cours bénéfice'],
  capitalisation: ['cap', 'market cap', 'valorisation'],
  indice:        ['indices', 'brvm composite', 'brvm10'],
  roe:           ['return on equity', 'rentabilité fonds propres'],
  eps:           ['bpa', 'bénéfice par action'],
  analyse:       ['analyser', 'analyste', 'étudier', 'comprendre'],
  investir:      ['investissement', 'investisseur', 'placer', 'placement'],
  risque:        ['risques', 'volatilité', 'perte'],
  portefeuille:  ['portfolio', 'positions', 'allocation'],
  liquidité:     ['liquidite', 'liquide', 'cash'],
  diversification: ['diversifier', 'diversifié', 'répartition'],
};

// ─── Tokenizer ────────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôùûüç\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function expandQuery(queryTokens: string[]): string[] {
  const expanded = new Set(queryTokens);
  for (const token of queryTokens) {
    for (const [canonical, synonyms] of Object.entries(FINANCIAL_SYNONYMS)) {
      if (synonyms.includes(token) || token === canonical) {
        expanded.add(canonical);
        synonyms.forEach((s) => expanded.add(s));
      }
    }
  }
  return [...expanded];
}

// ─── Construction de la base de connaissance ──────────────────────────────────

export async function buildKnowledgeBase(): Promise<void> {
  const modules = await prisma.learningModule.findMany({
    where: { is_published: true },
    select: { id: true, title: true, slug: true, content: true, content_json: true },
  });

  KNOWLEDGE_BASE = modules
    .map((mod) => {
      // Priorité : content_json (format structuré) → content (texte brut)
      let flatText = '';
      try {
        if (mod.content_json) {
          const parsed = typeof mod.content_json === 'string'
            ? JSON.parse(mod.content_json)
            : mod.content_json;
          flatText = flattenModule(parsed);
        } else if (mod.content) {
          // Fallback : contenu texte/HTML brut
          flatText = mod.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      } catch {
        flatText = mod.title ?? '';
      }

      // Si toujours vide, on met au moins le titre
      if (!flatText) flatText = mod.title ?? '';

      let summary: ReturnType<typeof summarizeModule>;
      try {
        if (mod.content_json) {
          const parsed = typeof mod.content_json === 'string'
            ? JSON.parse(mod.content_json)
            : mod.content_json;
          summary = summarizeModule(parsed);
          // Fallback sur le titre DB si le JSON n'a pas de header.title
          if (!summary.title) summary.title = mod.title ?? '';
        } else {
          summary = { moduleNumber: undefined, lessonNumber: undefined, title: mod.title ?? '', objectives: [], sectionTitles: [] };
        }
      } catch {
        summary = { moduleNumber: undefined, lessonNumber: undefined, title: mod.title ?? '', objectives: [], sectionTitles: [] };
      }

      return {
        id: mod.id,
        summary,
        flatText,
        flatTextLower: flatText.toLowerCase(),
        tokens: tokenize(flatText),
      };
    })
    .filter((e: KnowledgeEntry) => e.flatText.length > 10);

  console.log(`[TUTOR RAG] Base de connaissance chargée : ${KNOWLEDGE_BASE.length} modules`);
}

// ─── Recherche ────────────────────────────────────────────────────────────────

function retrieveRelevantModules(userQuery: string, topK = 3): (KnowledgeEntry & { score: number })[] {
  if (!KNOWLEDGE_BASE?.length) return [];

  const queryTokens = tokenize(userQuery);
  const expandedTokens = expandQuery(queryTokens);

  const scored = KNOWLEDGE_BASE.map((mod) => {
    let score = 0;

    // Titre (poids ×5)
    const titleLower = mod.summary.title.toLowerCase();
    expandedTokens.forEach((t) => { if (titleLower.includes(t)) score += 5; });

    // Titres de sections (poids ×3)
    mod.summary.sectionTitles.forEach((st) => {
      const stLower = st.toLowerCase();
      expandedTokens.forEach((t) => { if (stLower.includes(t)) score += 3; });
    });

    // Objectifs (poids ×3)
    mod.summary.objectives.forEach((obj) => {
      const objLower = obj.toLowerCase();
      expandedTokens.forEach((t) => { if (objLower.includes(t)) score += 3; });
    });

    // Corps du texte — fréquence plafonnée (poids ×1)
    expandedTokens.forEach((t) => {
      const matches = (mod.flatTextLower.match(new RegExp(t, 'g')) ?? []).length;
      score += Math.min(matches, 10);
    });

    return { ...mod, score };
  });

  return scored
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── Bloc contexte à injecter dans le prompt ──────────────────────────────────

export function buildContextBlock(userQuery: string): string | null {
  const relevant = retrieveRelevantModules(userQuery, 3);
  if (!relevant.length) return null;

  const contextParts = relevant.map((mod) => {
    const excerpt = mod.flatText.length > 1500
      ? mod.flatText.slice(0, 1500) + '...[tronqué]'
      : mod.flatText;
    const label = mod.summary.moduleNumber != null
      ? `Module ${mod.summary.moduleNumber} : ${mod.summary.title}`
      : mod.summary.title;
    return `=== ${label} ===\n${excerpt}`;
  });

  return contextParts.join('\n\n---\n\n');
}

/** Permet de recharger la base (ex: après ajout d'un module) */
export function invalidateKnowledgeBase(): void {
  KNOWLEDGE_BASE = null;
}
