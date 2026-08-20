// src/pages/CohortCheckoutPage.tsx
//
// Choix de la formule puis paiement, sur une seule page : les trois packs en
// cartes comparables en haut, puis le moyen de paiement a gauche et le
// recapitulatif chiffre a droite. La charte reste celle du site : navy pour la
// selection, orange pour l'action de paiement, vert et rouge pour les etats.
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Check, CheckCircle, Loader2, AlertCircle, ArrowLeft, Flame, Smartphone, ShieldCheck } from 'lucide-react';
import { applyPromo, promoPercent } from '../utils/promo';
import { usePromoCountdown } from '../hooks/usePromoCountdown';
import { API_BASE_URL, authFetch } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePawaPayment, getCorrespondent, getAvailableCountries, getCurrency } from '../hooks/usePawaPayment';
import { analytics } from '../services/analytics';

const PACK_ID = 'pack-parcours-investisseur';

// Packs (good-better-best) — comptant, plein tarif
// +2 sessions et +6h par palier (Starter 5/15h · Parcours 7/21h · Investisseur 9/27h)
const PACK_TIERS: Record<string, { name: string; full: number; sessions: number; hours: number; popular?: boolean; perks: string[] }> = {
  starter: {
    name: 'Pack Starter', full: 70000, sessions: 5, hours: 15,
    perks: [
      '5 webinaires live (W1 → W5)',
      "5 plans d'action personnalisés",
      'Deal Flow hebdo + Communauté (3 mois)',
      'Replays à vie + Certificat BRVM Niveau 1',
      'Ouverture compte SGI : guide écrit',
    ],
  },
  parcours: {
    name: 'Pack Parcours', full: 100000, sessions: 7, hours: 21, popular: true,
    perks: [
      'Tout le Starter, plus :',
      'W6 : Constitution de portefeuille',
      'W7 : Gestion du risque',
      'Revue de portefeuille perso + Q&A live mensuelle',
      'Ouverture SGI : session collective live',
    ],
  },
  investisseur: {
    name: 'Pack Investisseur', full: 150000, sessions: 9, hours: 27,
    perks: [
      'Tout le Parcours, plus :',
      "W8 : Psychologie de l'investisseur",
      'W9 : IA et Finance',
      'Appel 1:1 de 30 min avec votre coach',
      'Investment Policy Statement + accès à vie',
      'Ouverture SGI : accompagnement main dans la main',
    ],
  },
};
function resolveTier(p: string | null): string {
  return p && PACK_TIERS[p] ? p : 'starter';
}

// Coordonnées mémorisées lors de la pré-inscription (évite la ressaisie)
function readLead(): { name?: string; email?: string; dialCode?: string; phone?: string } | null {
  try { return JSON.parse(localStorage.getItem('afb_cohort_lead') || 'null'); } catch { return null; }
}

const WHATSAPP_DIAL_CODES = [
  { code: '+225', name: "Côte d'Ivoire" }, { code: '+221', name: 'Sénégal' }, { code: '+226', name: 'Burkina Faso' },
  { code: '+223', name: 'Mali' }, { code: '+228', name: 'Togo' }, { code: '+229', name: 'Bénin' },
  { code: '+227', name: 'Niger' }, { code: '+237', name: 'Cameroun' }, { code: '+233', name: 'Ghana' },
  { code: '+234', name: 'Nigeria' }, { code: '+241', name: 'Gabon' }, { code: '+33', name: 'France' },
];

const PAYMENT_DIAL_CODES = [
  { code: '+225', name: "Côte d'Ivoire" },
  { code: '+221', name: 'Sénégal' },
  { code: '+226', name: 'Burkina Faso' },
  { code: '+223', name: 'Mali' },
  { code: '+229', name: 'Bénin' },
  { code: '+228', name: 'Togo' },
  { code: '+237', name: 'Cameroun' },
  { code: '+233', name: 'Ghana' },
  { code: '+256', name: 'Ouganda' },
  { code: '+250', name: 'Rwanda' },
];

// Pays sans paiement en ligne (Mobile Money non disponible) → contact manuel
const OFFLINE_PAYMENT_CODES = ['+228'];

const MOBILE_OPERATORS = [
  { id: 'wave',         label: 'Wave' },
  { id: 'orange-money', label: 'Orange Money' },
  { id: 'mtn-momo',     label: 'MTN MoMo' },
  { id: 'moov-money',   label: 'Moov Money' },
  { id: 'free-money',   label: 'Free Money' },
];

function formatPrice(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }

const FIELD_CLASS =
  'w-full h-12 px-4 text-sm bg-white border border-gray-200 rounded-xl ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy ' +
  'placeholder:text-gray-400 transition-colors';

