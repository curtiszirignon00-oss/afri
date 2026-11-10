// src/pages/FirstTradePage.tsx
// Premier trade simulé guidé — juste après le survey (ou son « Passer »).
// Objectif rétention : vivre l'« aha moment » (devenir actionnaire, même virtuellement)
// dès la première session, puis enchaîner sur le quiz du module 1.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronRight, Loader2, Minus, Plus, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { apiFetch } from '../hooks/useApi';
import type { Stock } from '../types';
import { analytics } from '../services/analytics';
import { useOnboardingGuideContext } from '../context/OnboardingGuideContext';

/** Actions proposées, par ordre de préférence. La première cotée normalement est retenue. */
const CANDIDATES: { symbol: string; reasons: string[] }[] = [
  {
    symbol: 'SNTS',
    reasons: [
      'La plus grosse capitalisation de la BRVM',
      'Un dividende versé chaque année',
      'Une action très échangée : facile à acheter et à revendre',
    ],
  },
  {
    symbol: 'ORAC',
    reasons: [
      "L'une des plus grosses capitalisations de la BRVM",
      'Un opérateur télécom que vous connaissez',
      'Un dividende versé régulièrement',
    ],
  },
  {
    symbol: 'SGBC',
    reasons: [
      'Une grande banque de la place',
      'Un dividende parmi les plus suivis de la cote',
      'Un titre régulièrement échangé',
    ],
  },
];

/** Module 1 de l'Académie — étape suivante du parcours. */
export const FIRST_QUIZ_URL = '/learn?module=fondations-bourse-brvm&quiz=1';

/** Montants « parlants » proposés pour le premier achat. */
const TARGET_AMOUNTS = [25_000, 50_000, 100_000];

interface PortfolioLite {
  cash_balance: number;
  positions?: { stock_ticker: string; quantity: number }[];
}

type Phase = 'loading' | 'choose' | 'buying' | 'done' | 'error';

const fmt = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;

function isTradable(s: Stock | null): s is Stock {
  return !!s && s.is_active !== false && !s.trading_suspended_at && s.current_price > 0;
}

