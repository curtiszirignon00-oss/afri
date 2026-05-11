import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Flame, ChevronRight, Video, Zap, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, authFetch } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

const EARLY_BIRD_SEATS = 20;
const MAX_SEATS = 50;

// ─── Indicatifs pays (UEMOA + courants) ──────────────────────────────────────

const DIAL_CODES = [
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: '+245', flag: '🇬🇼', name: 'Guinée-Bissau' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+234', flag: '🇳🇬', name: 'Nigéria' },
  { code: '+243', flag: '🇨🇩', name: 'RD Congo' },
  { code: '+212', flag: '🇲🇦', name: 'Maroc' },
  { code: '+213', flag: '🇩🇿', name: 'Algérie' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+32',  flag: '🇧🇪', name: 'Belgique' },
  { code: '+41',  flag: '🇨🇭', name: 'Suisse' },
  { code: '+1',   flag: '🇺🇸', name: 'États-Unis / Canada' },
];

// ─── Données partagées (prochain webinaire uniquement) ────────────────────────

const NEXT_WEBINAR = {
  id: 'w1-fondamentaux',
  title: 'Maîtriser les fondamentaux de la bourse',
  tagline: 'De zéro à investisseur en une session',
  date: '2026-05-23T09:00:00Z',
  endDate: '2026-05-23T12:00:00Z',
  price: 5000,
  discountPercent: 50,
  duration: '3H',
  gradient: 'from-blue-600 to-indigo-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long',
  });
}

// ─── Mini modal d'inscription rapide ─────────────────────────────────────────

const QuickRegisterModal: React.FC<{ registeredCount: number; onClose: () => void }> = ({ registeredCount, onClose }) => {
  const { userProfile } = useAuth();
  const [form, setForm] = useState({
    name: (userProfile as any)?.profile?.full_name || (userProfile as any)?.profile?.username || '',
    email: (userProfile as any)?.email || '',
    dialCode: '+225',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const earlyBird = registeredCount < EARLY_BIRD_SEATS;
  const remaining = Math.max(0, EARLY_BIRD_SEATS - registeredCount);
  const effectivePrice = earlyBird
    ? NEXT_WEBINAR.price * (1 - NEXT_WEBINAR.discountPercent / 100)
    : NEXT_WEBINAR.price;

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
          webinarId: NEXT_WEBINAR.id,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phoneNumber.trim() ? `${form.dialCode} ${form.phoneNumber.trim()}` : undefined,
        }),
      });
      if (!res.ok && res.status !== 200) throw new Error();
      setDone(true);
    } catch {
      toast.error('Erreur lors de la préinscription. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-r ${NEXT_WEBINAR.gradient} p-5 text-white`}>
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide opacity-80">Webinaire · Live</span>
          </div>
          <h3 className="font-bold text-base leading-tight">{NEXT_WEBINAR.title}</h3>
          <p className="text-blue-200 text-xs mt-1">{formatDate(NEXT_WEBINAR.date)} · {NEXT_WEBINAR.duration}</p>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="font-bold text-gray-900 mb-1">Préinscription confirmée !</p>
            <p className="text-gray-500 text-sm">Vous recevrez les instructions de paiement par email.</p>
            <button onClick={onClose} className="mt-5 w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm">
              Fermer
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {earlyBird ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                <div>
                  <p className="text-xs font-bold text-amber-800">
                    Early bird : {effectivePrice.toLocaleString('fr-FR')} XOF
                    <span className="ml-1 line-through font-normal text-amber-400">{NEXT_WEBINAR.price.toLocaleString('fr-FR')}</span>
                  </p>
                  <p className="text-[10px] text-amber-600">Il reste {remaining} place{remaining > 1 ? 's' : ''} à tarif réduit</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-600">Tarif plein : {NEXT_WEBINAR.price.toLocaleString('fr-FR')} XOF</span>
              </div>
            )}

            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nom complet"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Adresse email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-blue-400 transition-all">
              <select
                value={form.dialCode}
                onChange={(e) => setForm({ ...form, dialCode: e.target.value })}
                className="bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-700 pl-2 pr-1 py-3 focus:outline-none cursor-pointer"
                style={{ minWidth: '88px' }}
                aria-label="Indicatif pays"
              >
                {DIAL_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/[^\d\s\-]/g, '') })}
                placeholder="Numéro (optionnel)"
                className="flex-1 px-3 py-3 text-sm focus:outline-none bg-white placeholder:text-gray-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-2 flex-grow py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                Confirmer ma préinscription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Widget principal ─────────────────────────────────────────────────────────

