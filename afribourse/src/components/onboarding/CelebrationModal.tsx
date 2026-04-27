import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingGuideContext } from '../../context/OnboardingGuideContext';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    emoji: '🎓',
    title: 'Académie',
    desc: 'Continue ton apprentissage — de débutant à avancé. Chaque cours débloque des XP.',
  },
  {
    emoji: '📈',
    title: 'Simulation de marché',
    desc: 'Achète, vends, et suis tes positions en temps réel avec ta monnaie virtuelle.',
  },
  {
    emoji: '🤖',
    title: 'SIMBA — Ton IA',
    desc: 'Pose toutes tes questions sur la BRVM à SIMBA, ton assistant IA personnel.',
  },
  {
    emoji: '⚡',
    title: 'Signal Score',
    desc: 'Consulte le score composite 0–100 de chaque action BRVM.',
  },
  {
    emoji: '💼',
    title: 'Portefeuille',
    desc: 'Suis ton portefeuille simulé, ta performance par secteur, et compare-toi à la communauté.',
  },
  {
    emoji: '👥',
    title: 'Communauté',
    desc: 'Partage tes analyses et participe aux challenges hebdomadaires.',
  },
  {
    emoji: '🧬',
    title: 'Profil Investisseur',
    desc: 'Ton ADN Investisseur établit ton profil et te suggère des secteurs alignés avec ta stratégie.',
  },
];

const ACTIONS_DONE = [
  'Tu as lu ton premier cours',
  'Tu as validé le quiz du Module 1',
  'Tu as réalisé ton premier achat simulé',
];

export default function CelebrationModal() {
  const { userProfile } = useAuth();
  const { isComplete, forceHideChecklist } = useOnboardingGuideContext();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isComplete) return;
    const t = setTimeout(() => {
      setVisible(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00D4A8', '#0A1628', '#ffffff', '#fbbf24'],
      });
    }, 800);
    return () => clearTimeout(t);
  }, [isComplete]);

  const handleClose = () => {
    setVisible(false);
    forceHideChecklist();
  };

  const handleExplore = () => {
    handleClose();
    navigate('/dashboard');
  };

  if (!visible) return null;

  const firstName = userProfile?.name ?? null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(10,22,40,0.75)', animation: 'ob-fadeIn 0.25s ease-out' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4"
        style={{ animation: 'ob-scaleIn 0.3s ease-out' }}
      >
        {/* Header */}
        <div
          className="relative p-6 text-center rounded-t-2xl"
          style={{ background: 'linear-gradient(135deg, #0A1628 0%, #00D4A8 100%)' }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {firstName ? `Félicitations, ${firstName} !` : 'Félicitations !'}
          </h2>
          <p className="text-sm text-white/80">
            Tu fais maintenant partie de la communauté AfriBourse.
          </p>
        </div>

        {/* Actions accomplies */}
        <div className="px-6 pt-5 pb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ce que tu as accompli</p>
          <ul className="space-y-2">
            {ACTIONS_DONE.map((action, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#00D4A8' }}
                >
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
                {action}
              </li>
            ))}
          </ul>
        </div>

        {/* Fonctionnalités */}
        <div className="px-6 pb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ce que tu peux faire</p>
          <div className="grid grid-cols-1 gap-2">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-lg flex-shrink-0">{f.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={handleExplore}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#00D4A8' }}
          >
            Explorer le dashboard
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ob-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ob-scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
