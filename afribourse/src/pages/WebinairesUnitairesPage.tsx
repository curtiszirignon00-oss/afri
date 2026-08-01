import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle, Loader2, ArrowLeft, X, Gift } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePawaPayment, getCorrespondent, getAvailableCountries, getCurrency } from '../hooks/usePawaPayment';
import { analytics } from '../services/analytics';

// ── Webinaires à l'unité (ids alignés sur le backend INDIVIDUAL_WEBINAR_PRICES) ──
interface Webinar {
  id: string;
  emoji: string;
  title: string;
  price: number;
  sessions: string;
  pitch: string;
  bullets: string[];
  bonus?: string;
  closer: string;
  accent: string; // tailwind gradient
}

const WEBINARS: Webinar[] = [
  {
    id: 'webinaire-introduction-bourse',
    emoji: '🎓',
    title: 'Introduction à la Bourse',
    price: 5000,
    sessions: '1 session live',
    pitch: 'Vous entendez parler de la BRVM mais tout ça reste flou ? On démystifie tout.',
    bullets: [
      "C'est quoi une bourse, et concrètement comment fonctionne la BRVM",
      "La différence entre une action et une obligation (et laquelle vous correspond)",
      "Comment on gagne réellement de l'argent en bourse — sans les idées reçues",
    ],
    closer: 'Le point de départ idéal pour arrêter de subir et commencer à comprendre.',
    accent: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'webinaire-fondamentaux-analyse',
    emoji: '📊',
    title: 'Les Fondamentaux : Analyser & Valoriser une Action',
    price: 30000,
    sessions: '2 sessions live',
    pitch: "Arrêtez d'acheter au hasard. Apprenez à choisir vos actions comme un analyste.",
    bullets: [
      "Analyser et valoriser une action : savoir ce qu'elle vaut vraiment",
      "Lire et interpréter les chiffres et les ratios clés (sans être comptable)",
      "Décider quoi acheter, et surtout quand acheter ou vendre",
    ],
    bonus: "Un cas pratique guidé + votre template d'analyse à réutiliser sur n'importe quelle action de la BRVM.",
    closer: "La compétence qui sépare celui qui investit avec méthode de celui qui devine.",
    accent: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'webinaire-analyse-technique',
    emoji: '📈',
    title: "L'Analyse Technique : Lire le Marché",
    price: 40000,
    sessions: '2 sessions live',
    pitch: 'Le bon titre au mauvais moment reste une mauvaise décision. Apprenez à lire le timing du marché.',
    bullets: [
      "Lire un graphique boursier et repérer les tendances",
      "Identifier les bons moments d'entrée et de sortie",
      "Utiliser les signaux techniques pour affiner vos décisions",
    ],
    bonus: 'Un cas pratique guidé sur des titres réels de la BRVM.',
    closer: "L'outil des investisseurs qui ne laissent plus rien au hasard.",
    accent: 'from-orange-500 to-amber-600',
  },
];

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
];

const OFFLINE_PAYMENT_CODES = ['+228'];

const MOBILE_OPERATORS = [
  { id: 'wave',         label: 'Wave',         emoji: '🌊' },
  { id: 'orange-money', label: 'Orange Money', emoji: '🟠' },
  { id: 'mtn-momo',     label: 'MTN MoMo',     emoji: '🟡' },
  { id: 'moov-money',   label: 'Moov Money',   emoji: '🔵' },
  { id: 'free-money',   label: 'Free Money',   emoji: '🟢' },
];

function formatPrice(n: number) { return n.toLocaleString('fr-FR') + ' XOF'; }

function readLead(): { name?: string; email?: string; dialCode?: string; phone?: string } | null {
  try { return JSON.parse(localStorage.getItem('afb_cohort_lead') || 'null'); } catch { return null; }
}

