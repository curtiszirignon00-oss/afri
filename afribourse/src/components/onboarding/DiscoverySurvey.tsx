// src/components/onboarding/DiscoverySurvey.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, SkipForward, CheckCircle2 } from 'lucide-react';
import { useDiscoverySurvey } from '../../hooks/useOnboarding';

// ─── Types ────────────────────────────────────────────────────────────────────

type Q1Answer = 'A' | 'B' | 'C' | 'D';
type Q2Answer = 'A' | 'B' | 'C' | 'D' | 'E' | null;
type Q3Answer = 'A' | 'B' | 'C' | 'D';
type ProfileType = 'apprenti' | 'decideur' | 'investisseur' | 'explorateur';

interface ProfileResult {
  profile_type: ProfileType;
  urgency: string;
  survey_completed: boolean;
}

// ─── Profile meta ─────────────────────────────────────────────────────────────

const PROFILE_META: Record<ProfileType, {
  label: string;
  emoji: string;
  gradient: string;
  description: string;
}> = {
  apprenti: {
    label: 'L\'Apprenti',
    emoji: '📚',
    gradient: 'from-teal-500 to-emerald-600',
    description: 'Tu es en train de construire tes bases. AfriBourse t\'accompagnera pas à pas dans la compréhension des marchés africains.',
  },
  decideur: {
    label: 'Le Décideur',
    emoji: '💼',
    gradient: 'from-amber-500 to-orange-600',
    description: 'Tu as une vision claire et prends des décisions stratégiques. AfriBourse t\'apportera les données et analyses dont tu as besoin.',
  },
  investisseur: {
    label: 'L\'Investisseur',
    emoji: '📈',
    gradient: 'from-violet-500 to-purple-600',
    description: 'Tu es focalisé sur la croissance de ton capital. AfriBourse te donnera les outils pour optimiser tes positions sur la BRVM.',
  },
  explorateur: {
    label: 'L\'Explorateur',
    emoji: '🌍',
    gradient: 'from-blue-500 to-cyan-600',
    description: 'Tu découvres les marchés africains avec curiosité. AfriBourse est la meilleure plateforme pour commencer cette aventure.',
  },
};

// ─── Questions ────────────────────────────────────────────────────────────────

const Q1_OPTIONS = [
  { value: 'A' as Q1Answer, label: 'Apprendre les bases de la bourse', icon: '📚' },
  { value: 'B' as Q1Answer, label: 'Prendre des décisions d\'investissement éclairées', icon: '💡' },
  { value: 'C' as Q1Answer, label: 'Investir et faire fructifier mon capital', icon: '📈' },
  { value: 'D' as Q1Answer, label: 'Explorer les marchés africains', icon: '🌍' },
];

const Q2_OPTIONS = [
  { value: 'A' as Q2Answer, label: 'Aucune expérience' },
  { value: 'B' as Q2Answer, label: 'Quelques notions de base' },
  { value: 'C' as Q2Answer, label: 'Expérience intermédiaire' },
  { value: 'D' as Q2Answer, label: 'Expérimenté(e)' },
  { value: 'E' as Q2Answer, label: 'Expert(e) / Professionnel(le)' },
];

