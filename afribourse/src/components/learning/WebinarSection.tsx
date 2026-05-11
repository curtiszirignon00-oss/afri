// src/components/learning/WebinarSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Users, Zap, ChevronRight, CheckCircle,
  Flame, Video, Tag, X, Loader2, Star, TrendingUp, Gift,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, authFetch } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

// ─── Indicatifs pays ──────────────────────────────────────────────────────────

const DIAL_CODES = [
  // UEMOA en premier
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: '+245', flag: '🇬🇼', name: 'Guinée-Bissau' },
  // Autres pays africains courants
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+234', flag: '🇳🇬', name: 'Nigéria' },
  { code: '+243', flag: '🇨🇩', name: 'RD Congo' },
  { code: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: '+241', flag: '🇬🇦', name: 'Gabon' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+20',  flag: '🇪🇬', name: 'Égypte' },
  // International
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgique' },
  { code: '+41',  flag: '🇨🇭', name: 'Suisse' },
  { code: '+1',   flag: '🇺🇸', name: 'États-Unis / Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'Royaume-Uni' },
];

// ─── PhoneInput — sélecteur d'indicatif + numéro ──────────────────────────────

interface PhoneInputProps {
  dialCode: string;
  number: string;
  onDialChange: (code: string) => void;
  onNumberChange: (n: string) => void;
}

const PhoneInput: React.FC<PhoneInputProps> = ({ dialCode, number, onDialChange, onNumberChange }) => {
  const selected = DIAL_CODES.find((c) => c.code === dialCode) ?? DIAL_CODES[0];
  return (
    <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
      <select
        value={dialCode}
        onChange={(e) => onDialChange(e.target.value)}
        className="bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-700 pl-2 pr-1 py-2.5 focus:outline-none cursor-pointer"
        style={{ minWidth: '90px' }}
        aria-label="Indicatif pays"
      >
        {DIAL_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={number}
        onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s\-]/g, ''))}
        placeholder={selected.name === "Côte d'Ivoire" ? '07 00 00 00 00' : 'Numéro'}
        className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white placeholder:text-gray-400"
      />
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Webinar {
  id: string;
  title: string;
  tagline: string;
  theme: string;
  date: string;
  endDate: string;
  earlyBirdDeadline: string;
  price: number;
  discountPercent: number;
  duration: string;
  speakers: string;
  badge?: string;
  gradient: string;
  accentColor: string;
  icon: React.ReactNode;
}

// ─── Données webinaires ────────────────────────────────────────────────────────

const WEBINARS: Webinar[] = [
  {
    id: 'w1-fondamentaux',
    title: 'Maîtriser les fondamentaux de la bourse',
    tagline: 'Passez de zéro à investisseur en une session',
    theme: 'Initiation • Stratégie • BRVM',
    date: '2026-05-23T09:00:00Z',
    endDate: '2026-05-23T12:00:00Z',
    earlyBirdDeadline: '2026-05-14T23:59:59Z',
    price: 5000,
    discountPercent: 50,
    duration: '3H',
    speakers: 'Experts marchés & Analystes Afribourse',
    badge: 'NOUVEAU',
    gradient: 'from-blue-600 to-indigo-700',
    accentColor: '#3B82F6',
    icon: <Star className="w-5 h-5" />,
  },
  {
    id: 'w2-fondamentale',
    title: 'Analyse fondamentale : lire les données comme un pro',
    tagline: 'Décryptez bilans, ratios et rapports annuels BRVM',
    theme: 'Analyse • Valorisation • Données financières',
    date: '2026-05-30T09:00:00Z',
    endDate: '2026-05-31T13:00:00Z',
    earlyBirdDeadline: '2026-05-14T23:59:59Z',
    price: 10000,
    discountPercent: 50,
    duration: '4H',
    speakers: 'Analystes financiers Afribourse',
    badge: undefined,
    gradient: 'from-emerald-600 to-teal-700',
    accentColor: '#10B981',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    id: 'w3-technique',
    title: 'Analyse technique : repérez les signaux avant la foule',
    tagline: 'Maîtrisez les graphiques, patterns et timing d\'entrée sur la BRVM',
    theme: 'Graphiques • Patterns • Timing',
    date: '2026-06-06T09:00:00Z',
    endDate: '2026-06-07T13:00:00Z',
    earlyBirdDeadline: '2026-05-14T23:59:59Z',
    price: 10000,
    discountPercent: 50,
    duration: '4H',
    speakers: 'Analystes techniques Afribourse',
    badge: 'BIENTÔT',
    gradient: 'from-orange-500 to-rose-600',
    accentColor: '#F97316',
    icon: <Flame className="w-5 h-5" />,
  },
];