export default function WebinairesUnitairesPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [selected, setSelected] = useState<Webinar | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/webinaires')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Nos parcours complets
        </button>

        {/* Hero */}
        <div className="text-center mb-10">
          <span className="inline-block bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">Webinaires à l'unité</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">Formez-vous à votre rythme</h1>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Choisissez un webinaire selon votre besoin. Sessions live animées par des analystes qui connaissent la BRVM.</p>
        </div>

        {/* Cartes */}
        <div className="space-y-5">
          {WEBINARS.map((w) => (
            <div key={w.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`bg-gradient-to-r ${w.accent} px-6 py-5 text-white`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">{w.sessions}</p>
                    <h2 className="text-lg sm:text-xl font-extrabold leading-snug mt-0.5">{w.emoji} {w.title}</h2>
                  </div>
                  <span className="text-2xl font-extrabold whitespace-nowrap">{formatPrice(w.price)}</span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700 font-medium mb-4">{w.pitch}</p>
                <ul className="space-y-2 mb-4">
                  {w.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {w.bonus && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                    <Gift className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800"><strong>Inclus :</strong> {w.bonus}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 italic mb-4">👉 {w.closer}</p>
                <button onClick={() => { setSelected(w); analytics.trackAction('webinar_unit_selected', w.title, { amount: w.price }); }}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity">
                  Réserver — {formatPrice(w.price)}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">✓ Paiement Mobile Money & Wave sécurisé · Replay inclus · Satisfait ou remboursé 7 jours</p>
      </div>

      {selected && (
        <WebinarCheckoutModal
          webinar={selected}
          onClose={() => setSelected(null)}
          initName={(userProfile as any)?.profile?.full_name || readLead()?.name || ''}
          initEmail={(userProfile as any)?.email || readLead()?.email || ''}
          initDial={readLead()?.dialCode || '+225'}
          initPhone={readLead()?.phone || ''}
        />
      )}
    </div>
  );
}

// ── Modal d'inscription + paiement ───────────────────────────────────────────
function WebinarCheckoutModal({
  webinar, onClose, initName, initEmail, initDial, initPhone,
}: {
  webinar: Webinar;
  onClose: () => void;
  initName: string; initEmail: string; initDial: string; initPhone: string;
}) {
  const [name, setName] = useState(initName);
  const [email, setEmail] = useState(initEmail);
  const [waDialCode, setWaDialCode] = useState(WHATSAPP_DIAL_CODES.some((c) => c.code === initDial) ? initDial : '+225');
  const [waPhone, setWaPhone] = useState(initPhone);

  const [payDialCode, setPayDialCode] = useState(PAYMENT_DIAL_CODES.some((c) => c.code === initDial) ? initDial : '+225');
  const [payOperator, setPayOperator] = useState<string | null>(null);
  const [payPhone, setPayPhone] = useState(PAYMENT_DIAL_CODES.some((c) => c.code === initDial) ? initPhone : '');

  const { status, errorMessage, initiate } = usePawaPayment();
  const payStatus = status;
  const payError = errorMessage;

  const registerLead = async () => {
    try {
      await authFetch(`${API_BASE_URL}/webinars/preregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: webinar.id,
          name: name.trim(),
          email: email.trim(),
          phone: `${waDialCode} ${waPhone.trim()}`,
          type: 'webinar',
        }),
      });
      try { localStorage.setItem('afb_cohort_lead', JSON.stringify({ name: name.trim(), email: email.trim(), dialCode: waDialCode, phone: waPhone.trim() })); } catch { /* ignore */ }
    } catch { /* non bloquant */ }
  };

  const handlePay = async () => {
    if (!name.trim() || !email.trim()) { toast.error('Renseignez votre nom et votre email'); return; }
    if (!waPhone.trim()) { toast.error('Votre numéro WhatsApp est requis'); return; }
    if (OFFLINE_PAYMENT_CODES.includes(payDialCode)) { toast.error('Paiement en ligne non disponible pour ce pays'); return; }
    if (!payOperator) { toast.error('Choisissez votre opérateur'); return; }
    const correspondent = getCorrespondent(payOperator, payDialCode);
    if (!correspondent) { toast.error('Opérateur non disponible dans ce pays'); return; }

    await registerLead();

    const isWave = payOperator === 'wave';
    const msisdn = isWave ? '' : payDialCode.replace('+', '') + payPhone.replace(/\D/g, '');
    analytics.trackAction('webinar_unit_payment_initiated', webinar.title, { amount: webinar.price, operator: payOperator });
    initiate({
      planId: webinar.id,
      planName: webinar.title,
      amount: String(webinar.price),
      currency: getCurrency(payDialCode),
      correspondent,
      phone: msisdn,
      registrationEmail: email.trim(),
      registrationName: name.trim(),
    });
  };

  // Succès
  if (payStatus === 'completed') {
    return (
      <ModalShell onClose={onClose}>
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Inscription confirmée 🎉</h2>
          <p className="text-sm text-gray-600 mb-6">Votre place pour <strong>{webinar.title}</strong> est réservée. Vous recevez un email de confirmation ; le lien de connexion arrivera avant la session.</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">Terminer</button>
        </div>
      </ModalShell>
    );
  }

  const availableOps = MOBILE_OPERATORS.filter((op) => getAvailableCountries(op.id).includes(payDialCode));

  return (
    <ModalShell onClose={onClose}>
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">{webinar.sessions}</p>
        <h2 className="text-lg font-extrabold text-gray-900 leading-snug">{webinar.emoji} {webinar.title}</h2>
        <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatPrice(webinar.price)}</p>
      </div>

      {/* Coordonnées */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Awa Traoré"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro WhatsApp *</label>
          <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
            <select value={waDialCode} onChange={(e) => setWaDialCode(e.target.value)} className="bg-gray-50 border-r border-gray-200 px-2 text-sm focus:outline-none">
              {WHATSAPP_DIAL_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input type="tel" value={waPhone} onChange={(e) => setWaPhone(e.target.value.replace(/[^\d\s]/g, ''))}
              placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
          </div>
        </div>
      </div>

      {/* Paiement */}
      <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Pays de paiement</label>
          <select value={payDialCode} onChange={(e) => { setPayDialCode(e.target.value); setPayOperator(null); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {PAYMENT_DIAL_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        </div>

        {OFFLINE_PAYMENT_CODES.includes(payDialCode) ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-bold mb-1">🇹🇬 Paiement en ligne non disponible au Togo</p>
            <p className="text-xs leading-relaxed">Vos coordonnées sont enregistrées — notre équipe vous contacte sur WhatsApp pour finaliser.</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Opérateur Mobile Money</p>
              {availableOps.length === 0 ? (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">Aucun opérateur disponible pour ce pays.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableOps.map((op) => (
                    <button key={op.id} onClick={() => setPayOperator(op.id)}
                      className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left ${payOperator === op.id ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-700 hover:border-blue-300'}`}>
                      {op.emoji} {op.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {payOperator === 'wave' ? (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-800 leading-relaxed">
                🌊 Vous serez redirigé vers <strong>Wave</strong> pour finaliser. Aucun numéro à saisir ici.
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro Mobile Money</label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                  <span className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 flex items-center">{payDialCode}</span>
                  <input type="tel" value={payPhone} onChange={(e) => setPayPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder="07 00 00 00 00" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
                </div>
              </div>
            )}

            {payError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{payError}</p>}

            {payStatus === 'pending' ? (
              <div className="text-center py-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Validez le paiement sur votre téléphone…</p>
              </div>
            ) : (
              <button onClick={handlePay} disabled={!payOperator || (payOperator !== 'wave' && !payPhone.trim()) || payStatus === 'initiating'}
                className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {payStatus === 'initiating' ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : payOperator === 'wave' ? `Payer avec Wave · ${formatPrice(webinar.price)}` : `Payer ${formatPrice(webinar.price)}`}
              </button>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-6">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1" aria-label="Fermer">
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
