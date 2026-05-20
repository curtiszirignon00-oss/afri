import { useState, useRef, useCallback } from 'react';
import { authFetch, API_BASE_URL } from '../config/api';

export type PaymentStatus = 'idle' | 'initiating' | 'pending' | 'completed' | 'failed';

export interface PaymentParams {
  planId: string;
  planName: string;
  amount: string;       // ex: "9900"
  currency: string;     // "XOF"
  correspondent: string; // "WAVE_CI", "ORANGE_MONEY_CI", etc.
  phone: string;        // MSISDN sans "+" ex: "2250700000000"
}

interface UsePawaPaymentReturn {
  status: PaymentStatus;
  depositId: string | null;
  errorMessage: string | null;
  initiate: (params: PaymentParams) => Promise<void>;
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
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('failed');
        const rejCode = data.reason?.rejectionCode ?? data.reason?.failureCode ?? '';
        const detail = rejCode ? ` [${rejCode}]` : '';
        setErrorMessage((data.error ?? 'Erreur lors de l\'initiation du paiement.') + detail);
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

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setDepositId(null);
    setErrorMessage(null);
  }, [stopPolling]);

  return { status, depositId, errorMessage, initiate, reset };
}

// ─── Mapping opérateur + indicatif pays → correspondent PawaPay ───────────────

export const PAWAPAY_CORRESPONDENTS: Record<string, Record<string, string>> = {
  'orange-money': {
    '+225': 'ORANGE_MONEY_CI',
    '+221': 'ORANGE_MONEY_SN',
    '+226': 'ORANGE_MONEY_BF',
    '+223': 'ORANGE_MONEY_ML',
    '+224': 'ORANGE_MONEY_GN',
    '+237': 'ORANGE_MONEY_CM',
  },
  'mtn-momo': {
    '+225': 'MTN_MOMO_CI',
    '+229': 'MTN_MOMO_BJ',
    '+233': 'MTN_MOMO_GH',
  },
  'moov-money': {
    '+226': 'MOOV_MONEY_BF',
    '+228': 'MOOV_MONEY_TG',
    '+229': 'MOOV_MONEY_BJ',
  },
  'free-money': {
    '+221': 'FREE_MONEY_SN',
  },
};

export function getCorrespondent(operator: string, dialCode: string): string | null {
  return PAWAPAY_CORRESPONDENTS[operator]?.[dialCode] ?? null;
}

/** Retourne les pays disponibles pour un opérateur donné */
export function getAvailableCountries(operator: string): string[] {
  return Object.keys(PAWAPAY_CORRESPONDENTS[operator] ?? {});
}
