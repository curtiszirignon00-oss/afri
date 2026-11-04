// src/components/PremiumWaitlist.tsx
// L'abonnement Premium (Investisseur+) est indisponible pour le moment : on propose
// de s'inscrire à la liste d'attente. Réutilise SubscriptionIntent (source « waitlist »,
// une seule inscription par utilisateur côté backend) → visible dans les stats admin.
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BellRing, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { authFetch, API_BASE_URL } from '../config/api';
import { toUserMessage } from '../lib/userFacingError';

interface Props {
  /** Fonctionnalité qui a amené l'utilisateur ici (suivi admin) */
  feature?: string;
}

export default function PremiumWaitlist({ feature }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, userProfile } = useAuth();
  const [registered, setRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Déjà inscrit ? (on n'affiche pas d'erreur si la vérification échoue)
  useEffect(() => {
    if (!userProfile?.id) return;
    let cancelled = false;
    authFetch(`${API_BASE_URL}/subscriptions/my-intents`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json?.data?.some((i: { source?: string }) => i.source === 'waitlist')) setRegistered(true);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userProfile?.id]);

  const join = async () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/subscriptions/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'investisseur-plus',
          planName: 'Investisseur+',
          price: '9 900 XOF',
          feature: feature ?? null,
          source: 'waitlist',
        }),
      });
      if (!res.ok) throw Object.assign(new Error(), { status: res.status });
      setRegistered(true);
      toast.success('Vous êtes inscrit(e) à la liste d’attente !');
    } catch (err) {
      toast.error(toUserMessage(err, 'L’inscription n’a pas pu être enregistrée. Réessayez.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (registered) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-4 text-left">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-green-900 text-sm">Vous êtes sur la liste d’attente</p>
          <p className="text-green-800 text-sm">Nous vous préviendrons dès le retour de l’abonnement Premium.</p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={join}
      disabled={submitting}
      className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-white font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-70"
    >
      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <BellRing className="w-5 h-5" />}
      {isLoggedIn ? 'M’inscrire à la liste d’attente' : 'Me connecter pour m’inscrire'}
    </button>
  );
}
