/**
 * Guardrails SIMBA — Sécurité & Protection de la marque Afribourse
 *
 * 1. preProcessMessage  : bloque les sujets hors périmètre ou illégaux
 * 2. postProcessResponse: ajoute les disclaimers légaux si nécessaire
 */

// ─── Topics bloqués ───────────────────────────────────────────────────────────

interface BlockedTopic {
  patterns: RegExp[]; // testés sur le message en minuscules
  message: string;
}

// Expressions précises (et non mots isolés) : « levier », « garanti » ou « sans risque »
// bloquaient des questions légitimes — effet de levier de la dette sur le ROE (enseigné
// dans les modules), taux sans risque (valorisation), obligation garantie…
const BLOCKED_TOPICS: BlockedTopic[] = [
  {
    patterns: [/\bcrypto/, /\bbitcoin/, /\bethereum\b/, /\bnft\b/, /\baltcoin/, /\bsolana\b/, /\bbinance\b/],
    message: 'Je suis spécialisé sur la BRVM et les marchés de la zone UEMOA. Les cryptomonnaies ne font pas partie de mon périmètre. Souhaitez-vous en savoir plus sur les actions ou obligations cotées à la BRVM ?',
  },
  {
    patterns: [/manipul\w* (de |du |des |le |la |les )?(march|cours)/, /\binsider\b/, /d[eé]lit d['’ ]?initi[eé]/],
    message: 'Ce sujet concerne des pratiques illégales que je ne peux pas aborder. Si vous avez des doutes sur des irrégularités de marché, contactez le CREPMF (régulateur de la BRVM).',
  },
  {
    patterns: [
      /(rendement|gain|gains|profit|profits|bénéfice|benefice|plus-value|revenu)s? garanti/,
      /garanti\w* (à|a) 100/,
      /(placement|investissement|gain|gains|profit|argent|rendement)s? sans risque/,
      /100 ?% (sûr|sur)\b/,
    ],
    message: 'Aucun investissement ne peut garantir un rendement. Tout placement comporte un risque de perte en capital. Je vous invite à explorer notre simulateur pour comprendre les risques.',
  },
  {
    patterns: [/\bforex\b/, /options? binaires?/, /\bcfds?\b/, /trading (à |a )?haute fréquence/, /margin trading/, /trading (à|a|avec) (effet de )?levier/, /\blevier (x ?)?\d+/],
    message: 'Ces produits financiers ne sont pas disponibles sur la BRVM. Mon domaine d\'expertise se limite aux actions et obligations cotées sur le marché UEMOA.',
  },
  {
    patterns: [/\bponzi\b/, /pyramide (de ponzi|financi)/, /\bmlm\b/, /investissement miraculeux/, /enrichissement rapide/],
    message: 'Je ne peux pas traiter ce type de demande. Méfiez-vous des promesses de gains rapides, elles sont souvent associées à des arnaques financières.',
  },
];

// ─── Mots déclenchant un disclaimer légal en post-traitement ─────────────────

const INVESTMENT_ADVICE_KEYWORDS = [
  'investir', 'acheter', 'vendre', 'placer', 'acquérir', 'céder',
  'arbitrage', 'position', 'prise de position',
];

const DISCLAIMER =
  '\n\n⚠️ *Rappel : tout investissement comporte des risques, y compris la perte du capital investi. Les informations fournies sont éducatives et ne constituent pas un conseil en investissement. Commencez par notre simulateur gratuit avant d\'investir.*';

// ─── Pre-processing ───────────────────────────────────────────────────────────

export type PreProcessResult =
  | { blocked: true; reason: string; fallbackMessage: string }
  | { blocked: false; processedMessage: string };

export function preProcessMessage(userMessage: string): PreProcessResult {
  const lower = userMessage.toLowerCase();

  for (const topic of BLOCKED_TOPICS) {
    const matched = topic.patterns.find((re) => re.test(lower));
    if (matched) {
      return {
        blocked: true,
        reason: matched.source,
        fallbackMessage: topic.message,
      };
    }
  }

  return {
    blocked: false,
    processedMessage: userMessage.trim().slice(0, 1000),
  };
}

// ─── Post-processing ──────────────────────────────────────────────────────────

export function postProcessResponse(aiResponse: string): string {
  const lower = aiResponse.toLowerCase();

  const hasInvestmentAdvice = INVESTMENT_ADVICE_KEYWORDS.some((kw) => lower.includes(kw));
  const hasRiskMention = lower.includes('risque') || lower.includes('perte');

  if (hasInvestmentAdvice && !hasRiskMention) {
    return aiResponse + DISCLAIMER;
  }

  return aiResponse;
}

// ─── Strip intro répétitive du tuteur ────────────────────────────────────────
// Le LLM a tendance à se réintroduire à chaque réponse malgré les instructions.
// Ce strip est appliqué sur toutes les réponses sauf le message de bienvenue.

const INTRO_PATTERNS = [
  // "Bonjour ! Je suis SIMBA..." ou variantes
  /^(bonjour\s*[!.]?\s*(je suis\s+)?simba[^.!?\n]*[.!?]?\s*)/i,
  // "Bonsoir ! Je suis SIMBA..."
  /^(bonsoir\s*[!.]?\s*(je suis\s+)?simba[^.!?\n]*[.!?]?\s*)/i,
  // "Bonjour !" seul en début
  /^(bonjour\s*[!.]\s*)/i,
  // "Je suis SIMBA, votre coach..." en début (sans salutation)
  /^(je suis simba[^.!?\n]*[.!?]\s*)/i,
  // "SIMBA ici..." ou "En tant que SIMBA..."
  /^(en tant que simba[^.!?\n]*[.!?]\s*)/i,
];

export function stripTutorIntro(text: string): string {
  let result = text.trim();
  for (const pattern of INTRO_PATTERNS) {
    result = result.replace(pattern, '').trim();
  }
  return result || text.trim(); // si tout a été supprimé, retourner l'original
}
