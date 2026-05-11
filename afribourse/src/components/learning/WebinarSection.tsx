// src/components/learning/WebinarSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Users, Zap, ChevronRight, CheckCircle,
  Flame, Video, Tag, X, Loader2, Star, TrendingUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, authFetch } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

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

interface Countdown {
  days: number; hours: number; minutes: number; seconds: number;
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

function getCountdown(targetIso: string): Countdown {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function isEarlyBirdActive(deadline: string): boolean {
  return new Date(deadline).getTime() > Date.now();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// ─── CountdownBadge ────────────────────────────────────────────────────────────

const CountdownBadge: React.FC<{ deadline: string }> = ({ deadline }) => {
  const [cd, setCd] = useState<Countdown>(getCountdown(deadline));

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(deadline)), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  if (!isEarlyBirdActive(deadline)) return null;

  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex-wrap">
      <Flame className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
      <span className="text-xs font-semibold text-amber-700">Offre -50% expire dans</span>
      <div className="flex items-center gap-1 font-mono">
        {cd.days > 0 && (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded">{pad(cd.days)}j</span>
        )}
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded">{pad(cd.hours)}h</span>
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded">{pad(cd.minutes)}m</span>
        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-1.5 py-0.5 rounded">{pad(cd.seconds)}s</span>
      </div>
    </div>
  );
};

// ─── Modal de pré-inscription ─────────────────────────────────────────────────

const RegistrationModal: React.FC<{ webinar: Webinar; onClose: () => void }> = ({ webinar, onClose }) => {
  const { userProfile } = useAuth();
  const earlyBird = isEarlyBirdActive(webinar.earlyBirdDeadline);
  const effectivePrice = earlyBird ? webinar.price * (1 - webinar.discountPercent / 100) : webinar.price;

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: (userProfile as any)?.profile?.full_name || (userProfile as any)?.profile?.username || '',
    email: (userProfile as any)?.email || '',
    phone: '',
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
          phone: form.phone.trim() || undefined,
          earlyBird,
          effectivePrice,
        }),
      });
      if (!res.ok && res.status !== 409) throw new Error();
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
            {earlyBird && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Tarif early-bird : {formatPrice(effectivePrice)}
                    <span className="ml-2 text-xs font-normal line-through text-amber-400">
                      {formatPrice(webinar.price)}
                    </span>
                  </p>
                  <p className="text-xs text-amber-600">-50% valable pendant les 3 premiers jours</p>
                </div>
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
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+225 07 00 00 00 00"
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
            <button onClick={onClose} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── WebinarCard ──────────────────────────────────────────────────────────────

const WebinarCard: React.FC<{ webinar: Webinar; onRegister: (w: Webinar) => void; isFirst: boolean }> = ({
  webinar, onRegister, isFirst,
}) => {
  const earlyBird = isEarlyBirdActive(webinar.earlyBirdDeadline);
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

        {earlyBird && (
          <div className="mb-4">
            <CountdownBadge deadline={webinar.earlyBirdDeadline} />
          </div>
        )}

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

  const handleRegister = useCallback((w: Webinar) => setSelectedWebinar(w), []);
  const handleClose = useCallback(() => setSelectedWebinar(null), []);

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
            <div className="text-2xl font-black leading-none">3</div>
            <div className="text-xs font-semibold opacity-80 mt-0.5">sessions<br />planifiées</div>
          </div>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {WEBINARS.map((w, i) => (
            <WebinarCard key={w.id} webinar={w} onRegister={handleRegister} isFirst={i === 0} />
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
        <RegistrationModal webinar={selectedWebinar} onClose={handleClose} />
      )}
    </>
  );
};

export default WebinarSection;
