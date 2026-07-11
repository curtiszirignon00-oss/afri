import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShieldCheck, Users, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Versionné — incrémenter pour forcer le re-affichage sur tous les comptes
const POPUP_KEY = 'afb_webinar_announcement_v4';

const PACKS = [
  {
    id: 'starter',
    label: 'Starter',
    emoji: '🌱',
    price: 35000,
    installmentAmount: 12000,
    gradient: 'from-blue-600 to-indigo-700',
    popular: false,
    summary: '5 webinaires live W1→W5 · Certificat · Communauté',
  },
  {
    id: 'parcours',
    label: 'Parcours',
    emoji: '⭐',
    price: 50000,
    installmentAmount: 17000,
    gradient: 'from-violet-600 to-purple-700',
    popular: true,
    summary: 'Starter + W6 (portefeuille) · W7 (risque) · Q&A live mensuel',
  },
  {
    id: 'investisseur',
    label: 'Investisseur',
    emoji: '🏆',
    price: 75000,
    installmentAmount: 26000,
    gradient: 'from-amber-500 to-orange-600',
    popular: false,
    summary: 'Parcours + W8 · Appel 1:1 Curtis · IPS personnalisé',
  },
];

function formatPrice(n: number) {
  return n.toLocaleString('fr-FR') + ' XOF';
}

export default function WebinarAnnouncementPopup() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    const dismissed = localStorage.getItem(POPUP_KEY);
    if (dismissed) return;
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, [isLoggedIn]);

  const dismiss = () => {
    localStorage.setItem(POPUP_KEY, '1');
    setVisible(false);
  };

  const goToWebinars = () => {
    dismiss();
    navigate('/webinaires');
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Annonce webinaires Afribourse"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">

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
              Cohorte Juillet 2026
            </span>
            <span className="text-blue-300 text-[10px] font-medium">Formation live · BRVM</span>
          </div>
          <h2 className="text-xl font-extrabold leading-snug mb-1">
            Formation investissement BRVM 🎓
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            3 niveaux disponibles — du <strong className="text-white">Starter (35 000 XOF)</strong> à
            l'<strong className="text-white">Investisseur (75 000 XOF)</strong>.
            1ère session le <strong className="text-white">samedi 4 juillet</strong>.
          </p>
        </div>

        {/* 3 packs */}
        <div className="px-5 py-4 space-y-2.5">
          {PACKS.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                p.popular ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
              }`}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center text-base`}>
                {p.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-extrabold ${p.popular ? 'text-violet-800' : 'text-gray-800'}`}>{p.label}</p>
                  {p.popular && (
                    <span className="bg-violet-100 text-violet-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                      Populaire
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 leading-snug truncate">{p.summary}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-extrabold ${p.popular ? 'text-violet-800' : 'text-gray-900'}`}>{formatPrice(p.price)}</p>
                <p className="text-[10px] text-gray-400">ou {formatPrice(p.installmentAmount)}/mois</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pied de card */}
        <div className="px-5 pb-2 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span>Places limitées · 50 par session</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 ml-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="font-medium">Satisfait ou remboursé</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="px-5 pb-5 pt-3 flex gap-3">
          <button
            onClick={goToWebinars}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4" />
            Voir les offres →
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
