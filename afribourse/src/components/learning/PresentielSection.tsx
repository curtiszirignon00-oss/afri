import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle, Loader2, X, MapPin, CalendarDays, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePawaPayment, getCorrespondent, getAvailableCountries, getCurrency } from '../../hooks/usePawaPayment';
import { analytics } from '../../services/analytics';
import { API_BASE_URL } from '../../config/api';

type SeatInfo = { reserved: number; limit: number; soldOut: boolean };

// ── Événements présentiels (ids alignés sur le backend INDIVIDUAL_WEBINAR_PRICES) ──
interface Event {
  id: string;
  city: string;
  country: string;
  flag: string;
  venue: string;
  price: number;
  dates: string;
  accent: string;
  payDial: string;
}

const EVENTS: Event[] = [
  {
    id: 'presentiel-calavi-benin',
    city: 'Calavi', country: 'Bénin', flag: '🇧🇯', venue: 'Calavi',
    price: 50000, dates: '9 & 10 octobre 2026',
    accent: 'from-emerald-600 to-green-700', payDial: '+229',
  },
  {
    id: 'presentiel-ouaga-bf',
    city: 'Ouagadougou', country: 'Burkina Faso', flag: '🇧🇫', venue: 'Ouagadougou',
    price: 50000, dates: '9 & 10 octobre 2026',
    accent: 'from-orange-500 to-red-600', payDial: '+226',
  },
];

const WHATSAPP_DIAL_CODES = [
  { code: '+229', flag: '🇧🇯' }, { code: '+226', flag: '🇧🇫' }, { code: '+225', flag: '🇨🇮' },
  { code: '+221', flag: '🇸🇳' }, { code: '+223', flag: '🇲🇱' }, { code: '+228', flag: '🇹🇬' },
  { code: '+227', flag: '🇳🇪' }, { code: '+233', flag: '🇬🇭' }, { code: '+237', flag: '🇨🇲' },
];

const PAYMENT_DIAL_CODES = [
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
];

const MOBILE_OPERATORS = [
  { id: 'wave',         label: 'Wave',         emoji: '🌊' },
  { id: 'orange-money', label: 'Orange Money', emoji: '🟠' },
  { id: 'mtn-momo',     label: 'MTN MoMo',     emoji: '🟡' },
  { id: 'moov-money',   label: 'Moov Money',   emoji: '🔵' },
  { id: 'free-money',   label: 'Free Money',   emoji: '🟢' },
];

function formatPrice(n: number) { return n.toLocaleString('fr-FR') + ' XOF'; }