const DashboardWebinarWidget: React.FC = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const webinarPassed = new Date(NEXT_WEBINAR.date).getTime() < Date.now();

  useEffect(() => {
    fetch(`${API_BASE_URL}/webinars/counts`)
      .then((r) => r.json())
      .then((d) => { if (d?.data?.[NEXT_WEBINAR.id] != null) setCount(d.data[NEXT_WEBINAR.id]); })
      .catch(() => {});
  }, []);

  if (webinarPassed) return null;

  const earlyBirdActive = count < EARLY_BIRD_SEATS;
  const remaining = Math.max(0, EARLY_BIRD_SEATS - count);
  const totalRemaining = Math.max(0, MAX_SEATS - count);
  const effectivePrice = earlyBirdActive
    ? NEXT_WEBINAR.price * (1 - NEXT_WEBINAR.discountPercent / 100)
    : NEXT_WEBINAR.price;

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-blue-100 shadow-sm">
        {/* Header gradient */}
        <div className={`bg-gradient-to-r ${NEXT_WEBINAR.gradient} p-4 text-white`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 opacity-80" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Prochain webinaire</span>
            </div>
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {NEXT_WEBINAR.duration} · Live
            </span>
          </div>
          <h3 className="font-bold text-sm leading-snug">{NEXT_WEBINAR.title}</h3>
          <p className="text-blue-200 text-xs mt-0.5">{NEXT_WEBINAR.tagline}</p>
        </div>

        {/* Body */}
        <div className="bg-white p-4 space-y-3">
          {/* Date */}
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="text-sm font-medium">{formatDate(NEXT_WEBINAR.date)}</span>
            <span className="text-gray-400 text-xs">•</span>
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500">09h00</span>
          </div>

          {/* Prix + early bird */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-gray-900">
                {effectivePrice.toLocaleString('fr-FR')} XOF
              </span>
              {earlyBirdActive && (
                <span className="text-[10px] text-gray-400 line-through">
                  {NEXT_WEBINAR.price.toLocaleString('fr-FR')}
                </span>
              )}
            </div>
            {earlyBirdActive && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                -{NEXT_WEBINAR.discountPercent}% early bird
              </span>
            )}
          </div>

          {/* Urgence places */}
          {earlyBirdActive ? (
            <div className={`flex items-center gap-1.5 rounded-xl px-3 py-2 border ${remaining <= 5 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-100'}`}>
              <Flame className={`w-3.5 h-3.5 flex-shrink-0 animate-pulse ${remaining <= 5 ? 'text-red-500' : 'text-amber-500'}`} />
              <span className={`text-[10px] font-semibold flex-1 ${remaining <= 5 ? 'text-red-700' : 'text-amber-700'}`}>
                {remaining <= 5
                  ? `⚠ Plus que ${remaining} place${remaining > 1 ? 's' : ''} à tarif réduit !`
                  : `Il reste ${remaining} places à tarif réduit`}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${remaining <= 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                {EARLY_BIRD_SEATS - remaining}/{EARLY_BIRD_SEATS}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-[10px] text-gray-500 font-semibold">Places early bird épuisées · tarif plein</span>
            </div>
          )}

          {/* Total seats bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
              <div
                className="h-1 rounded-full bg-blue-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((count / MAX_SEATS) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{totalRemaining} places / {MAX_SEATS}</span>
          </div>

          {/* CTAs */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowModal(true)}
              className="flex-grow py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              Je m'inscris
            </button>
            <button
              onClick={() => navigate('/webinaires')}
              className="px-3 py-2.5 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-600 rounded-xl transition-all flex items-center gap-1"
              title="Voir tous les webinaires"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => navigate('/webinaires')}
            className="w-full text-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Voir les 3 webinaires →
          </button>
        </div>
      </div>

      {showModal && <QuickRegisterModal registeredCount={count} onClose={() => setShowModal(false)} />}
    </>
  );
};

export default DashboardWebinarWidget;
