import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle, Loader2, AlertCircle, ArrowLeft, Flame } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePawaPayment, getCorrespondent, getAvailableCountries, getCurrency } from '../hooks/usePawaPayment';
import { analytics } from '../services/analytics';
import { formatCountdown } from '../utils/promo';
import {
  ANALYSIS_PACK_ID, ANALYSIS_PACKS, ANALYSIS_DEADLINE_LABEL, ANALYSIS_SESSION_DATES_LABEL,
  getAnalysisPack, analysisDisplayPrice, analysisOfferOpen, analysisRemainingMs, type AnalysisPackId,
} from '../config/analysisPacks';

// Étagère 2 « J'accède aux analyses » — réservation gratuite de la place, puis paiement
// maintenant ou plus tard (lien envoyé par email). Le prix est recalculé côté serveur.

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

// Coordonnées partagées avec la page cohorte (évite la ressaisie)
function readLead(): { name?: string; email?: string; dialCode?: string; phone?: string } | null {
  try { return JSON.parse(localStorage.getItem('afb_cohort_lead') || 'null'); } catch { return null; }
}

export default function AnalysisCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();

  const [packId, setPackId] = useState<AnalysisPackId>(getAnalysisPack(searchParams.get('pack')).id);
  const pack = getAnalysisPack(packId);
  const PACK_NAME = `Pack Analyses ${pack.name}`;
  const open = analysisOfferOpen();
  const price = analysisDisplayPrice(pack);

  const lead = readLead();
  const [form, setForm] = useState({
    name: lead?.name || (userProfile as any)?.profile?.full_name || '',
    email: lead?.email || (userProfile as any)?.email || '',
  });
  const [waDialCode, setWaDialCode] = useState(lead?.dialCode || '+225');
  const [waPhone, setWaPhone] = useState(lead?.phone || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'reserved' | 'payment'>('form');
  const [payOperator, setPayOperator] = useState<string | null>(null);
  const [payDialCode, setPayDialCode] = useState('+225');
  const [payPhone, setPayPhone] = useState('');

  const { status: payStatus, errorMessage: payError, initiate, reset } = usePawaPayment(() => {
    analytics.trackAction('analyses_payment_success', PACK_NAME, { amount: price });
  });

  const handleReserve = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Renseignez votre nom et votre email'); return; }
    if (!waPhone.trim()) { toast.error('Votre numéro WhatsApp est requis'); return; }
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/webinars/preregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: ANALYSIS_PACK_ID,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: `${waDialCode} ${waPhone.trim()}`,
          type: 'analyses',
          pack: packId,
        }),
      });
      if (!res.ok) {
        let msg = 'Enregistrement impossible. Vérifiez votre connexion et réessayez.';
        try { const d = await res.json(); if (d?.message) msg = d.message; } catch { /* ignore */ }
        throw new Error(msg);
      }
      try { localStorage.setItem('afb_cohort_lead', JSON.stringify({ name: form.name.trim(), email: form.email.trim(), dialCode: waDialCode, phone: waPhone.trim() })); } catch { /* ignore */ }
      if (PAYMENT_DIAL_CODES.some((c) => c.code === waDialCode)) {
        setPayDialCode(waDialCode);
        setPayPhone(waPhone);
      }
      analytics.trackAction('analyses_reserved', PACK_NAME, { pack: packId });
      setStep('reserved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'enregistrement. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    if (!payOperator) return;
    const correspondent = getCorrespondent(payOperator, payDialCode);
    if (!correspondent) { toast.error('Opérateur non disponible dans ce pays'); return; }
    const isWave = payOperator === 'wave';
    const msisdn = isWave ? '' : payDialCode.replace('+', '') + payPhone.replace(/\D/g, '');
    analytics.trackAction('analyses_payment_initiated', PACK_NAME, { amount: price, operator: payOperator });
    initiate({
      planId: ANALYSIS_PACK_ID,
      planName: PACK_NAME,
      amount: String(price),
      currency: getCurrency(payDialCode),
      correspondent,
      phone: msisdn,
      registrationEmail: form.email.trim(),
      registrationName: form.name.trim(),
      pack: packId,
    });
  };

  const backToOffer = () => navigate('/webinaires#analyses');

  if (payStatus === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé 🎉</h1>
          <p className="text-sm text-gray-600 mb-5">
            Votre <strong>{PACK_NAME}</strong> est confirmé. Vous recevez tous les détails par email et WhatsApp — sessions live de décorticage : {ANALYSIS_SESSION_DATES_LABEL}.
          </p>
          <button onClick={backToOffer} className="w-full py-3 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors">
            Retour à l'offre
          </button>
        </div>
      </div>
    );
  }

  if (step === 'reserved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Place réservée ✓</h1>
          <p className="text-sm text-gray-600 mb-2">
            Votre place sur le <strong>{PACK_NAME}</strong> est tenue.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Confirmez dès maintenant, ou plus tard avec le lien reçu par email{open ? <> — le tarif de lancement court jusqu'au <strong>{ANALYSIS_DEADLINE_LABEL}</strong></> : null}.
          </p>
          <button onClick={() => setStep('payment')} className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-90 transition-opacity mb-2">
            💳 Payer maintenant — {formatPrice(price)}
          </button>
          <button onClick={backToOffer} className="w-full py-2.5 rounded-xl font-semibold text-gray-500 hover:text-gray-700 text-sm">
            Payer plus tard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={backToOffer} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 to-emerald-800 px-6 py-6 text-white">
            <p className="text-teal-200 text-[10px] font-bold uppercase tracking-widest mb-1">Étagère 2 · J'accède aux analyses</p>
            <h1 className="text-2xl font-extrabold leading-snug">{PACK_NAME}</h1>
            <p className="text-teal-100 text-xs mt-0.5">{pack.scope}</p>
            <div className="mt-2 flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-extrabold">{formatPrice(price)}</span>
              {open && (
                <>
                  <span className="text-lg line-through text-teal-300/80 font-semibold">{formatPrice(pack.full)}</span>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-red-500 text-white">-50 %</span>
                </>
              )}
            </div>
            {open && (
              <p className="mt-2 text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Tarif lancement — se termine dans <span className="font-mono">{formatCountdown(analysisRemainingMs())}</span>
              </p>
            )}
          </div>

          <div className="p-6 pb-0 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Votre pack</p>
              <div className="grid grid-cols-3 gap-2">
                {ANALYSIS_PACKS.map((p) => {
                  const active = packId === p.id;
                  return (
                    <button key={p.id} onClick={() => setPackId(p.id)} type="button" disabled={step !== 'form'}
                      className={`rounded-xl border-2 p-2 text-center transition-all disabled:cursor-not-allowed ${!active && step !== 'form' ? 'opacity-40' : ''} ${active ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-300'}`}>
                      <span className={`block text-xs font-extrabold ${active ? 'text-teal-800' : 'text-gray-700'}`}>{p.name}</span>
                      <span className="block text-[11px] font-bold text-gray-900 mt-0.5">{analysisDisplayPrice(p).toLocaleString('fr-FR')}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Inclus dans le {PACK_NAME}</p>
              <ul className="space-y-1.5">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {step === 'form' && (
            <div className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ex : Kofi Mensah" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="votre@email.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro WhatsApp *</label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                  <select value={waDialCode} onChange={(e) => setWaDialCode(e.target.value)}
                    className="bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-700 pl-2 pr-1 py-2.5 focus:outline-none cursor-pointer" style={{ minWidth: '85px' }}>
                    {WHATSAPP_DIAL_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                  </select>
                  <input type="tel" value={waPhone} onChange={(e) => setWaPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                    placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                </div>
              </div>
              <button onClick={handleReserve} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-teal-600 to-emerald-700 hover:opacity-90 active:scale-95 disabled:opacity-60 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Réserver ma place</>}
              </button>
              <p className="text-center text-[11px] text-gray-400">Réservation gratuite · payez maintenant ou plus tard</p>
            </div>
          )}

          {step === 'payment' && (
            <div className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 border rounded-xl p-3 text-sm">
                ✅ Place réservée · Payez pour la confirmer
                <span className="block font-bold mt-0.5">{formatPrice(price)}</span>
              </div>

              {(payStatus === 'idle' || payStatus === 'initiating') && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pays</label>
                    <select value={payDialCode} onChange={(e) => { setPayDialCode(e.target.value); setPayOperator(null); }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                      {PAYMENT_DIAL_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.code})</option>)}
                    </select>
                  </div>

                  {OFFLINE_PAYMENT_CODES.includes(payDialCode) ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <p className="font-bold mb-1">🇹🇬 Paiement en ligne non disponible au Togo</p>
                      <p className="text-xs leading-relaxed">Votre place est bien réservée. Notre équipe vous contacte sur WhatsApp pour le règlement.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Opérateur Mobile Money</p>
                        {(() => {
                          const ops = MOBILE_OPERATORS.filter((op) => getAvailableCountries(op.id).includes(payDialCode));
                          if (ops.length === 0) return <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">Aucun opérateur Mobile Money disponible pour ce pays.</p>;
                          return (
                            <div className="grid grid-cols-2 gap-2">
                              {ops.map((op) => (
                                <button key={op.id} onClick={() => setPayOperator(op.id)}
                                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left cursor-pointer ${payOperator === op.id ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-700 hover:border-teal-300'}`}>
                                  {op.emoji} {op.label}
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                      {payOperator === 'wave' ? (
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-800 leading-relaxed">
                          🌊 Vous allez être redirigé vers <strong>Wave</strong> pour finaliser le paiement. Aucun numéro à saisir ici.
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro Mobile Money</label>
                          <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                            <span className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 flex items-center">{payDialCode}</span>
                            <input type="tel" value={payPhone} onChange={(e) => setPayPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                              placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                          </div>
                        </div>
                      )}

                      {payError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{payError}</p>}

                      <button onClick={handlePay} disabled={!payOperator || (payOperator !== 'wave' && !payPhone.trim()) || payStatus === 'initiating'}
                        className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {payStatus === 'initiating' ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</> : payOperator === 'wave' ? `Payer avec Wave · ${formatPrice(price)}` : `Payer ${formatPrice(price)}`}
                      </button>
                    </>
                  )}
                </>
              )}

              {payStatus === 'idle' && (
                <div className="text-center pt-1 space-y-2">
                  <button onClick={backToOffer} className="block w-full text-xs font-semibold text-gray-500 hover:text-gray-700 hover:underline">
                    Payer plus tard
                  </button>
                  <button onClick={() => setStep('reserved')} className="block w-full text-[11px] text-gray-400 hover:text-gray-600">Retour</button>
                </div>
              )}

              {payStatus === 'pending' && (
                <div className="text-center py-4 space-y-3">
                  <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto" />
                  <p className="font-bold text-gray-900">Vérifiez votre téléphone</p>
                  <p className="text-sm text-gray-600">Entrez votre PIN Mobile Money pour confirmer {formatPrice(price)}</p>
                </div>
              )}

              {payStatus === 'failed' && (
                <div className="text-center py-2 space-y-3">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <p className="text-red-600 font-semibold text-sm">{payError}</p>
                  <button onClick={reset} className="text-sm font-semibold text-teal-600 hover:underline">Réessayer</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