export default function FirstTradePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const onboardingGuide = useOnboardingGuideContext();

  const [phase, setPhase] = useState<Phase>('loading');
  const [stock, setStock] = useState<Stock | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [cash, setCash] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [xpGained, setXpGained] = useState<number>(0);

  // Chargement : portefeuille simulé + première action cotable de la liste
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const portfolio = await apiFetch<PortfolioLite>('/portfolios/my', { params: { wallet_type: 'SANDBOX' } });
        if (cancelled) return;

        // Déjà investi : l'étape est faite, on passe directement au quiz
        if ((portfolio.positions?.length ?? 0) > 0) {
          navigate(FIRST_QUIZ_URL, { replace: true });
          return;
        }
        setCash(portfolio.cash_balance ?? 0);

        for (const c of CANDIDATES) {
          const s = await apiFetch<Stock>(`/stocks/${c.symbol}`).catch(() => null);
          if (isTradable(s)) {
            if (cancelled) return;
            setStock(s);
            setReasons(c.reasons);
            // Quantité par défaut : ~50 000 FCFA, au moins 1 action
            setQuantity(Math.max(1, Math.round(50_000 / s.current_price)));
            setPhase('choose');
            analytics.trackAction('first_trade_viewed', 'Premier trade guidé affiché', { symbol: s.symbol });
            return;
          }
        }
        throw new Error('Aucune action disponible pour le moment.');
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Impossible de préparer votre premier investissement.');
        setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const presets = useMemo(() => {
    if (!stock) return [];
    const qs = TARGET_AMOUNTS.map((a) => Math.max(1, Math.round(a / stock.current_price)));
    return Array.from(new Set(qs));
  }, [stock]);

  const total = stock ? quantity * stock.current_price : 0;
  const maxQty = stock ? Math.max(1, Math.floor(cash / stock.current_price)) : 1;
  const tooExpensive = total > cash;

  async function handleBuy() {
    if (!stock || tooExpensive) return;
    setPhase('buying');
    setError(null);
    try {
      const res = await apiFetch<{ gamification?: { xpGained?: number } }>('/portfolios/my/buy', {
        method: 'POST',
        body: JSON.stringify({
          stockTicker: stock.symbol,
          quantity,
          pricePerShare: stock.current_price,
          wallet_type: 'SANDBOX',
        }),
      });
      setXpGained(res?.gamification?.xpGained ?? 0);
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (onboardingGuide.isActive && !onboardingGuide.steps.achat) onboardingGuide.completeStep('achat');
      analytics.trackAction('first_trade_done', 'Premier trade guidé réalisé', {
        symbol: stock.symbol, quantity, amount: Math.round(total),
      });
      setPhase('done');
    } catch (e: any) {
      setError(e?.message || "L'achat n'a pas pu aboutir. Réessayez.");
      setPhase('choose');
    }
  }

  function skip(to: string, reason: string) {
    analytics.trackAction('first_trade_skipped', 'Premier trade guidé passé', { phase, reason });
    navigate(to);
  }

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  const Stepper = ({ current }: { current: 2 | 3 }) => (
    <ol className="flex items-center justify-center gap-2 text-xs font-medium text-gray-400 mb-6">
      <li className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Profil</li>
      <li className="w-6 h-px bg-gray-300" />
      <li className={current === 2 ? 'text-blue-700 font-semibold' : 'flex items-center gap-1 text-emerald-600'}>
        {current === 3 && <CheckCircle2 className="w-4 h-4 inline mr-1" />}Premier investissement
      </li>
      <li className="w-6 h-px bg-gray-300" />
      <li className={current === 3 ? 'text-blue-700 font-semibold' : ''}>Quiz module 1</li>
    </ol>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Barre du haut */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img src="/images/logo_afribourse.png" alt="AfriBourse" className="w-9 h-9 object-contain" />
          <span className="font-bold text-gray-800">AfriBourse</span>
        </div>
        {phase !== 'done' && (
          <button
            onClick={() => skip('/dashboard', 'header')}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
          >
            Plus tard
          </button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full">

          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm">Préparation de votre portefeuille…</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-700 mb-5">{error}</p>
              <button
                onClick={() => navigate(FIRST_QUIZ_URL)}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Passer au quiz du module 1
              </button>
              <button onClick={() => navigate('/dashboard')} className="mt-3 text-sm text-gray-500 hover:text-gray-700">
                Aller au tableau de bord
              </button>
            </div>
          )}

          {(phase === 'choose' || phase === 'buying') && stock && (
            <>
              <Stepper current={2} />
              <div className="text-center mb-5">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Votre premier investissement</h1>
                <p className="text-sm text-gray-500">
                  Vous disposez de <strong className="text-gray-800">{fmt(cash)}</strong> virtuels.
                  Achetez votre première action — sans risque, aucun argent réel.
                </p>
              </div>

              {/* Action pré-sélectionnée */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  {stock.logo_url
                    ? <img src={stock.logo_url} alt="" className="w-11 h-11 rounded-xl object-contain bg-gray-50" />
                    : <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">{stock.symbol.slice(0, 2)}</div>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{stock.company_name}</p>
                    <p className="text-xs text-gray-500">{stock.symbol} · {stock.sector ?? 'BRVM'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 tabular-nums">{fmt(stock.current_price)}</p>
                    <p className={`text-xs font-semibold tabular-nums inline-flex items-center gap-0.5 ${stock.daily_change_percent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stock.daily_change_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stock.daily_change_percent >= 0 ? '+' : ''}{(stock.daily_change_percent ?? 0).toFixed(2)} %
                    </p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pourquoi cette action pour débuter</p>
                <ul className="space-y-1.5">
                  {reasons.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />{r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quantité */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Combien d'actions ?</p>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Une action de moins"
                  ><Minus className="w-4 h-4" /></button>
                  <span className="text-3xl font-bold text-gray-900 tabular-nums">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Une action de plus"
                  ><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex gap-2 mb-4">
                  {presets.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(Math.min(maxQty, q))}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${quantity === q ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      ≈ {fmt(q * stock.current_price)}
                    </button>
                  ))}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Montant investi</span><span className="font-semibold text-gray-900 tabular-nums">{fmt(total)}</span></div>
                  <div className="flex justify-between text-gray-500"><span>Liquidités restantes</span><span className="tabular-nums">{fmt(Math.max(0, cash - total))}</span></div>
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  Ordre « au marché » : vous achetez au dernier cours connu ({fmt(stock.current_price)} par action).
                </p>
              </div>

              {error && <p className="mb-3 text-sm text-red-600 text-center">{error}</p>}

              <button
                onClick={handleBuy}
                disabled={phase === 'buying' || tooExpensive}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow disabled:opacity-60"
              >
                {phase === 'buying'
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Achat en cours…</>
                  : <>Acheter {quantity} action{quantity > 1 ? 's' : ''} {stock.symbol} <ChevronRight className="w-5 h-5" /></>}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Simulation · aucun argent réel n'est engagé
              </p>
            </>
          )}

          {phase === 'done' && stock && (
            <>
              <Stepper current={3} />
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-7 text-white text-center mb-4 shadow-xl">
                <Sparkles className="w-10 h-10 mx-auto mb-3" />
                <h1 className="text-2xl font-bold mb-2">Vous êtes actionnaire de {stock.company_name} !</h1>
                <p className="text-white/90 text-sm">
                  {quantity} action{quantity > 1 ? 's' : ''} achetée{quantity > 1 ? 's' : ''} pour {fmt(total)} — c'est exactement ainsi que se passe un achat réel sur la BRVM.
                </p>
                {xpGained > 0 && (
                  <p className="mt-4 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">+{xpGained} XP</p>
                )}
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">Étape suivante</p>
                <h2 className="font-semibold text-gray-900 text-lg mb-1">Comprendre ce que vous venez de faire</h2>
                <p className="text-sm text-gray-500 mb-5">Module 1 « Les Fondations » et son quiz — environ 5 minutes.</p>
                <button
                  onClick={() => { analytics.trackAction('first_quiz_cta', 'Vers quiz module 1', { from: 'first_trade' }); navigate(FIRST_QUIZ_URL); }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow"
                >
                  Passer le quiz du module 1 <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/dashboard')} className="mt-3 text-sm text-gray-500 hover:text-gray-700">
                  Voir mon portefeuille
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