export default function PresentielSection() {
  const { userProfile } = useAuth();
  const [selected, setSelected] = useState<Event | null>(null);
  const [seats, setSeats] = useState<Record<string, SeatInfo> | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/webinars/cohort-seats`)
      .then((r) => r.json())
      .then((d) => setSeats(d.data ?? null))
      .catch(() => { /* silencieux */ });
  }, []);

  return (
    <section id="presentiel" className="px-4 sm:px-6 py-14 bg-white scroll-mt-20">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 text-center mb-3">Ou en présentiel · 2 jours</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-2" style={{ letterSpacing: '-0.01em' }}>
          De curieux à investisseur BRVM
        </h2>
        <p className="text-gray-500 text-center text-sm max-w-xl mx-auto mb-8">
          Deux jours intensifs en salle pour passer de la curiosité à l'action — les <strong>9 & 10 octobre</strong>. Places limitées.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {EVENTS.map((ev) => (
            <div key={ev.id} className="bg-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className={`bg-gradient-to-r ${ev.accent} px-6 py-5 text-white`}>
                <p className="text-3xl">{ev.flag}</p>
                <h3 className="text-xl font-extrabold leading-snug mt-1">{ev.city}</h3>
                <p className="text-white/80 text-sm">{ev.country}</p>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="space-y-2 mb-4 text-sm text-gray-700">
                  <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gray-400" /> {ev.dates}</p>
                  <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> En présentiel — {ev.venue}</p>
                </div>
                <p className="text-2xl font-extrabold text-gray-900 mb-3">{formatPrice(ev.price)} <span className="text-sm font-semibold text-gray-500">/ personne</span></p>

                {seats?.[ev.id] && (() => {
                  const s = seats[ev.id];
                  const remaining = Math.max(0, s.limit - s.reserved);
                  const ratio = Math.min(100, Math.round((s.reserved / s.limit) * 100));
                  return (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                        <span className="flex items-center gap-1 text-gray-500"><Users className="w-3 h-3" /> {s.reserved}/{s.limit} inscrits</span>
                        <span className={s.soldOut ? 'text-red-500' : 'text-emerald-600'}>{s.soldOut ? 'Complet' : `${remaining} place${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                        <div className={`h-full rounded-full ${s.soldOut ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })()}

                <button onClick={() => { setSelected(ev); analytics.trackAction('presentiel_selected', ev.city, { amount: ev.price }); }}
                  disabled={seats?.[ev.id]?.soldOut}
                  className="mt-auto w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  {seats?.[ev.id]?.soldOut ? 'Complet' : `Je m'inscris — ${formatPrice(ev.price)}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">✓ Paiement Mobile Money & Wave sécurisé · Confirmation par email · Places limitées</p>
      </div>

      {selected && (
        <InscriptionModal
          event={selected}
          onClose={() => setSelected(null)}
          initName={(userProfile as any)?.profile?.full_name || ''}
          initEmail={(userProfile as any)?.email || ''}
        />
      )}
    </section>
  );
}

// ── Modal d'inscription + paiement direct (pas de pré-inscription) ────────────
function InscriptionModal({
  event, onClose, initName, initEmail,
}: {
  event: Event;
  onClose: () => void;
  initName: string; initEmail: string;
}) {
  const [name, setName] = useState(initName);
  const [email, setEmail] = useState(initEmail);
  const [waDialCode, setWaDialCode] = useState(event.payDial);
  const [waPhone, setWaPhone] = useState('');

  const [payDialCode, setPayDialCode] = useState(event.payDial);
  const [payOperator, setPayOperator] = useState<string | null>(null);
  const [payPhone, setPayPhone] = useState('');

  const { status, errorMessage, initiate } = usePawaPayment();
  const payStatus = status;
  const payError = errorMessage;

  const handlePay = () => {
    if (!name.trim() || !email.trim()) { toast.error('Renseignez votre nom et votre email'); return; }
    if (!waPhone.trim()) { toast.error('Votre numéro WhatsApp est requis'); return; }
    if (!payOperator) { toast.error('Choisissez votre opérateur'); return; }
    const correspondent = getCorrespondent(payOperator, payDialCode);
    if (!correspondent) { toast.error('Opérateur non disponible dans ce pays'); return; }

    const isWave = payOperator === 'wave';
    const msisdn = isWave ? '' : payDialCode.replace('+', '') + payPhone.replace(/\D/g, '');
    analytics.trackAction('presentiel_payment_initiated', event.city, { amount: event.price, operator: payOperator });
    initiate({
      planId: event.id,
      planName: `Présentiel BRVM — ${event.city}`,
      amount: String(event.price),
      currency: getCurrency(payDialCode),
      correspondent,
      phone: msisdn,
      registrationEmail: email.trim(),
      registrationName: name.trim(),
    });
  };

  if (payStatus === 'completed') {
    return (
      <ModalShell onClose={onClose}>
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">Inscription confirmée 🎉</h2>
          <p className="text-sm text-gray-600 mb-6">Votre place pour <strong>{event.city}</strong> ({event.dates}) est réservée. Vous recevez un email de confirmation ; les détails pratiques (lieu, horaires) arrivent avant l'événement.</p>
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">Terminer</button>
        </div>
      </ModalShell>
    );
  }

  const availableOps = MOBILE_OPERATORS.filter((op) => getAvailableCountries(op.id).includes(payDialCode));

  return (
    <ModalShell onClose={onClose}>
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Présentiel · {event.dates}</p>
        <h2 className="text-lg font-extrabold text-gray-900 leading-snug">{event.flag} De curieux à investisseur BRVM — {event.city}</h2>
        <p className="text-2xl font-extrabold text-gray-900 mt-1">{formatPrice(event.price)}</p>
      </div>

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
              placeholder="numéro" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
          </div>
        </div>
      </div>

      <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Pays de paiement</label>
          <select value={payDialCode} onChange={(e) => { setPayDialCode(e.target.value); setPayOperator(null); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            {PAYMENT_DIAL_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        </div>

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
                placeholder="numéro" className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white" />
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
            {payStatus === 'initiating' ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi…</> : payOperator === 'wave' ? `Payer avec Wave · ${formatPrice(event.price)}` : `Payer ${formatPrice(event.price)}`}
          </button>
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
