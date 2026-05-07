import { Request, Response } from 'express';
import Stripe from 'stripe';
import { stripe, STRIPE_PLANS, PlanId } from '../services/stripe.service';
import { prisma } from '../config/database';
import { log } from '../config/logger';

interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string };
  rawBody?: Buffer;
}

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  const { planId } = req.body;
  const userId = req.user?.id;
  const userEmail = req.user?.email;

  if (!userId || !userEmail) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }

  const plan = STRIPE_PLANS[planId as PlanId];
  if (!plan) {
    return res.status(400).json({ success: false, message: 'Plan invalide' });
  }

  try {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `AfriBourse ${plan.name}`,
              description: `Abonnement mensuel ${plan.name} — ${plan.labelXOF}/mois`,
            },
            unit_amount: plan.amountCents,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: { userId, planId, tier: plan.tier },
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancel`,
    });

    log.info(`💳 Session Stripe créée: ${session.id} — user ${userId} → ${planId}`);
    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    log.error({ error }, 'Erreur création session Stripe');
    return res.status(500).json({ success: false, message: 'Erreur Stripe' });
  }
};

export const handleWebhook = async (req: AuthRequest, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    log.error('STRIPE_WEBHOOK_SECRET non configuré');
    return res.status(500).json({ error: 'Configuration manquante' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody ?? req.body, sig, webhookSecret);
  } catch (err) {
    log.warn({ err }, 'Stripe webhook: signature invalide');
    return res.status(400).json({ error: 'Signature invalide' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, planId, tier } = session.metadata ?? {};

    if (!userId || !tier) {
      log.warn('Webhook checkout.session.completed: metadata manquante');
      return res.json({ received: true });
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: tier },
      });
      log.info(`✅ Abonnement activé: user ${userId} → ${tier} (${planId})`);
    } catch (err) {
      log.error({ err }, 'Erreur mise à jour subscriptionTier');
      return res.status(500).json({ error: 'Erreur DB' });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    // On cherche l'utilisateur via l'email du customer Stripe
    try {
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      if (customer.email) {
        await prisma.user.update({
          where: { email: customer.email },
          data: { subscriptionTier: 'free' },
        });
        log.info(`🔄 Abonnement annulé: ${customer.email} → free`);
      }
    } catch (err) {
      log.error({ err }, 'Erreur désactivation abonnement');
    }
  }

  return res.json({ received: true });
};
