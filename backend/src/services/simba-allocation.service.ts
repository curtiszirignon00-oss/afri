// backend/src/services/simba-allocation.service.ts
// Génération d'allocation sectorielle BRVM via Simba (Groq)

import Groq from 'groq-sdk';
import { log } from '../config/logger';

export interface AllocationItem {
  sector: string;
  pct: number;
  tickers: string[];
  rationale: string;
}

export interface AllocationInput {
  risk_profile?: string;
  investment_horizon?: string;
  life_goal?: string;
  favorite_sectors?: string[];
  investor_score?: number;
}

// ─── Singleton Groq ───────────────────────────────────────────────────────────

let _groqInstance: Groq | null = null;

function getGroq(): Groq {
  if (!_groqInstance) {
    _groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });
  }
  return _groqInstance;
}

// ─── Tickers BRVM valides ─────────────────────────────────────────────────────

const BRVM_VALID_TICKERS = new Set([
  'SNTS', 'ORAC', 'BOAB', 'SGBC', 'CBIBF', 'BOAN', 'PALC', 'SIVC', 'SOGC',
  'CFAC', 'NTLC', 'SHEC', 'STBC', 'BICC', 'ONTBF', 'SDSC', 'ETIT', 'CABC',
  'BOABF', 'BOAC', 'BOAM', 'BOAS', 'BNBC', 'BICB', 'CFAC', 'CIEC', 'NEIC',
  'SAFC', 'SMBC', 'SVOC', 'TTLC', 'UNLC', 'BLOC', 'ORGT', 'PRSC',
]);

// ─── Validation & normalisation ───────────────────────────────────────────────

function validateAndNormalize(arr: AllocationItem[]): AllocationItem[] {
  // 1. Filtrer les items malformés
  const cleaned = arr.filter((item) => {
    if (!item.sector || typeof item.pct !== 'number') return false;
    if (!Array.isArray(item.tickers) || item.tickers.length === 0) return false;
    return true;
  });

  // 2. Filtrer les tickers inconnus et logger les anomalies
  const validated = cleaned.map((item) => {
    const validTickers = item.tickers.filter((t) => {
      const ok = BRVM_VALID_TICKERS.has(t.toUpperCase());
      if (!ok) log.warn(`[simba-allocation] Ticker inconnu filtré : ${t}`);
      return ok;
    });
    return { ...item, tickers: validTickers.length > 0 ? validTickers : item.tickers };
  });

  // 3. Normaliser sum(pct) → 100 si l'écart est < 5 pts
  const total = validated.reduce((sum, item) => sum + item.pct, 0);
  if (total > 0 && Math.abs(total - 100) < 5) {
    const factor = 100 / total;
    return validated.map((item) => ({ ...item, pct: Math.round(item.pct * factor) }));
  }

  return validated;
}

// ─── Allocation de repli ──────────────────────────────────────────────────────

function getDefaultAllocation(riskProfile?: string): AllocationItem[] {
  const isConservative =
    riskProfile === 'CONSERVATIVE' || riskProfile === 'MODERATE';

  if (isConservative) {
    return [
      {
        sector: 'Banques & Finance',
        pct: 40,
        tickers: ['BOAB', 'SGBC', 'CBIBF', 'BOAN'],
        rationale: 'Secteur défensif avec dividendes réguliers. Source : données historiques BRVM.',
      },
      {
        sector: 'Agro-industrie',
        pct: 30,
        tickers: ['PALC', 'SIVC', 'SOGC'],
        rationale: 'Activités liées aux matières premières locales, résistance aux cycles. Source : données historiques BRVM.',
      },
      {
        sector: 'Télécom',
        pct: 20,
        tickers: ['SNTS', 'ORAC'],
        rationale: 'Croissance régulière, faible volatilité relative. Source : données historiques BRVM.',
      },
      {
        sector: 'Distribution',
        pct: 10,
        tickers: ['CFAC', 'NTLC'],
        rationale: 'Exposition à la consommation locale. Source : données historiques BRVM.',
      },
    ];
  }

  return [
    {
      sector: 'Télécom',
      pct: 30,
      tickers: ['SNTS', 'ORAC'],
      rationale: 'Forte visibilité des revenus, dividendes attractifs. Source : données historiques BRVM.',
    },
    {
      sector: 'Banques & Finance',
      pct: 25,
      tickers: ['BOAB', 'SGBC', 'ETIT'],
      rationale: 'Croissance du crédit régional, dividendes réguliers. Source : données historiques BRVM.',
    },
    {
      sector: 'Agro-industrie',
      pct: 25,
      tickers: ['PALC', 'SIVC', 'SOGC'],
      rationale: 'Ancrage dans l\'économie réelle de l\'Afrique de l\'Ouest. Source : données historiques BRVM.',
    },
    {
      sector: 'Distribution & Services',
      pct: 20,
      tickers: ['CFAC', 'NTLC', 'SHEC'],
      rationale: 'Exposition à la consommation locale en croissance. Source : données historiques BRVM.',
    },
  ];
}

// ─── Génération principale ────────────────────────────────────────────────────

export async function generateBRVMAllocation(
  profile: AllocationInput
): Promise<AllocationItem[]> {
  const groq = getGroq();

  const sectorsHint =
    profile.favorite_sectors && profile.favorite_sectors.length > 0
      ? profile.favorite_sectors.join(', ')
      : 'non spécifiés';

  // Prompt aligné avec json_object — l'objet racine {"allocation":[...]} est explicite
  const prompt = `Tu es Simba, l'expert IA de la BRVM (Bourse Régionale des Valeurs Mobilières d'Afrique de l'Ouest).
Génère une répartition sectorielle éducative pour un investisseur avec ce profil :
- Objectif de vie : ${profile.life_goal ?? 'non spécifié'}
- Profil de risque : ${profile.risk_profile ?? 'BALANCED'}
- Horizon : ${profile.investment_horizon ?? 'LONG_TERM'}
- Score investisseur : ${profile.investor_score ?? 50}/100
- Secteurs préférés : ${sectorsHint}

Réponds avec un objet JSON ayant cette structure exacte :
{"allocation":[{"sector":"Nom du secteur","pct":30,"tickers":["TICKER1","TICKER2"],"rationale":"Explication courte. Source : données historiques BRVM."}]}

Règles impératives :
- Les pourcentages (pct) doivent sommer à exactement 100
- Utiliser uniquement des tickers BRVM réels : SNTS, ORAC, BOAB, SGBC, CBIBF, BOAN, PALC, SIVC, SOGC, CFAC, NTLC, SHEC, ETIT, STBC, BICC, ONTBF, SDSC
- Ne jamais mentionner de rendements futurs ni de performances promises
- La BRVM est un marché à faible liquidité : privilégier 3-5 secteurs maximum
- Chaque rationale doit se terminer par "Source : données historiques BRVM."`;

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(raw);

    // Extraction directe de parsed.allocation — plus d'heuristique fragile
    const arr: AllocationItem[] = Array.isArray(parsed.allocation)
      ? parsed.allocation
      : [];

    if (arr.length === 0) {
      throw new Error('Réponse vide ou invalide de Simba');
    }

    const validated = validateAndNormalize(arr);

    // Vérifier que la somme finale est acceptable
    const total = validated.reduce((sum, item) => sum + item.pct, 0);
    if (Math.abs(total - 100) > 5) {
      throw new Error(`Somme des pct invalide après validation : ${total}`);
    }

    return validated;
  } catch (err: any) {
    log.warn(`[simba-allocation] Fallback sur allocation par défaut : ${err.message}`);
    return getDefaultAllocation(profile.risk_profile);
  }
}
