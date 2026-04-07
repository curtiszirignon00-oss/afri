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

// Allocation de repli si Simba échoue
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
      tickers: ['BOAB', 'SGBC', 'ECOBANK'],
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

export async function generateBRVMAllocation(
  profile: AllocationInput
): Promise<AllocationItem[]> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

  const sectorsHint =
    profile.favorite_sectors && profile.favorite_sectors.length > 0
      ? profile.favorite_sectors.join(', ')
      : 'non spécifiés';

  const prompt = `Tu es Simba, l'expert IA de la BRVM (Bourse Régionale des Valeurs Mobilières d'Afrique de l'Ouest).
Génère une répartition sectorielle éducative pour un investisseur avec ce profil :
- Objectif de vie : ${profile.life_goal ?? 'non spécifié'}
- Profil de risque : ${profile.risk_profile ?? 'BALANCED'}
- Horizon : ${profile.investment_horizon ?? 'LONG_TERM'}
- Score investisseur : ${profile.investor_score ?? 50}/100
- Secteurs préférés : ${sectorsHint}

Retourne UNIQUEMENT un tableau JSON valide (sans markdown, sans commentaires) avec ce format exact :
[{"sector":"Nom du secteur","pct":30,"tickers":["TICKER1","TICKER2"],"rationale":"Explication courte. Source : données historiques BRVM."}]

Règles impératives :
- Les pourcentages (pct) doivent sommer à exactement 100
- Utiliser uniquement des tickers BRVM réels : SNTS, ORAC, BOAB, SGBC, CBIBF, BOAN, PALC, SIVC, SOGC, CFAC, NTLC, SHEC, ECOBANK, STBC, BICC, ONTBF, SDSC
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

    // Le mode json_object retourne un objet — on cherche le tableau dedans
    const parsed = JSON.parse(raw);
    const arr: AllocationItem[] = Array.isArray(parsed)
      ? parsed
      : parsed.allocation ?? parsed.sectors ?? parsed.data ?? [];

    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error('Réponse vide ou invalide de Simba');
    }

    // Vérifier que les pct somment à ~100
    const total = arr.reduce((sum: number, item: AllocationItem) => sum + (item.pct ?? 0), 0);
    if (Math.abs(total - 100) > 5) {
      throw new Error(`Somme des pct invalide : ${total}`);
    }

    return arr;
  } catch (err: any) {
    log.warn(`[simba-allocation] Fallback sur allocation par défaut : ${err.message}`);
    return getDefaultAllocation(profile.risk_profile);
  }
}
