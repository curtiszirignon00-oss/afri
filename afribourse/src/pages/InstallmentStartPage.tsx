import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle, Loader2, AlertCircle, Lock, ShieldCheck, CalendarClock, ArrowLeft } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePawaPayment, getCorrespondent, getAvailableCountries, getCurrency } from '../hooks/usePawaPayment';
import { analytics } from '../services/analytics';

const PACK_ID = 'pack-parcours-investisseur';

// Échéancier 3× par pack (plein tarif, sans réduction)
const PACK_TIERS: Record<string, { name: string; installments: number[] }> = {
  starter:      { name: 'Pack Starter',      installments: [15000, 10000, 10000] },
  parcours:     { name: 'Pack Parcours',     installments: [20000, 15000, 15000] },
  investisseur: { name: 'Pack Investisseur', installments: [25000, 25000, 25000] },
};
function resolveTier(p: string | null): string {
  return p && PACK_TIERS[p] ? p : 'starter';
}

// Coordonnées mémorisées lors de la pré-inscription (évite la ressaisie)
function readLead(): { name?: string; email?: string; dialCode?: string; phone?: string } | null {
  try { return JSON.parse(localStorage.getItem('afb_cohort_lead') || 'null'); } catch { return null; }
}

// Indicatifs WhatsApp (large — Togo inclus, car on prend l'inscription même si le paiement n'est pas dispo)
const WHATSAPP_DIAL_CODES = [
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+234', flag: '🇳🇬', name: 'Nigéria' },
  { code: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
];

// Indicatifs paiement (PawaPay — sans Togo)
const PAYMENT_DIAL_CODES = [
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+256', flag: '🇺🇬', name: 'Ouganda' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
];

const MOBILE_OPERATORS = [
  { id: 'wave',         label: 'Wave',         emoji: '🌊' },
  { id: 'orange-money', label: 'Orange Money', emoji: '🟠' },
  { id: 'mtn-momo',     label: 'MTN MoMo',     emoji: '🟡' },
  { id: 'moov-money',   label: 'Moov Money',   emoji: '🔵' },
  { id: 'free-money',   label: 'Free Money',   emoji: '🟢' },
];

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR') + ' XOF';
}
function addDaysLabel(days: number) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function InstallmentStartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoggedIn, userProfile } = useAuth();

  const tier = resolveTier(searchParams.get('pack'));
  const tierCfg = PACK_TIERS[tier];
  const PLAN_NAME = tierCfg.name;
  const INSTALLMENTS = tierCfg.installments;
  const TOTAL = INSTALLMENTS.reduce((a, b) => a + b, 0);

  const lead = readLead();
  const [step, setStep] = useState<'conditions' | 'contact' | 'payment' | 'success'>('conditions');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: lead?.name || (userProfile as any)?.profile?.full_name || (userProfile as any)?.profile?.username || '',
    email: lead?.email || (userProfile as any)?.email || '',
  });
  const [waDialCode, setWaDialCode] = useState(lead?.dialCode || '+225');
  const [waPhone, setWaPhone] = useState(lead?.phone || '');

  const [payOperator, setPayOperator] = useState<string | null>(null);
  const [payDialCode, setPayDialCode] = useState('+225');
  const [payPhone, setPayPhone] = useState('');

  const { status: payStatus, errorMessage: payError, track, reset } = usePawaPayment(() => {
    analytics.trackAction('installment_plan_started', PLAN_NAME, { amount: INSTALLMENTS[0] });
    setStep('success');
  });

  const schedule = [
    { amount: INSTALLMENTS[0], when: "Aujourd'hui" },
    { amount: INSTALLMENTS[1], when: addDaysLabel(30) },
    { amount: INSTALLMENTS[2], when: addDaysLabel(60) },
  ];

  // Étape 1 → 2 : enregistrer la pré-inscription (contact WhatsApp) AVANT le paiement
  const handleContinue = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Veuillez renseigner votre nom et votre email');
      return;
    }
    if (!waPhone.trim()) {
      toast.error('Votre numéro WhatsApp est requis pour être recontacté');
      return;
    }
    setLoading(true);
    try {
      // Lead capturé même si le paiement n'aboutit pas → recontact WhatsApp possible
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
      analytics.trackAction('installment_preregistered', PLAN_NAME, { packId: PACK_ID });
      // Pré-remplir le numéro de paiement si le pays est éligible PawaPay
      if (PAYMENT_DIAL_CODES.some((c) => c.code === waDialCode)) {
        setPayDialCode(waDialCode);
        setPayPhone(waPhone);
      }
      setStep('payment');
    } catch {
      toast.error("Erreur lors de l'enregistrement. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!payOperator) return;
    const correspondent = getCorrespondent(payOperator, payDialCode);
    if (!correspondent) { toast.error('Opérateur non disponible dans ce pays'); return; }
    const msisdn = payDialCode.replace('+', '') + payPhone.replace(/\D/g, '');
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/installments/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: `${waDialCode} ${waPhone.trim()}`, // WhatsApp (contact)
          correspondent,
          payPhone: msisdn,                          // Mobile Money
          currency: getCurrency(payDialCode),
          pack: tier,
          returnUrl: `${window.location.origin}/paiement/retour`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        window.location.assign(data.redirectUrl); // Wave → Payment Page
        return;
      }
      if (res.ok && data.depositId) {
        track(data.depositId);
      } else {
        toast.error(data.error ?? "Erreur lors du démarrage du plan.");
      }
    } catch {
      toast.error('Erreur réseau. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // ── Succès ──
  if (step === 'success' || payStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">1ère mensualité initiée 🎉</h1>
          <p className="text-sm text-gray-600 mb-5">
            Validez le paiement de <strong>{formatPrice(INSTALLMENTS[0])}</strong> avec votre PIN Mobile Money.
            Votre accès au parcours est activé dès confirmation.
          </p>
          <div className="text-left bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-3">Votre échéancier</p>
            <div className="space-y-2">
              {schedule.map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{i === 0 ? '✓ ' : ''}Mensualité {i + 1} · {s.when}</span>
                  <span className="font-semibold text-gray-900">{formatPrice(s.amount)}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-5">📩 Des rappels vous seront envoyés par email et WhatsApp avant chaque échéance.</p>
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
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Payer en 3 fois</p>
            <h1 className="text-2xl font-extrabold leading-snug">{PLAN_NAME}</h1>
            <p className="text-blue-200 text-sm mt-1">{formatPrice(TOTAL)} répartis en 3 mensualités</p>
          </div>

          {/* ── Conditions ── */}
          {step === 'conditions' && (
            <div className="p-6 space-y-5">
              {/* Échéancier */}
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-blue-600" /> Votre échéancier
                </h2>
                <div className="space-y-2">
                  {schedule.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Mensualité {i + 1}</p>
                        <p className="text-xs text-gray-500">{s.when}</p>
                      </div>
                      <span className="text-lg font-extrabold text-gray-900">{formatPrice(s.amount)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm font-bold text-gray-700">Total</span>
                    <span className="text-sm font-bold text-gray-900">{formatPrice(TOTAL)}</span>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="space-y-2.5">
                {[
                  { icon: ShieldCheck, text: 'Accès complet au parcours activé dès le 1er paiement (15 000 XOF).' },
                  { icon: CalendarClock, text: "Rappels par email et WhatsApp avant chaque échéance pour régler les mensualités suivantes." },
                  { icon: CheckCircle, text: `Engagement à régler les 3 mensualités (total ${formatPrice(TOTAL)}, le tarif normal du ${PLAN_NAME}). Vous pouvez aussi payer en 1 fois.` },
                  { icon: Lock, text: 'Paiement Mobile Money 100% sécurisé via PawaPay.' },
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <c.icon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 leading-snug">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Garde compte obligatoire */}
              {!isLoggedIn ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <Lock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-amber-800 mb-3">Connectez-vous pour payer en plusieurs fois</p>
                  <button
                    onClick={() => navigate('/login?redirect=/parcours/paiement-3-fois')}
                    className="w-full py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                  >
                    Se connecter / Créer un compte
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setStep('contact')}
                  className="w-full py-3.5 rounded-xl font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 active:scale-95 transition-all shadow-md"
                >
                  Continuer →
                </button>
              )}
            </div>
          )}

          {/* ── Étape contact : pré-inscription (capture lead WhatsApp) ── */}
          {step === 'contact' && (
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                Renseignez vos coordonnées — nous gardons votre place et vous recontactons sur WhatsApp.
              </div>

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
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro WhatsApp <span className="text-red-500">*</span></label>
                  <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                    <select value={waDialCode} onChange={e => setWaDialCode(e.target.value)}
                      className="bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-700 pl-2 pr-1 py-2.5 focus:outline-none cursor-pointer" style={{ minWidth: '90px' }}>
                      {WHATSAPP_DIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                    <input type="tel" value={waPhone} onChange={e => setWaPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                      placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Le lien de connexion et les rappels vous seront envoyés sur WhatsApp</p>
                </div>
              </div>

              <button onClick={handleContinue} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-700 hover:opacity-90 active:scale-95 disabled:opacity-60 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Continuer vers le paiement</>}
              </button>
            </div>
          )}

          {/* ── Étape paiement : 1ère mensualité ── */}
          {step === 'payment' && (
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                ✅ Inscription enregistrée · 1ère mensualité à régler maintenant
                <span className="block font-bold mt-0.5">{formatPrice(INSTALLMENTS[0])}</span>
              </div>

              {(payStatus === 'idle' || payStatus === 'initiating') && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Opérateur Mobile Money</p>
                    <div className="grid grid-cols-2 gap-2">
                      {MOBILE_OPERATORS.map(op => {
                        const available = getAvailableCountries(op.id).includes(payDialCode);
                        return (
                          <button key={op.id} onClick={() => available && setPayOperator(op.id)} disabled={!available}
                            className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left
                              ${payOperator === op.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-700 hover:border-blue-300'}
                              ${!available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                            {op.emoji} {op.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pays</label>
                    <select value={payDialCode} onChange={e => { setPayDialCode(e.target.value); setPayOperator(null); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      {PAYMENT_DIAL_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro Mobile Money</label>
                    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                      <span className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 flex items-center">{payDialCode}</span>
                      <input type="tel" value={payPhone} onChange={e => setPayPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                        placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                    </div>
                  </div>

                  {payError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{payError}</p>}

                  <button onClick={handleStart}
                    disabled={!payOperator || !payPhone.trim() || loading || payStatus === 'initiating'}
                    className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading || payStatus === 'initiating' ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</> : `Payer ${formatPrice(INSTALLMENTS[0])}`}
                  </button>
                </>
              )}

              {payStatus === 'pending' && (
                <div className="text-center py-4 space-y-3">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                  <p className="font-bold text-gray-900">Vérifiez votre téléphone</p>
                  <p className="text-sm text-gray-600">Entrez votre PIN Mobile Money pour confirmer {formatPrice(INSTALLMENTS[0])}</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">⏱ Vous avez environ 1 à 2 minutes</div>
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