const Q3_OPTIONS = [
  { value: 'A' as Q3Answer, label: 'Dans moins d\'un an', sub: 'Horizon court terme' },
  { value: 'B' as Q3Answer, label: 'Dans 1 à 3 ans', sub: 'Horizon moyen terme' },
  { value: 'C' as Q3Answer, label: 'Dans plus de 3 ans', sub: 'Horizon long terme' },
  { value: 'D' as Q3Answer, label: 'Je ne sais pas encore', sub: 'Pas de contrainte' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface DiscoverySurveyProps {
  onComplete?: () => void;
}

export default function DiscoverySurvey({ onComplete }: DiscoverySurveyProps) {
  const navigate = useNavigate();
  const { mutateAsync: submitSurvey, isPending } = useDiscoverySurvey();

  const [step, setStep] = useState<1 | 2 | 3 | 'result'>(1);
  const [q1, setQ1] = useState<Q1Answer | null>(null);
  const [q2, setQ2] = useState<Q2Answer>(null);
  const [q3, setQ3] = useState<Q3Answer | null>(null);
  const [result, setResult] = useState<ProfileResult | null>(null);

  async function handleQ3Select(answer: Q3Answer) {
    setQ3(answer);
    try {
      const data = await submitSurvey({ q1: q1!, q2, q3: answer });
      setResult(data);
      setStep('result');
    } catch {
      // On submit error, still proceed to result with local data
      const profileMap: Record<string, ProfileType> = { A: 'apprenti', B: 'decideur', C: 'investisseur', D: 'explorateur' };
      setResult({
        profile_type: profileMap[q1!] as ProfileType,
        urgency: 'unknown',
        survey_completed: true,
      });
      setStep('result');
    }
  }

  function handleGoToDashboard() {
    // Signal the onboarding guide to activate on the next page
    sessionStorage.setItem('onboarding_guide_start', '1');
    if (onComplete) {
      onComplete();
    } else {
      navigate('/dashboard');
    }
  }

  // ─── Result screen ────────────────────────────────────────────────────────

  if (step === 'result' && result) {
    const meta = PROFILE_META[result.profile_type];
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Profile card */}
          <div className={`bg-gradient-to-br ${meta.gradient} rounded-3xl p-8 text-white text-center mb-6`}>
            <div className="text-6xl mb-4">{meta.emoji}</div>
            <p className="text-white/80 text-sm uppercase tracking-widest mb-1">Votre profil</p>
            <h2 className="text-3xl font-bold mb-4">{meta.label}</h2>
            <p className="text-white/90 text-sm leading-relaxed">{meta.description}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Profil créé avec succès !</h3>
            <p className="text-sm text-gray-500 mb-6">
              AfriBourse personnalisera votre expérience selon votre profil <strong>{meta.label}</strong>.
            </p>
            <button
              onClick={handleGoToDashboard}
              className={`w-full py-3.5 bg-gradient-to-r ${meta.gradient} text-white rounded-xl font-semibold flex items-center justify-center gap-2`}
            >
              Accéder à mon dashboard
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Survey steps ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-xs font-medium text-blue-700">
              Question {step === 1 ? '1' : step === 2 ? '2' : '3'} sur 3
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenue sur AfriBourse</h1>
          <p className="text-gray-500 text-sm">3 questions rapides pour personnaliser votre expérience</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                (step === 'result' || (typeof step === 'number' && i < step) || (typeof step === 'number' && i === step))
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Q1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Quel est votre objectif principal ?</h2>
            <p className="text-sm text-gray-500 mb-6">Cela nous permettra de personnaliser votre expérience sur AfriBourse.</p>
            <div className="space-y-3">
              {Q1_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setQ1(opt.value); setStep(2); }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="font-medium text-gray-800 group-hover:text-blue-700">{opt.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q2 — optional */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-gray-900">Votre niveau en bourse ?</h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Optionnel</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">Cette question est facultative. Vous pouvez passer directement.</p>
            <div className="space-y-2.5 mb-4">
              {Q2_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setQ2(opt.value); setStep(3); }}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                >
                  <span className="font-medium text-gray-800 group-hover:text-blue-700">{opt.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
            <button
              onClick={() => { setQ2(null); setStep(3); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              Passer cette question
            </button>
          </div>
        )}

        {/* Q3 */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Quand comptez-vous utiliser ces fonds ?</h2>
            <p className="text-sm text-gray-500 mb-6">Votre horizon d'investissement nous aide à adapter votre profil.</p>
            <div className="space-y-3">
              {Q3_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleQ3Select(opt.value)}
                  disabled={isPending}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group disabled:opacity-50"
                >
                  <div>
                    <p className="font-medium text-gray-800 group-hover:text-blue-700">{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
            {isPending && (
              <p className="text-center text-sm text-gray-400 mt-4 animate-pulse">Création de votre profil...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
