import { useState, useRef, useCallback } from 'react';
import { authFetch, API_BASE_URL } from '../config/api';

export type PaymentStatus = 'idle' | 'initiating' | 'pending' | 'completed' | 'failed';

export interface PaymentParams {
  planId: string;
  planName: string;
  amount: string;       // ex: "9900"
  currency: string;     // "XOF"
  correspondent: string; // "WAVE_CIV", "ORANGE_CIV", etc.
  phone: string;        // MSISDN sans "+" ex: "2250700000000"
  registrationEmail?: string; // email pour lier paiement ↔ inscription webinaire
  referralCode?: string;      // code ambassadeur Pack Parcours (parrainage)
}

interface UsePawaPaymentReturn {
  status: PaymentStatus;
  depositId: string | null;
  errorMessage: string | null;
  initiate: (params: PaymentParams) => Promise<void>;
  /** Attache le hook à un dépôt déjà initié ailleurs (ex: paiement échelonné) et démarre le polling. */
  track: (depositId: string) => void;
  reset: () => void;
}

export function usePawaPayment(onSuccess?: () => void): UsePawaPaymentReturn {
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [depositId, setDepositId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback((id: string) => {
    let attempts = 0;
    const MAX_ATTEMPTS = 48; // 4 minutes max (48 × 5s)

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await authFetch(`${API_BASE_URL}/pawapay/deposit/${id}/status`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'COMPLETED') {
          stopPolling();
          setStatus('completed');
          onSuccess?.();
        } else if (data.status === 'FAILED') {
          stopPolling();
          setStatus('failed');
          setErrorMessage('Le paiement a échoué. Vérifiez votre solde et réessayez.');
        } else if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          setStatus('failed');
          setErrorMessage('Délai dépassé. Vérifiez votre téléphone et réessayez.');
        }
      } catch {
        // erreur réseau — on continue à poller
      }
    }, 5000);
  }, [stopPolling, onSuccess]);

  const initiate = useCallback(async (params: PaymentParams) => {
    setStatus('initiating');
    setErrorMessage(null);

    try {
      const res = await authFetch(`${API_BASE_URL}/pawapay/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: params.planId,
          planName: params.planName,
          amount: params.amount,
          currency: params.currency,
          correspondent: params.correspondent,
          phone: params.phone,
          ...(params.registrationEmail ? { registrationEmail: params.registrationEmail } : {}),
          ...(params.referralCode ? { referralCode: params.referralCode } : {}),
          returnUrl: `${window.location.origin}/paiement/retour`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('failed');
        const rejCode = data.reason?.rejectionCode ?? data.reason?.failureCode ?? '';
        const detail = rejCode ? ` [${rejCode}]` : '';
        setErrorMessage((data.error ?? 'Erreur lors de l\'initiation du paiement.') + detail);
        return;
      }

      // Wave (Payment Page) → redirection vers la page de paiement hébergée
      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }

      if (data.status === 'REJECTED') {
        setStatus('failed');
        setErrorMessage('Paiement refusé par l\'opérateur. Vérifiez votre numéro et votre solde.');
        return;
      }

      setDepositId(data.depositId);
      setStatus('pending');
      pollStatus(data.depositId);
    } catch {
      setStatus('failed');
      setErrorMessage('Impossible de contacter le serveur. Vérifiez votre connexion.');
    }
  }, [pollStatus]);

  const track = useCallback((id: string) => {
    setErrorMessage(null);
    setDepositId(id);
    setStatus('pending');
    pollStatus(id);
  }, [pollStatus]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setDepositId(null);
    setErrorMessage(null);
  }, [stopPolling]);

  return { status, depositId, errorMessage, initiate, track, reset };
}

// ─── Mapping opérateur + indicatif pays → correspondent PawaPay ───────────────

export const PAWAPAY_CORRESPONDENTS: Record<string, Record<string, string>> = {
  'orange-money': {
    '+225': 'ORANGE_CIV',
    '+221': 'ORANGE_SEN',
    '+226': 'ORANGE_BFA',
    '+223': 'ORANGE_MLI',
    '+233': 'ORANGE_SLE', // Sierra Leone (code partagé)
  },
  'mtn-momo': {
    '+225': 'MTN_MOMO_CIV',
    '+229': 'MTN_MOMO_BEN',
    '+233': 'MTN_MOMO_GHA',
    '+237': 'MTN_MOMO_CMR',
    '+256': 'MTN_MOMO_UGA',
    '+250': 'MTN_MOMO_RWA',
  },
  'moov-money': {
    '+225': 'MOOV_CIV',
    '+226': 'MOOV_BFA',
    '+229': 'MOOV_BEN',
  },
  'free-money': {
    '+221': 'AFITECH_FREE_SEN',
  },
  'wave': {
    '+225': 'WAVE_CIV',
  },
};

export const COUNTRY_CURRENCY: Record<string, string> = {
  '+225': 'XOF', // Côte d'Ivoire
  '+221': 'XOF', // Sénégal
  '+226': 'XOF', // Burkina Faso
  '+223': 'XOF', // Mali
  '+228': 'XOF', // Togo
  '+229': 'XOF', // Bénin
  '+237': 'XAF', // Cameroun
  '+233': 'GHS', // Ghana
  '+256': 'UGX', // Ouganda
  '+250': 'RWF', // Rwanda
};

export function getCurrency(dialCode: string): string {
  return COUNTRY_CURRENCY[dialCode] ?? 'XOF';
}

export function getCorrespondent(operator: string, dialCode: string): string | null {
  return PAWAPAY_CORRESPONDENTS[operator]?.[dialCode] ?? null;
}

/** Retourne les pays disponibles pour un opérateur donné */
export function getAvailableCountries(operator: string): string[] {
  return Object.keys(PAWAPAY_CORRESPONDENTS[operator] ?? {});
}
