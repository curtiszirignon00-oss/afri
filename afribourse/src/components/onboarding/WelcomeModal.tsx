import { createPortal } from 'react-dom';
import { BookOpen, Brain, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingGuideContext } from '../../context/OnboardingGuideContext';

const STEPS = [
  {
    icon: BookOpen,
    title: 'Lire ton premier cours',
    sub: 'Module 1 · 5 min',
  },
  {
    icon: Brain,
    title: 'Valider le quiz',
    sub: 'Teste tes connaissances',
  },
  {
    icon: TrendingUp,
    title: 'Faire ton premier achat simulé',
    sub: 'Sans aucun risque financier',
  },
];

export default function WelcomeModal() {
  const { userProfile } = useAuth();
  const { showWelcome, dismissWelcome } = useOnboardingGuideContext();
  const navigate = useNavigate();

  if (!showWelcome) return null;

  const firstName = userProfile?.name ?? null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,22,40,0.7)', animation: 'ob-fadeIn 0.25s ease-out' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: 'ob-scaleIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div
          className="relative p-6 text-center"
          style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1a3a5c 100%)' }}
        >
          <button
            onClick={dismissWelcome}
            className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-5xl mb-3">🎉</div>

          <h2 className="text-xl font-bold text-white mb-1">
            {firstName ? `Bienvenue, ${firstName} !` : 'Bienvenue sur AfriBourse !'}
          </h2>
          <p className="text-sm text-white/70">
            Voici 3 actions pour bien démarrer ton aventure BRVM
          </p>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: '#00D4A8' }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.sub}</p>
                </div>
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={() => { dismissWelcome(); navigate('/learn'); }}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#00D4A8' }}
          >
            Commencer mon parcours →
          </button>
          <button
            onClick={dismissWelcome}
            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Je verrai ça plus tard
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ob-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ob-scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
