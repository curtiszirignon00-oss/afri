import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingGuideContext } from '../../context/OnboardingGuideContext';
import { useNavigate } from 'react-router-dom';

const ACTIONS_DONE = [
  'Tu as terminé ton premier module',
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

  if (!visible) return null;

  const firstName = userProfile?.name?.split(' ')[0] ?? null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(10,22,40,0.75)', animation: 'ob-fadeIn 0.25s ease-out' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4"
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

        {/* Badge débloqué */}
        <div className="px-6 pb-4">
          <div
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{ backgroundColor: 'rgba(0,212,168,0.06)', borderColor: 'rgba(0,212,168,0.3)' }}
          >
            <span className="text-2xl flex-shrink-0">🎖️</span>
            <div>
              <p className="text-sm font-bold text-gray-900">Badge débloqué : <span style={{ color: '#00D4A8' }}>Éveillé BRVM</span></p>
              <p className="text-xs text-gray-500 mt-0.5">Tu as les bases pour investir intelligemment</p>
            </div>
          </div>
        </div>

        {/* Prochaine étape */}
        <div className="px-6 pb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prochaine étape</p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: '#0A1628' }}
            >
              2
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Module 2 — Lire les marchés</p>
              <p className="text-xs text-gray-500 mt-0.5">Analyse technique · <span className="font-semibold" style={{ color: '#00D4A8' }}>+75 XP</span></p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={() => { handleClose(); navigate('/learn'); }}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#00D4A8' }}
          >
            Continuer avec SIMBA →
          </button>
          <button
            onClick={() => { handleClose(); navigate('/dashboard'); }}
            className="w-full py-2.5 rounded-xl font-semibold text-sm transition-colors border border-gray-200 text-gray-700 hover:bg-gray-50"
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
