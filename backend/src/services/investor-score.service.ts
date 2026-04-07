// backend/src/services/investor-score.service.ts
// Scoring déterministe 0-100 — Onboarding v2

export interface ScoreBreakdown {
  engagement: number;      // 0-25
  risque_horizon: number;  // 0-20
  regularite: number;      // 0-15
  diversification: number; // 0-15
  contexte_brvm: number;   // 0-25
  total: number;           // 0-100
}

export interface OnboardingScoreInput {
  quiz_score?: number;
  risk_profile?: string;
  investment_horizon?: string;
  life_goal?: string;
  income_source?: string;
  monthly_budget?: number;
  monthly_investment?: number;
  favorite_sectors?: string[];
}

export function computeInvestorScore(data: OnboardingScoreInput): {
  investor_score: number;
  score_breakdown: ScoreBreakdown;
} {
  // Pilier 1 — Engagement : quiz_score normalisé sur 25 pts
  // quiz_score est la somme des réponses BRVM (3 questions × max 4 = 12)
  const rawQuiz = data.quiz_score ?? 0;
  const engagement = Math.round(Math.min((rawQuiz / 12) * 25, 25));

  // Pilier 2 — Cohérence risque / horizon / objectif (20 pts)
  const risque_horizon = scoreRisqueHorizon(
    data.risk_profile,
    data.investment_horizon,
    data.life_goal
  );

  // Pilier 3 — Régularité budgétaire (15 pts)
  const budget = data.monthly_budget ?? data.monthly_investment ?? 0;
  const regularite =
    budget <= 0
      ? 0
      : Math.min(Math.round(Math.log10(budget + 1) * 5), 15);

  // Pilier 4 — Diversification sectorielle (15 pts)
  const nbSectors = (data.favorite_sectors ?? []).length;
  const diversification =
    nbSectors === 0
      ? 0
      : nbSectors <= 2
      ? 7
      : nbSectors <= 4
      ? 15
      : 10; // trop concentré ou trop dispersé

  // Pilier 5 — Contexte BRVM (25 pts)
  const contexte_brvm = scoreBRVMContext(data.life_goal, data.income_source);

  const total = Math.min(
    engagement + risque_horizon + regularite + diversification + contexte_brvm,
    100
  );

  return {
    investor_score: total,
    score_breakdown: {
      engagement,
      risque_horizon,
      regularite,
      diversification,
      contexte_brvm,
      total,
    },
  };
}

function scoreRisqueHorizon(
  risk?: string,
  horizon?: string,
  goal?: string
): number {
  const coherenceMap: Record<string, string[]> = {
    CONSERVATIVE: ['SHORT_TERM', 'MEDIUM_TERM'],
    MODERATE:     ['MEDIUM_TERM', 'LONG_TERM'],
    BALANCED:     ['MEDIUM_TERM', 'LONG_TERM'],
    GROWTH:       ['LONG_TERM', 'VERY_LONG_TERM'],
    AGGRESSIVE:   ['LONG_TERM', 'VERY_LONG_TERM'],
  };

  const isCoherent =
    risk && horizon && (coherenceMap[risk] ?? []).includes(horizon);
  const base = isCoherent ? 20 : 10;

  // Bonus objectif long terme aligné
  const longTermGoals = ['education', 'retraite'];
  const goalBonus =
    goal && longTermGoals.includes(goal) && horizon === 'LONG_TERM' ? 0 : 0;
  // Réservé pour Phase 2 comportemental

  return Math.min(base + goalBonus, 20);
}

function scoreBRVMContext(goal?: string, income?: string): number {
  let score = 10; // base : utilisateur a répondu à des questions BRVM
  if (goal) score += 8;   // objectif de vie renseigné
  if (income) score += 7; // source de revenus renseignée
  return Math.min(score, 25);
}
