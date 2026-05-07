import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

export type PlanId = 'investisseur-plus' | 'max';

export interface PlanConfig {
  name: string;
  amountCents: number; // en centimes EUR
  currency: string;
  labelXOF: string;
  tier: string; // valeur stockée dans subscriptionTier
}

// 1 EUR = 655.957 XOF (parité fixe)
export const STRIPE_PLANS: Record<PlanId, PlanConfig> = {
  'investisseur-plus': {
    name: 'Investisseur+',
    amountCents: 1509, // 15.09 EUR ≈ 9 900 XOF
    currency: 'eur',
    labelXOF: '9 900 XOF',
    tier: 'premium',
  },
  max: {
    name: 'Max',
    amountCents: 45735, // 457.35 EUR ≈ 300 000 XOF
    currency: 'eur',
    labelXOF: '300 000 XOF',
    tier: 'max',
  },
};