export default function CohortCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();

  const [tier, setTier] = useState(resolveTier(searchParams.get('pack')));
  const tierCfg = PACK_TIERS[tier];
  const PACK_NAME = tierCfg.name;
  const promo = usePromoCountdown();
  const price = applyPromo(tier, tierCfg.full);
  const pct = promoPercent(tier);
  const discount = tierCfg.full - price;

  const lead = readLead();
  const initName = lead?.name || (userProfile as any)?.profile?.full_name || (userProfile as any)?.profile?.username || '';
  const initEmail = lead?.email || (userProfile as any)?.email || '';
  const initDial = lead?.dialCode || '+225';
  const initPhone = lead?.phone || '';
  // On a déjà toutes les infos → on saute l'étape 1 (contact) et on va direct au paiement
  const infoComplete = !!(initName.trim() && initEmail.trim() && initPhone.trim());

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: initName, email: initEmail });
  const [waDialCode, setWaDialCode] = useState(initDial);
  const [waPhone, setWaPhone] = useState(initPhone);
  const [step, setStep] = useState<'form' | 'payment'>(infoComplete ? 'payment' : 'form');
  const [payOperator, setPayOperator] = useState<string | null>(null);
  const [payDialCode, setPayDialCode] = useState(PAYMENT_DIAL_CODES.some((c) => c.code === initDial) ? initDial : '+225');
  const [payPhone, setPayPhone] = useState(PAYMENT_DIAL_CODES.some((c) => c.code === initDial) ? initPhone : '');

  const { status: payStatus, errorMessage: payError, initiate, reset } = usePawaPayment(() => {
    analytics.trackAction('cohort_payment_success', PACK_NAME, { amount: price });
  });

  // Enregistre le lead (pré-inscription pack) — le webhook la marquera payée + accès
  const registerLead = async () => {
    try {
      await authFetch(`${API_BASE_URL}/webinars/preregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: PACK_ID,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: `${waDialCode} ${waPhone.trim()}`,
          type: 'pack',
          pack: tier,
        }),
      });
      try { localStorage.setItem('afb_cohort_lead', JSON.stringify({ name: form.name.trim(), email: form.email.trim(), dialCode: waDialCode, phone: waPhone.trim() })); } catch { /* ignore */ }
    } catch { /* non bloquant */ }
  };

  // Si on a déjà les infos → on enregistre le lead une fois au montage (l'étape 1 est sautée)
  const autoRegistered = useRef(false);
  useEffect(() => {
    if (infoComplete && !autoRegistered.current) {
      autoRegistered.current = true;
      registerLead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Renseignez votre nom et votre email'); return; }
    if (!waPhone.trim()) { toast.error('Votre numéro WhatsApp est requis'); return; }
    setLoading(true);
    try {
      await registerLead();
      if (PAYMENT_DIAL_CODES.some((c) => c.code === waDialCode)) {
        setPayDialCode(waDialCode);
        setPayPhone(waPhone);
      }
      setStep('payment');
    } catch {
      toast.error("Erreur lors de l'enregistrement. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    if (!payOperator) return;
    const correspondent = getCorrespondent(payOperator, payDialCode);
    if (!correspondent) { toast.error('Opérateur non disponible dans ce pays'); return; }
    // Wave : numéro saisi sur la page hébergée Wave → pas de msisdn requis ici
    const isWave = payOperator === 'wave';
    const msisdn = isWave ? '' : payDialCode.replace('+', '') + payPhone.replace(/\D/g, '');
    analytics.trackAction('cohort_payment_initiated', PACK_NAME, { amount: price, operator: payOperator });
    initiate({
      planId: PACK_ID,
      planName: PACK_NAME,
      amount: String(price),
      currency: getCurrency(payDialCode),
      correspondent,
      phone: msisdn,
      registrationEmail: form.email.trim(),
      registrationName: form.name.trim(),
      pack: tier,
    });
  };

  // ── Succès ──
  if (payStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé</h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Votre place au Parcours Investisseur (cohorte août) est confirmée. Vous recevrez tous les détails
            par email et sur WhatsApp.
          </p>
          <button
            onClick={() => navigate('/webinaires')}
            className="w-full h-12 rounded-xl font-semibold text-white bg-brand-navy hover:bg-brand-navy-hover transition-colors"
          >
            Retour aux webinaires
          </button>
        </div>
      </div>
    );
  }

  const operators = MOBILE_OPERATORS.filter((op) => getAvailableCountries(op.id).includes(payDialCode));
  const offline = OFFLINE_PAYMENT_CODES.includes(payDialCode);
  const canPay = !!payOperator && (payOperator === 'wave' || !!payPhone.trim()) && payStatus !== 'initiating';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/webinaires')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">

          {/* Titre */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Choisissez votre formule</h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Cohorte Août 2026 · sans engagement · paiement en FCFA
            </p>
          </div>

          {/* Compte a rebours de l'offre */}
          {promo.active && pct > 0 && (
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-xl bg-brand-orange/10 text-brand-orange-dark text-sm font-semibold">
              <Flame className="w-4 h-4 shrink-0" />
              Offre -{pct}% : se termine dans <span className="font-mono">{promo.label}</span>
            </div>
          )}

          {/* Les trois formules */}
          <div className="grid md:grid-cols-3 gap-5">
            {(Object.keys(PACK_TIERS) as Array<keyof typeof PACK_TIERS>).map((k) => {
              const c = PACK_TIERS[k];
              const active = tier === k;
              const tierPrice = applyPromo(k as string, c.full);
              const tierPct = promoPercent(k as string);

              return (
                <div
                  key={k}
                  className={`relative flex flex-col rounded-2xl p-5 transition-all ${
                    active
                      ? 'border-2 border-brand-navy shadow-md'
                      : 'border border-gray-200 hover:border-brand-navy/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="font-bold text-gray-900">{c.name.replace('Pack ', '')}</h2>
                    {c.popular && (
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange-dark border border-brand-orange/30 shrink-0">
                        populaire
                      </span>
                    )}
                  </div>

                  <p className="text-2xl font-extrabold text-gray-900 font-mono tabular-nums leading-none">
                    {tierPrice.toLocaleString('fr-FR')}
                    <span className="text-sm font-semibold text-gray-400 ml-1.5">FCFA</span>
                  </p>
                  {promo.active && tierPct > 0 && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      <span className="line-through font-mono">{c.full.toLocaleString('fr-FR')}</span>
                      <span className="ml-2 font-semibold text-green-600">-{tierPct}%</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {c.sessions} sessions live · {c.hours}h de formation
                  </p>

                  <ul className="mt-4 space-y-2 flex-1">
                    {c.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                        <Check className="w-3.5 h-3.5 text-brand-navy shrink-0 mt-0.5" />
                        <span className={perk.endsWith('plus :') ? 'font-semibold text-gray-900' : ''}>{perk}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => setTier(k as string)}
                    disabled={active}
                    className={`mt-6 w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-brand-navy text-white cursor-default'
                        : 'border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white'
                    }`}
                  >
                    {active ? (<><Check className="w-4 h-4" /> Formule choisie</>) : 'Choisir'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-gray-300 mt-8 sm:mt-10 mb-8 sm:mb-10" />

          {/* Paiement + recapitulatif */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">

            {/* ── Colonne gauche ── */}
            <div>
              <h2 className="font-bold text-gray-900 mb-4">
                {step === 'form' ? 'Vos coordonnées' : 'Paiement'}
              </h2>

              {/* Etape 1 : coordonnees (seulement si elles manquent) */}
              {step === 'form' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nom complet *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className={FIELD_CLASS}
                      placeholder="Ex : Kofi Mensah"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={FIELD_CLASS}
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Numéro WhatsApp *</label>
                    <div className="flex items-stretch h-12 border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-brand-navy/30 focus-within:border-brand-navy transition-colors">
                      <select
                        value={waDialCode}
                        onChange={e => setWaDialCode(e.target.value)}
                        className="bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-600 pl-3 pr-2 focus:outline-none cursor-pointer"
                      >
                        {WHATSAPP_DIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                      </select>
                      <input
                        type="tel"
                        value={waPhone}
                        onChange={e => setWaPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                        placeholder="07 00 00 00 00"
                        className="flex-1 px-3 text-sm focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Etape 2 : moyen de paiement */}
              {step === 'payment' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pays</label>
                    <select
                      value={payDialCode}
                      onChange={e => { setPayDialCode(e.target.value); setPayOperator(null); }}
                      className={`${FIELD_CLASS} cursor-pointer`}
                    >
                      {PAYMENT_DIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                    </select>
                  </div>

                  {offline ? (
                    <div className="bg-white border-2 border-brand-orange rounded-xl p-4">
                      <p className="font-bold text-gray-900 text-sm mb-1">Paiement en ligne non disponible au Togo</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Vos coordonnées sont bien enregistrées. Notre équipe vous contacte très vite sur WhatsApp
                        avec les informations pour régler votre place.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Operateurs, en pastilles a cocher */}
                      {operators.length === 0 ? (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          Aucun opérateur Mobile Money disponible pour ce pays.
                        </p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                          {operators.map(op => {
                            const selected = payOperator === op.id;
                            return (
                              <button
                                key={op.id}
                                type="button"
                                onClick={() => setPayOperator(op.id)}
                                className={`flex items-center gap-3 h-12 px-4 rounded-xl text-sm font-semibold text-left transition-colors ${
                                  selected
                                    ? 'border-2 border-brand-navy bg-ink-50 text-brand-navy'
                                    : 'border border-gray-200 text-gray-600 hover:border-brand-navy/40'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  selected ? 'border-brand-navy' : 'border-gray-300'
                                }`}>
                                  {selected && <span className="w-2 h-2 rounded-full bg-brand-navy" />}
                                </span>
                                {op.label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {payOperator === 'wave' ? (
                        <div className="bg-ink-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed">
                          Vous allez être redirigé vers <strong className="text-gray-900">Wave</strong> pour finaliser
                          le paiement en toute sécurité. Aucun numéro à saisir ici.
                        </div>
                      ) : (
                        <div className="flex items-stretch h-12 border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-brand-navy/30 focus-within:border-brand-navy transition-colors">
                          <span className="bg-gray-50 border-r border-gray-200 px-3 text-sm font-medium text-gray-600 flex items-center font-mono">
                            {payDialCode}
                          </span>
                          <input
                            type="tel"
                            value={payPhone}
                            onChange={e => setPayPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                            placeholder="numéro mobile money"
                            className="flex-1 px-3 text-sm focus:outline-none bg-white"
                          />
                        </div>
                      )}

                      <div className="flex items-start gap-2.5 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-500">
                        <Smartphone className="w-4 h-4 text-brand-navy shrink-0 mt-0.5" />
                        Vous recevrez une demande de confirmation sur votre téléphone.
                      </div>

                      {payError && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{payError}</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Colonne droite : recapitulatif ── */}
            <div className="bg-ink-50 rounded-2xl border border-ink-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Récapitulatif</h2>

              <dl className="text-sm">
                <div className="flex items-baseline justify-between gap-4 pb-3">
                  <dt className="text-gray-600">{tierCfg.name} · comptant</dt>
                  <dd className="font-mono tabular-nums text-gray-900 shrink-0">
                    {tierCfg.full.toLocaleString('fr-FR')}
                  </dd>
                </div>

                {promo.active && pct > 0 && (
                  <div className="flex items-baseline justify-between gap-4 pb-3">
                    <dt className="text-green-600 font-semibold">Offre de lancement -{pct}%</dt>
                    <dd className="font-mono tabular-nums text-green-600 font-semibold shrink-0">
                      −{discount.toLocaleString('fr-FR')}
                    </dd>
                  </div>
                )}

                <div className="flex items-baseline justify-between gap-4 pt-3 border-t border-ink-200">
                  <dt className="font-bold text-gray-900">Total</dt>
                  <dd className="font-mono tabular-nums font-bold text-gray-900 text-lg shrink-0">
                    {formatPrice(price)}
                  </dd>
                </div>
              </dl>

              {/* Action principale, selon l'etape et l'etat du paiement */}
              <div className="mt-5">
                {step === 'form' ? (
                  <button
                    onClick={handleContinue}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-white text-sm bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-60 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continuer vers le paiement</>}
                  </button>
                ) : payStatus === 'pending' ? (
                  <div className="text-center py-2 space-y-2">
                    <Loader2 className="w-8 h-8 text-brand-navy animate-spin mx-auto" />
                    <p className="font-bold text-gray-900 text-sm">Vérifiez votre téléphone</p>
                    <p className="text-sm text-gray-600">
                      Entrez votre PIN Mobile Money pour confirmer {formatPrice(price)}
                    </p>
                  </div>
                ) : payStatus === 'failed' ? (
                  <div className="text-center py-2 space-y-2">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <p className="text-red-600 font-semibold text-sm">{payError}</p>
                    <button onClick={reset} className="text-sm font-semibold text-brand-navy hover:underline">
                      Réessayer
                    </button>
                  </div>
                ) : offline ? (
                  <p className="text-sm text-gray-500 text-center">
                    Notre équipe vous contacte sur WhatsApp pour finaliser.
                  </p>
                ) : (
                  <button
                    onClick={handlePay}
                    disabled={!canPay}
                    className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-white text-sm bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {payStatus === 'initiating'
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</>
                      : payOperator === 'wave'
                        ? `Payer avec Wave · ${formatPrice(price)}`
                        : `Payer ${formatPrice(price)}`}
                  </button>
                )}
              </div>

              <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mt-3">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-navy shrink-0" />
                Paiement sécurisé · annulable à tout moment
              </p>

              {/* Liens secondaires */}
              {payStatus === 'idle' && !offline && (
                <div className="mt-4 pt-4 border-t border-ink-200 space-y-2 text-center">
                  {!promo.active && (
                    <button
                      onClick={() => navigate(`/parcours/paiement-3-fois?pack=${tier}`)}
                      className="block w-full text-sm font-semibold text-brand-navy hover:underline"
                    >
                      Ou payer en 3 fois <span className="text-gray-400 font-normal">(léger surcoût)</span>
                    </button>
                  )}
                  {step === 'payment' && (
                    <button
                      onClick={() => setStep('form')}
                      className="block w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Modifier mes coordonnées
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
