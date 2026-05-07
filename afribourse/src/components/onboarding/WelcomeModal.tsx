import { createPortal } from 'react-dom';
import { BookOpen, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingGuideContext } from '../../context/OnboardingGuideContext';
import { useUserProfile } from '../../hooks/useApi';

const PROFILE_META: Record<string, { label: string; emoji: string; goal: string }> = {
  apprenti:    { label: "L'Apprenti",      emoji: '📚', goal: 'apprendre les bases de la BRVM' },
  decideur:    { label: 'Le Décideur',     emoji: '💼', goal: 'prendre des décisions éclairées' },
  investisseur:{ label: "L'Investisseur",  emoji: '📈', goal: 'faire fructifier ton capital' },
  explorateur: { label: "L'Explorateur",   emoji: '🌍', goal: 'explorer les marchés africains' },
};

export default function WelcomeModal() {
  const { userProfile: authProfile } = useAuth();
  const { data: fullProfile } = useUserProfile();
  const { showWelcome, dismissWelcome } = useOnboardingGuideContext();
  const navigate = useNavigate();

  if (!showWelcome) return null;

  const firstName = authProfile?.name?.split(' ')[0] ?? null;
  const profileType = fullProfile?.profile_type ?? null;
  const meta = profileType ? PROFILE_META[profileType] ?? null : null;
  const goalLabel = meta?.goal ?? null;
  const profileLabel = meta ? `${meta.emoji} ${meta.label}` : null;

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
            {goalLabel
              ? `Tu veux ${goalLabel} — on t'y aide pas à pas.`
              : 'Voici 2 actions pour bien démarrer ton aventure BRVM'}
          </p>

          {/* Profile badge */}
          {profileLabel && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'rgba(0,212,168,0.15)', color: '#00D4A8', border: '1px solid rgba(0,212,168,0.4)' }}>
              Profil {profileLabel}
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="p-6 space-y-3">
          {/* Step 1 — Module */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: '#00D4A8' }}
            >
              1
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Terminer un module</p>
              <p className="text-xs text-gray-500 mt-0.5">8 min · Quiz · <span className="font-semibold" style={{ color: '#00D4A8' }}>+50 XP</span></p>
            </div>
            <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>

          {/* Step 2 — Achat simulé */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: '#00D4A8' }}
            >
              2
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Faire ton premier achat simulé</p>
              <p className="text-xs text-gray-500 mt-0.5">Sans aucun risque financier</p>
            </div>
            <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={() => { dismissWelcome(); navigate('/learn'); }}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#00D4A8' }}
          >
            Commencer avec SIMBA →
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