// ─── Constantes ───────────────────────────────────────────────────────────────

const EARLY_BIRD_SEATS = 20;
const MAX_SEATS = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(xof: number): string {
  return xof.toLocaleString('fr-FR') + ' XOF';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// ─── EarlyBirdSeatsIndicator ──────────────────────────────────────────────────

const EarlyBirdSeatsIndicator: React.FC<{ count: number; fullPrice: number }> = ({ count, fullPrice }) => {
  const taken = Math.min(count, EARLY_BIRD_SEATS);
  const remaining = Math.max(0, EARLY_BIRD_SEATS - count);
  const earlyBirdActive = count < EARLY_BIRD_SEATS;
  const pct = Math.min(100, Math.round((taken / EARLY_BIRD_SEATS) * 100));
  const critical = remaining <= 5 && earlyBirdActive;

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${earlyBirdActive ? (critical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200') : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`flex items-center gap-1.5 text-xs font-bold ${earlyBirdActive ? (critical ? 'text-red-700' : 'text-amber-800') : 'text-gray-500'}`}>
          <Flame className={`w-3.5 h-3.5 ${earlyBirdActive ? 'animate-pulse' : ''}`} />
          {earlyBirdActive
            ? critical
              ? `⚠ Plus que ${remaining} place${remaining > 1 ? 's' : ''} à tarif réduit !`
              : `Il reste ${remaining} places à tarif réduit`
            : 'Places à tarif réduit épuisées'}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${earlyBirdActive ? (critical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800') : 'bg-gray-100 text-gray-500'}`}>
          {taken}/{EARLY_BIRD_SEATS}
        </span>
      </div>
      <div className={`w-full rounded-full h-1.5 overflow-hidden ${earlyBirdActive ? (critical ? 'bg-red-100' : 'bg-amber-100') : 'bg-gray-200'}`}>
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${earlyBirdActive ? (critical ? 'bg-red-500' : 'bg-amber-500') : 'bg-gray-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {earlyBirdActive && (
        <p className="text-[10px] text-amber-600 mt-1">Ensuite : tarif plein · {formatPrice(fullPrice)}</p>
      )}
    </div>
  );
};

// ─── Modal de pré-inscription ─────────────────────────────────────────────────

const RegistrationModal: React.FC<{ webinar: Webinar; count: number; onClose: (registered?: boolean) => void }> = ({ webinar, count, onClose }) => {
  const { userProfile } = useAuth();
  const earlyBird = count < EARLY_BIRD_SEATS;
  const earlyBirdRemaining = Math.max(0, EARLY_BIRD_SEATS - count);
  const effectivePrice = earlyBird ? webinar.price * (1 - webinar.discountPercent / 100) : webinar.price;

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: (userProfile as any)?.profile?.full_name || (userProfile as any)?.profile?.username || '',
    email: (userProfile as any)?.email || '',
    dialCode: '+225',
    phoneNumber: '',
  });

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Veuillez renseigner votre nom et email');
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/webinars/preregister`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webinarId: webinar.id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phoneNumber.trim() ? `${form.dialCode} ${form.phoneNumber.trim()}` : undefined,
          earlyBird,
          effectivePrice,
        }),
      });
      if (!res.ok && res.status !== 200) throw new Error();
      setDone(true);
    } catch {
      toast.error('Erreur lors de l\'inscription. Réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${webinar.gradient} px-6 py-5`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
            Pré-inscription webinaire
          </p>
          <h3 className="text-white font-bold text-lg leading-snug pr-6">{webinar.title}</h3>
          <p className="text-white/70 text-sm mt-1">
            {formatDate(webinar.date)} • {formatTime(webinar.date)}
          </p>
        </div>

        {!done ? (
          <div className="p-6 space-y-4">
            {earlyBird ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-500 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Tarif early bird : {formatPrice(effectivePrice)}
                    <span className="ml-2 text-xs font-normal line-through text-amber-400">{formatPrice(webinar.price)}</span>
                  </p>
                  <p className="text-xs text-amber-600">
                    Il ne reste que <strong>{earlyBirdRemaining}</strong> place{earlyBirdRemaining > 1 ? 's' : ''} à ce tarif — ensuite tarif plein
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-600">Tarif plein : {formatPrice(webinar.price)}<br /><span className="text-xs text-gray-400">Les 20 places à tarif réduit ont été réservées</span></p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex : Kofi Mensah"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Numéro WhatsApp <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                <PhoneInput
                  dialCode={form.dialCode}
                  number={form.phoneNumber}
                  onDialChange={(code) => setForm(f => ({ ...f, dialCode: code }))}
                  onNumberChange={(n) => setForm(f => ({ ...f, phoneNumber: n }))}
                />
                <p className="text-xs text-gray-400 mt-1">Pour recevoir le lien de connexion sur WhatsApp</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all bg-gradient-to-r ${webinar.gradient} hover:opacity-90 active:scale-95 disabled:opacity-60`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <><CheckCircle className="w-4 h-4" /> Confirmer ma pré-inscription</>
              )}
            </button>

            <p className="text-xs text-center text-gray-400">
              Aucun paiement maintenant — vous recevrez les instructions par email.
            </p>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-500" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Pré-inscription confirmée 🎉</h4>
            <p className="text-sm text-gray-600 mb-1">Vous êtes sur la liste pour :</p>
            <p className="text-sm font-semibold text-gray-800 mb-4">{webinar.title}</p>
            {earlyBird && (
              <div className="bg-amber-50 rounded-xl px-4 py-2 mb-4 inline-block">
                <p className="text-sm font-bold text-amber-700">Tarif réservé : {formatPrice(effectivePrice)}</p>
              </div>
            )}
            <p className="text-xs text-gray-500 mb-6">
              Un email de confirmation vous a été envoyé avec les étapes de paiement et le lien de connexion.
            </p>
            <button onClick={() => onClose(true)} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── WebinarCard ──────────────────────────────────────────────────────────────

const WebinarCard: React.FC<{ webinar: Webinar; onRegister: (w: Webinar) => void; isFirst: boolean; count: number }> = ({
  webinar, onRegister, isFirst, count,
}) => {
  const earlyBird = count < EARLY_BIRD_SEATS;
  const discountedPrice = webinar.price * (1 - webinar.discountPercent / 100);
  const isMultiDay = new Date(webinar.date).toDateString() !== new Date(webinar.endDate).toDateString();

  return (
    <div className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
      isFirst ? 'border-blue-200 shadow-md' : 'border-gray-200 shadow-sm'
    }`}>
      {webinar.badge && (
        <div className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${webinar.gradient}`}>
          {webinar.badge}
        </div>
      )}

      <div className={`h-1.5 w-full bg-gradient-to-r ${webinar.gradient}`} />

      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {webinar.theme.split('•').map(t => (
            <span key={t} className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
              {t.trim()}
            </span>
          ))}
        </div>

        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{webinar.title}</h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">{webinar.tagline}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {isMultiDay ? (
              <span>{formatDateShort(webinar.date)} & {formatDateShort(webinar.endDate)}</span>
            ) : (
              <span>{formatDate(webinar.date)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{formatTime(webinar.date)} — {webinar.duration} de formation live</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{webinar.speakers}</span>
          </div>
        </div>

        <div className="mb-4">
          <EarlyBirdSeatsIndicator count={count} fullPrice={webinar.price} />
        </div>

        {(() => {
          const remaining = MAX_SEATS - count;
          const pct = Math.min(100, Math.round((count / MAX_SEATS) * 100));
          const urgent = remaining <= 15;
          return (
            <div className={`mb-3 rounded-xl border px-3 py-2 ${urgent ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${urgent ? 'text-red-700' : 'text-emerald-700'}`}>
                  <Users className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{count} / {MAX_SEATS} places réservées</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgent ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {urgent ? `⚠ ${remaining} restantes` : `${remaining} disponibles`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${urgent ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}

        <div className="flex items-center justify-between gap-3">
          <div>
            {earlyBird ? (
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-gray-900">{formatPrice(discountedPrice)}</span>
                  <span className="text-xs font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">-50%</span>
                </div>
                <span className="text-xs text-gray-400 line-through">{formatPrice(webinar.price)}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900">{formatPrice(webinar.price)}</span>
            )}
          </div>

          <button
            onClick={() => onRegister(webinar)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${webinar.gradient} hover:opacity-90 active:scale-95 transition-all flex-shrink-0`}
          >
            Je m'inscris
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── WebinarSection — composant principal ─────────────────────────────────────

const WebinarSection: React.FC = () => {
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/webinars/counts`)
      .then((r) => r.json())
      .then((d) => { if (d?.data) setCounts(d.data); })
      .catch(() => {});
  }, []);

  const handleRegister = useCallback((w: Webinar) => setSelectedWebinar(w), []);
  const handleClose = useCallback((registered?: boolean) => {
    if (registered && selectedWebinar) {
      setCounts((prev) => ({ ...prev, [selectedWebinar.id]: (prev[selectedWebinar.id] ?? 0) + 1 }));
    }
    setSelectedWebinar(null);
  }, [selectedWebinar]);

  return (
    <>
      <section className="mt-12 mb-4">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Formation Live</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              Approfondissez avec nos webinaires d'experts
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Sessions live animées par des analystes et experts de marché Afribourse.
              Places limitées — tarif préférentiel pour les 3 premiers jours.
            </p>
          </div>

          <div className="flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl px-4 py-3 text-center hidden sm:block">
            <div className="text-2xl font-black leading-none">50</div>
            <div className="text-xs font-semibold opacity-80 mt-0.5">places<br />par session</div>
          </div>
        </div>

        {/* Bandeau Investisseur+ */}
        <div className="mb-5 flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl px-4 py-3.5">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-400 p-2 rounded-xl flex-shrink-0">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-yellow-800">
              Abonnés Investisseur+ — 2 webinaires offerts 🎁
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Votre abonnement inclut l'accès gratuit à 2 sessions de votre choix. Mentionnez-le lors de votre pré-inscription.
            </p>
          </div>
          <a
            href="/subscriptions"
            className="flex-shrink-0 text-xs font-bold text-orange-600 hover:text-orange-800 underline underline-offset-2 transition-colors hidden sm:block"
          >
            Devenir Investisseur+
          </a>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {WEBINARS.map((w, i) => (
            <WebinarCard key={w.id} webinar={w} onRegister={handleRegister} isFirst={i === 0} count={counts[w.id] ?? 0} />
          ))}
        </div>

        {/* Note bas de section */}
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <Tag className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            La réduction de 50% est réservée aux pré-inscrits dans les 72h suivant l'ouverture des inscriptions.
            Aucun paiement immédiat requis à la pré-inscription.
          </span>
        </div>
      </section>

      {selectedWebinar && (
        <RegistrationModal webinar={selectedWebinar} count={counts[selectedWebinar.id] ?? 0} onClose={handleClose} />
      )}

    </>
  );
};

export default WebinarSection;
