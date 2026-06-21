import { log } from '../config/logger';

const PAWAPAY_API_URL = process.env.PAWAPAY_API_URL ?? 'https://api.pawapay.io';
const PAWAPAY_API_TOKEN = process.env.PAWAPAY_API_TOKEN ?? '';

export interface PawaPayDepositRequest {
  depositId: string;      // UUID v4 unique généré côté AfriBourse
  amount: string;         // Ex: "9900"
  currency: string;       // "XOF"
  correspondent: string;  // "ORANGE_MONEY_BF", "MTN_MOMO_BJ", etc.
  phone: string;          // MSISDN sans "+", ex: "22670000000"
  description: string;    // Ex: "AfriBourse Investisseur+"
}

export interface PawaPayRefundRequest {
  refundId: string;   // UUID v4 unique généré côté AfriBourse
  depositId: string;  // UUID du dépôt original
  amount: string;
  description?: string;
}

export interface PawaPayDepositResponse {
  depositId: string;
  status: 'ACCEPTED' | 'REJECTED' | string;
  created: string;
  rejectionReason?: { rejectionCode: string; rejectionMessage: string };
}

export interface PawaPayRefundResponse {
  refundId: string;
  status: 'ACCEPTED' | 'REJECTED' | string;
  created: string;
  rejectionReason?: { rejectionCode: string; rejectionMessage: string };
}

export interface PawaPayDepositCallback {
  depositId: string;
  status: 'COMPLETED' | 'FAILED' | string;
  requestedAmount: string;
  depositedAmount?: string;
  currency: string;
  correspondent: string;
  payer: { type: string; address: { value: string } };
  customerTimestamp: string;
  created: string;
  depositedTimestamp?: string;
  respondedTimestamp?: string;
  failureReason?: { failureCode: string; failureMessage: string };
  metadata?: Record<string, string>[];
}

export interface PawaPayRefundCallback {
  refundId: string;
  depositId: string;
  status: 'COMPLETED' | 'FAILED' | string;
  amount: string;
  currency: string;
  created: string;
  respondedTimestamp?: string;
  failureReason?: { failureCode: string; failureMessage: string };
}

/**
 * Initie un dépôt Mobile Money via l'API PawaPay.
 * Auth : Bearer token uniquement (clé privée optionnelle — non activée).
 */
export async function initiateDeposit(
  params: PawaPayDepositRequest,
): Promise<PawaPayDepositResponse> {
  const body = JSON.stringify({
    depositId: params.depositId,
    amount: params.amount,
    currency: params.currency,
    correspondent: params.correspondent,
    payer: {
      type: 'MSISDN',
      address: { value: params.phone },
    },
    customerTimestamp: new Date().toISOString(),
    statementDescription: params.description,
  });

  const response = await fetch(`${PAWAPAY_API_URL}/deposits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAWAPAY_API_TOKEN}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error('[PawaPay] Erreur initiation dépôt', { status: response.status, body: errorText });
    throw new Error(`PawaPay deposit error: ${response.status} — ${errorText}`);
  }

  return response.json() as Promise<PawaPayDepositResponse>;
}

/**
 * Initie un remboursement via l'API PawaPay.
 */
export async function initiateRefund(
  params: PawaPayRefundRequest,
): Promise<PawaPayRefundResponse> {
  const body = JSON.stringify({
    refundId: params.refundId,
    depositId: params.depositId,
    amount: params.amount,
    ...(params.description ? { statementDescription: params.description } : {}),
  });

  const response = await fetch(`${PAWAPAY_API_URL}/refunds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAWAPAY_API_TOKEN}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error('[PawaPay] Erreur initiation remboursement', { status: response.status, body: errorText });
    throw new Error(`PawaPay refund error: ${response.status} — ${errorText}`);
  }

  return response.json() as Promise<PawaPayRefundResponse>;
}

// ─── Payment Page (widget) — utilisé pour Wave (pas dispo en dépôt direct) ─────

export interface PawaPayPaymentPageRequest {
  depositId: string;       // UUID — devient l'ID du dépôt
  returnUrl: string;       // URL de retour après paiement
  amount?: string;         // ex "35000" (string, sans zéro non significatif)
  country?: string;        // ISO 3166-1 alpha-3, ex "CIV"
  reason?: string;         // <= 50 car. — affiché au client
  statementDescription?: string; // 4-22 car. alphanum + espaces
  language?: 'EN' | 'FR';
}

export interface PawaPayPaymentPageResponse {
  redirectUrl: string;
}

/**
 * Crée une session Payment Page PawaPay et renvoie l'URL de redirection.
 * La complétion arrive ensuite via le webhook /deposits classique (même depositId).
 */
export async function initiatePaymentPageSession(
  params: PawaPayPaymentPageRequest,
): Promise<PawaPayPaymentPageResponse> {
  const body = JSON.stringify({
    depositId: params.depositId,
    returnUrl: params.returnUrl,
    ...(params.amount ? { amount: params.amount } : {}),
    ...(params.country ? { country: params.country } : {}),
    ...(params.reason ? { reason: params.reason } : {}),
    ...(params.statementDescription ? { statementDescription: params.statementDescription } : {}),
    language: params.language ?? 'FR',
  });

  const response = await fetch(`${PAWAPAY_API_URL}/v1/widget/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAWAPAY_API_TOKEN}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error('[PawaPay] Erreur création session Payment Page', { status: response.status, body: errorText });
    throw new Error(`PawaPay payment page error: ${response.status} — ${errorText}`);
  }

  return response.json() as Promise<PawaPayPaymentPageResponse>;
}
