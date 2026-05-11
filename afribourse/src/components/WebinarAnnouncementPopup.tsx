import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Flame, Star, TrendingUp, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

// Versionné — incrémenter pour forcer le re-affichage sur tous les comptes
const POPUP_KEY = 'afb_webinar_announcement_v1';

const EARLY_BIRD_SEATS = 20;
const MAX_SEATS = 50;

const WEBINARS = [
  {
    id: 'w1-fondamentaux',
    title: 'Maîtriser les fondamentaux',
    date: '2026-05-23T09:00:00Z',
    price: 5000,
    discountPercent: 50,
    gradient: 'from-blue-600 to-indigo-600',
    icon: Star,
    badge: 'Débutant',
  },
  {
    id: 'w2-fondamentale',
    title: 'Analyse fondamentale',
    date: '2026-05-30T09:00:00Z',
    price: 10000,
    discountPercent: 50,
    gradient: 'from-emerald-600 to-teal-600',
    icon: TrendingUp,
    badge: 'Intermédiaire',
  },
  {
    id: 'w3-technique',
    title: 'Analyse technique',
    date: '2026-06-06T09:00:00Z',
    price: 10000,
    discountPercent: 50,
    gradient: 'from-orange-500 to-rose-600',
    icon: Flame,
    badge: 'Avancé',
  },
];

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export default function WebinarAnnouncementPopup() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Determine visibility — only once per version key
  useEffect(() => {
    if (!isLoggedIn) return;
    const dismissed = localStorage.getItem(POPUP_KEY);
    if (dismissed) return;

    // Delay slightly so the page finishes loading first
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, [isLoggedIn]);

  // Fetch seat counts for urgency display
  useEffect(() => {
    if (!visible) return;
    fetch(`${API_BASE_URL}/webinars/counts`)
      .then((r) => r.json())
      .then((d) => { if (d?.data) setCounts(d.data); })
      .catch(() => {});
  }, [visible]);

  const dismiss = () => {
    localStorage.setItem(POPUP_KEY, '1');
    setVisible(false);
  };

  const goToWebinars = () => {
    dismiss();
    navigate('/webinaires');
  };

  if (!visible) return null;

  const w1Count = counts['w1-fondamentaux'] ?? 0;
  const earlyBirdActive = w1Count < EARLY_BIRD_SEATS;
  const earlyBirdRemaining = Math.max(0, EARLY_BIRD_SEATS - w1Count);
  const totalTaken = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Annonce webinaires Afribourse"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 text-white/70 hover:text-white transition-colors p-1"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 px-6 pt-6 pb-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-500/30 border border-blue-400/40 text-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
              Annonce
            </span>
            <span className="text-blue-300 text-[10px] font-medium">Formation live · BRVM</span>
          </div>
          <h2 className="text-xl font-extrabold leading-snug mb-1">
            Nos webinaires de formation arrivent ! 🎓
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            3 sessions live avec nos experts marchés et analystes Afribourse.
            Places limitées — les <strong className="text-white">20 premiers</strong> bénéficient d'un tarif réduit de 50%.
          </p>

          {/* Urgence early bird */}
          {earlyBirdActive && (
            <div className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 ${earlyBirdRemaining <= 5 ? 'bg-red-500/20 border border-red-400/30' : 'bg-amber-500/20 border border-amber-400/30'}`}>
              <Flame className={`w-3.5 h-3.5 flex-shrink-0 animate-pulse ${earlyBirdRemaining <= 5 ? 'text-red-300' : 'text-amber-300'}`} />
              <span className={`text-xs font-bold ${earlyBirdRemaining <= 5 ? 'text-red-200' : 'text-amber-200'}`}>
                {earlyBirdRemaining <= 5
                  ? `⚠ Plus que ${earlyBirdRemaining} place${earlyBirdRemaining > 1 ? 's' : ''} à tarif réduit !`
                  : `Il reste ${earlyBirdRemaining} places à tarif réduit sur ${EARLY_BIRD_SEATS}`}
              </span>
            </div>
          )}
        </div>

        {/* Webinar list */}
        <div className="px-6 py-4 space-y-2.5">
          {WEBINARS.map((w) => {
            const Icon = w.icon;
            const discountedPrice = w.price * (1 - w.discountPercent / 100);
            const wCount = counts[w.id] ?? 0;
            const wEarlyBird = wCount < EARLY_BIRD_SEATS;
            const wRemaining = MAX_SEATS - wCount;
            return (
              <div
                key={w.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${w.gradient} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{w.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500">{formatDateShort(w.date)}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{w.badge}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {wEarlyBird ? (
                    <>
                      <p className="text-sm font-bold text-gray-900">{discountedPrice.toLocaleString('fr-FR')} XOF</p>
                      <p className="text-[10px] text-gray-400 line-through">{w.price.toLocaleString('fr-FR')}</p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-gray-900">{w.price.toLocaleString('fr-FR')} XOF</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total registered + guarantee */}
        <div className="px-6 pb-2 flex items-center gap-4">
          {totalTaken > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span><strong className="text-gray-700">{totalTaken}</strong> personnes déjà préinscrites</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 ml-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="font-medium">Satisfait ou remboursé</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="px-6 pb-6 pt-3 flex gap-3">
          <button
            onClick={goToWebinars}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95"
          >
            Voir les webinaires →
          </button>
          <button
            onClick={dismiss}
            className="px-4 py-3 border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm rounded-xl transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
