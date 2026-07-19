import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle, Loader2, AlertCircle, ArrowLeft, MapPin } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePawaPayment, getCorrespondent, getAvailableCountries, getCurrency } from '../hooks/usePawaPayment';
import { analytics } from '../services/analytics';

const PACK_ID = 'pack-parcours-investisseur';

// Packs (good-better-best) — comptant, plein tarif
// +2 sessions et +6h par palier (Starter 5/15h · Parcours 7/21h · Investisseur 9/27h)
const PACK_TIERS: Record<string, { name: string; full: number; sessions: number; hours: number; perks: string[] }> = {
  starter: {
    name: 'Pack Starter', full: 70000, sessions: 5, hours: 15,
    perks: [
      '5 webinaires live (W1 → W5)',
      "5 plans d'action personnalisés",
      'Deal Flow hebdo + Communauté (3 mois)',
      'Replays à vie + Certificat BRVM Niveau 1',
      'Ouverture compte SGI — guide écrit',
    ],
  },
  parcours: {
    name: 'Pack Parcours', full: 100000, sessions: 7, hours: 21,
    perks: [
      'Tout le Starter, plus :',
      'W6 — Constitution de portefeuille',
      'W7 — Gestion du risque',
      'Revue de portefeuille perso + Q&A live mensuelle',
      'Ouverture SGI — session collective live',
    ],
  },
  investisseur: {
    name: 'Pack Investisseur', full: 150000, sessions: 9, hours: 27,
    perks: [
      'Tout le Parcours, plus :',
      "W8 — Psychologie de l'investisseur",
      'Appel 1:1 de 30 min avec Curtis',
      'Investment Policy Statement + accès à vie',
      'Ouverture SGI — accompagnement main dans la main',
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
  { code: '+225', flag: '🇨🇮' }, { code: '+221', flag: '🇸🇳' }, { code: '+226', flag: '🇧🇫' },
  { code: '+223', flag: '🇲🇱' }, { code: '+228', flag: '🇹🇬' }, { code: '+229', flag: '🇧🇯' },
  { code: '+227', flag: '🇳🇪' }, { code: '+237', flag: '🇨🇲' }, { code: '+233', flag: '🇬🇭' },
  { code: '+234', flag: '🇳🇬' }, { code: '+241', flag: '🇬🇦' }, { code: '+33', flag: '🇫🇷' },
];

const PAYMENT_DIAL_CODES = [
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+256', flag: '🇺🇬', name: 'Ouganda' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
];

// Pays sans paiement en ligne (Mobile Money non disponible) → contact manuel
const OFFLINE_PAYMENT_CODES = ['+228'];

const MOBILE_OPERATORS = [
  { id: 'wave',         label: 'Wave',         emoji: '🌊' },
  { id: 'orange-money', label: 'Orange Money', emoji: '🟠' },
  { id: 'mtn-momo',     label: 'MTN MoMo',     emoji: '🟡' },
  { id: 'moov-money',   label: 'Moov Money',   emoji: '🔵' },
  { id: 'free-money',   label: 'Free Money',   emoji: '🟢' },
];

function formatPrice(n: number) { return n.toLocaleString('fr-FR') + ' XOF'; }

export default function CohortCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();

  const [tier, setTier] = useState(resolveTier(searchParams.get('pack')));
  const tierCfg = PACK_TIERS[tier];
  const PACK_NAME = tierCfg.name;
  const price = tierCfg.full;

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
      pack: tier,
    });
  };

  // ── Succès ──
  if (payStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé 🎉</h1>
          <p className="text-sm text-gray-600 mb-5">
            Votre place au Parcours Investisseur (cohorte août) est confirmée. Vous recevrez tous les détails par email et WhatsApp.
          </p>
          <button onClick={() => navigate('/webinaires')} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            Retour aux webinaires
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate('/webinaires')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 py-6 text-white">
            <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">Cohorte Août 2026</p>
            <h1 className="text-2xl font-extrabold leading-snug">{PACK_NAME}</h1>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold">{formatPrice(price)}</span>
            </div>
            <p className="text-blue-200 text-xs mt-1">{tierCfg.sessions} sessions live · {tierCfg.hours}h de formation</p>
          </div>

          {/* Pack + résumé — toujours visibles (changement de pack possible à tout moment) */}
          <div className="p-6 pb-0 space-y-4">
            {/* Sélecteur de pack */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Votre pack</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PACK_TIERS) as Array<keyof typeof PACK_TIERS>).map((k) => {
                  const c = PACK_TIERS[k];
                  const active = tier === k;
                  return (
                    <button key={k} onClick={() => setTier(k)} type="button"
                      className={`rounded-xl border-2 p-2 text-center transition-all ${active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                      <span className={`block text-xs font-extrabold ${active ? 'text-blue-800' : 'text-gray-700'}`}>{c.name.replace('Pack ', '')}</span>
                      <span className="block text-[11px] font-bold text-gray-900 mt-0.5">{c.full.toLocaleString('fr-FR')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
              <p className="font-semibold">{tierCfg.sessions} sessions live · {tierCfg.hours}h de formation · Communauté · Certificat</p>
              <p className="text-xs mt-0.5">1ère session le samedi 8 août.</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p><strong>Sessions en présentiel</strong> en Côte d'Ivoire 🇨🇮, au Bénin 🇧🇯 et au Sénégal 🇸🇳. <span className="text-emerald-700">En ligne (visio) pour les autres pays.</span></p>
            </div>

            {/* Avantages clés du pack sélectionné */}
            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Inclus dans le {tierCfg.name}</p>
              <ul className="space-y-1.5">
                {tierCfg.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className={perk.endsWith('plus :') ? 'font-bold text-gray-900' : ''}>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Étape 1 — Contact (affichée seulement si on n'a pas déjà les infos) */}
          {step === 'form' && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex : Kofi Mensah" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="votre@email.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro WhatsApp *</label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <select value={waDialCode} onChange={e => setWaDialCode(e.target.value)}
                      className="bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-700 pl-2 pr-1 py-2.5 focus:outline-none cursor-pointer" style={{ minWidth: '85px' }}>
                      {WHATSAPP_DIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                    <input type="tel" value={waPhone} onChange={e => setWaPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                      placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                  </div>
                </div>
              </div>

              <button onClick={handleContinue} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 active:scale-95 disabled:opacity-60 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Continuer vers le paiement</>}
              </button>

              <div className="text-center pt-1">
                <button onClick={() => navigate(`/parcours/paiement-3-fois?pack=${tier}`)} className="text-xs font-semibold text-blue-600 hover:underline">
                  Ou payer en 3 fois
                </button>
              </div>
            </div>
          )}

          {/* Étape paiement */}
          {step === 'payment' && (
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                ✅ Inscription enregistrée · Payez pour confirmer votre place
                <span className="block font-bold mt-0.5">{formatPrice(price)}</span>
              </div>

              {(payStatus === 'idle' || payStatus === 'initiating') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pays</label>
                    <select value={payDialCode} onChange={e => { setPayDialCode(e.target.value); setPayOperator(null); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      {PAYMENT_DIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>)}
                    </select>
                  </div>

                  {OFFLINE_PAYMENT_CODES.includes(payDialCode) ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <p className="font-bold mb-1">🇹🇬 Paiement en ligne non disponible au Togo</p>
                      <p className="text-xs leading-relaxed">Pas d'inquiétude — vos coordonnées sont bien enregistrées. Notre équipe vous contacte très vite sur WhatsApp avec les informations pour régler votre place.</p>
                    </div>
                  ) : (
                  <>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Opérateur Mobile Money</p>
                    {(() => {
                      const ops = MOBILE_OPERATORS.filter(op => getAvailableCountries(op.id).includes(payDialCode));
                      if (ops.length === 0) return <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">Aucun opérateur Mobile Money disponible pour ce pays.</p>;
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          {ops.map(op => (
                            <button key={op.id} onClick={() => setPayOperator(op.id)}
                              className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left cursor-pointer
                                ${payOperator === op.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                              {op.emoji} {op.label}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  {payOperator === 'wave' ? (
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-800 leading-relaxed">
                      🌊 Vous allez être redirigé vers <strong>Wave</strong> pour finaliser le paiement en toute sécurité. Aucun numéro à saisir ici.
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro Mobile Money</label>
                      <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                        <span className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 flex items-center">{payDialCode}</span>
                        <input type="tel" value={payPhone} onChange={e => setPayPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                          placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                      </div>
                    </div>
                  )}

                  {payError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{payError}</p>}

                  <button onClick={handlePay} disabled={!payOperator || (payOperator !== 'wave' && !payPhone.trim()) || payStatus === 'initiating'}
                    className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {payStatus === 'initiating' ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</> : payOperator === 'wave' ? `Payer avec Wave · ${formatPrice(price)}` : `Payer ${formatPrice(price)}`}
                  </button>
                  </>
                  )}
                </>
              )}

              {payStatus === 'idle' && !OFFLINE_PAYMENT_CODES.includes(payDialCode) && (
                <div className="text-center pt-1 space-y-2">
                  <button onClick={() => navigate(`/parcours/paiement-3-fois?pack=${tier}`)} className="block w-full text-xs font-semibold text-blue-600 hover:underline">
                    Ou payer en 3 fois
                  </button>
                  <button onClick={() => setStep('form')} className="block w-full text-[11px] text-gray-400 hover:text-gray-600">
                    Modifier mes coordonnées
                  </button>
                </div>
              )}

              {payStatus === 'pending' && (
                <div className="text-center py-4 space-y-3">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                  <p className="font-bold text-gray-900">Vérifiez votre téléphone</p>
                  <p className="text-sm text-gray-600">Entrez votre PIN Mobile Money pour confirmer {formatPrice(price)}</p>
                </div>
              )}

              {payStatus === 'failed' && (
                <div className="text-center py-2 space-y-3">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <p className="text-red-600 font-semibold text-sm">{payError}</p>
                  <button onClick={reset} className="text-sm font-semibold text-blue-600 hover:underline">Réessayer</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
