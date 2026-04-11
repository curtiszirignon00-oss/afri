// src/pages/SurveyPage.tsx
// Page de survey d'onboarding pour les nouveaux utilisateurs — plein écran, sans header.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, SkipForward, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useDiscoverySurvey } from '../hooks/useOnboarding';

// ─── Types ────────────────────────────────────────────────────────────────────

type Q1Answer = 'A' | 'B' | 'C' | 'D';
type Q2Answer = 'A' | 'B' | 'C' | 'D' | 'E' | null;
type Q3Answer = 'A' | 'B' | 'C' | 'D';
type ProfileType = 'apprenti' | 'decideur' | 'investisseur' | 'explorateur';
type Step = 1 | 2 | 3 | 'result';

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
  lightBg: string;
  description: string;
}> = {
  apprenti: {
    label: "L'Apprenti",
    emoji: '📚',
    gradient: 'from-teal-500 to-emerald-600',
    lightBg: 'from-teal-50 to-emerald-50',
    description: "Tu es en train de construire tes bases. AfriBourse t'accompagnera pas à pas dans la compréhension des marchés africains.",
  },
  decideur: {
    label: 'Le Décideur',
    emoji: '💼',
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'from-amber-50 to-orange-50',
    description: "Tu as une vision claire et prends des décisions stratégiques. AfriBourse t'apportera les données et analyses dont tu as besoin.",
  },
  investisseur: {
    label: "L'Investisseur",
    emoji: '📈',
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'from-violet-50 to-purple-50',
    description: "Tu es focalisé sur la croissance de ton capital. AfriBourse te donnera les outils pour optimiser tes positions sur la BRVM.",
  },
  explorateur: {
    label: "L'Explorateur",
    emoji: '🌍',
    gradient: 'from-blue-500 to-cyan-600',
    lightBg: 'from-blue-50 to-cyan-50',
    description: "Tu découvres les marchés africains avec curiosité. AfriBourse est la meilleure plateforme pour commencer cette aventure.",
  },
};

// ─── Questions ────────────────────────────────────────────────────────────────

const Q1_OPTIONS = [
  { value: 'A' as Q1Answer, label: "Apprendre les bases de la bourse", icon: '📚' },
  { value: 'B' as Q1Answer, label: "Prendre des décisions d'investissement éclairées", icon: '💡' },
  { value: 'C' as Q1Answer, label: "Investir et faire fructifier mon capital", icon: '📈' },
  { value: 'D' as Q1Answer, label: "Explorer les marchés africains", icon: '🌍' },
];

const Q2_OPTIONS = [
  { value: 'A' as Q2Answer, label: 'Aucune expérience', sub: 'Je débute complètement' },
  { value: 'B' as Q2Answer, label: 'Quelques notions de base', sub: "J'ai lu quelques articles" },
  { value: 'C' as Q2Answer, label: 'Expérience intermédiaire', sub: "J'ai déjà investi" },
  { value: 'D' as Q2Answer, label: 'Expérimenté(e)', sub: 'Je gère un portefeuille actif' },
  { value: 'E' as Q2Answer, label: 'Expert(e) / Professionnel(le)', sub: 'Finance = mon domaine' },
];

const Q3_OPTIONS = [
  { value: 'A' as Q3Answer, label: "Dans moins d'un an", sub: 'Horizon court terme' },
  { value: 'B' as Q3Answer, label: 'Dans 1 à 3 ans', sub: 'Horizon moyen terme' },
  { value: 'C' as Q3Answer, label: 'Dans plus de 3 ans', sub: 'Horizon long terme' },
  { value: 'D' as Q3Answer, label: 'Je ne sais pas encore', sub: 'Pas de contrainte' },
];

const QUESTIONS = [
  { step: 1, title: 'Quel est votre objectif principal ?', subtitle: "Cela nous permettra de personnaliser votre expérience." },
  { step: 2, title: 'Votre niveau en bourse ?', subtitle: 'Question facultative — vous pouvez passer.' },
  { step: 3, title: 'Quand comptez-vous utiliser ces fonds ?', subtitle: "Votre horizon d'investissement nous aide à adapter votre profil." },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SurveyPage() {
  const navigate = useNavigate();
  const { mutateAsync: submitSurvey, isPending } = useDiscoverySurvey();

  const [step, setStep] = useState<Step>(1);
  const [q1, setQ1] = useState<Q1Answer | null>(null);
  const [q2, setQ2] = useState<Q2Answer>(null);
  const [q3, setQ3] = useState<Q3Answer | null>(null);
  const [result, setResult] = useState<ProfileResult | null>(null);

  const currentStep = typeof step === 'number' ? step : 3;
  const question = QUESTIONS[currentStep - 1];

  async function handleQ3Select(answer: Q3Answer) {
    setQ3(answer);
    try {
      const data = await submitSurvey({ q1: q1!, q2, q3: answer });
      setResult(data);
      setStep('result');
    } catch {
      const profileMap: Record<string, ProfileType> = {
        A: 'apprenti', B: 'decideur', C: 'investisseur', D: 'explorateur',
      };
      setResult({
        profile_type: profileMap[q1!] as ProfileType,
        urgency: 'unknown',
        survey_completed: true,
      });
      setStep('result');
    }
  }

  function handleBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  // ─── Result screen ────────────────────────────────────────────────────────

  if (step === 'result' && result) {
    const meta = PROFILE_META[result.profile_type];
    return (
      <div className={`min-h-screen bg-gradient-to-br ${meta.lightBg} flex items-center justify-center p-4`}>
        <div className="max-w-md w-full animate-fadeIn">

          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/images/logo_afribourse.png" alt="AfriBourse" className="w-12 h-12 object-contain mx-auto mb-2" />
            <span className="text-lg font-bold text-gray-800">AfriBourse</span>
          </div>

          {/* Profile card */}
          <div className={`bg-gradient-to-br ${meta.gradient} rounded-3xl p-8 text-white text-center mb-4 shadow-xl`}>
            <div className="text-7xl mb-4">{meta.emoji}</div>
            <p className="text-white/70 text-xs uppercase tracking-widest mb-1 font-medium">Votre profil investisseur</p>
            <h2 className="text-4xl font-bold mb-4">{meta.label}</h2>
            <p className="text-white/90 text-sm leading-relaxed">{meta.description}</p>
          </div>

          {/* CTA */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1 text-lg">Profil créé avec succès !</h3>
            <p className="text-sm text-gray-500 mb-6">
              AfriBourse personnalisera votre expérience selon votre profil{' '}
              <strong className="text-gray-700">{meta.label}</strong>.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className={`w-full py-4 bg-gradient-to-r ${meta.gradient} text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow text-base`}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img src="/images/logo_afribourse.png" alt="AfriBourse" className="w-9 h-9 object-contain" />
          <span className="font-bold text-gray-800">AfriBourse</span>
        </div>
        <span className="text-sm text-gray-400 font-medium">
          {currentStep} / 3
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6">
        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full">

          {/* Question header */}
          <div className="mb-6">
            {step !== 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            )}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-xs font-medium text-blue-700">Question {currentStep} sur 3</span>
            </div>
            {step === 1 && (
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Bienvenue sur AfriBourse 👋</h1>
                <p className="text-gray-500 text-sm">3 questions rapides pour personnaliser votre expérience.</p>
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-900 mb-1">{question.title}</h2>
            <p className="text-sm text-gray-500">{question.subtitle}</p>
          </div>

          {/* Q1 */}
          {step === 1 && (
            <div className="space-y-3">
              {Q1_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setQ1(opt.value); setStep(2); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group shadow-sm hover:shadow-md"
                >
                  <span className="text-2xl w-10 text-center">{opt.icon}</span>
                  <span className="font-medium text-gray-800 group-hover:text-blue-700 flex-1">{opt.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Q2 — optional */}
          {step === 2 && (
            <div>
              <div className="space-y-2.5 mb-4">
                {Q2_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setQ2(opt.value); setStep(3); }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group shadow-sm hover:shadow-md"
                  >
                    <div>
                      <p className="font-medium text-gray-800 group-hover:text-blue-700">{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 shrink-0" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setQ2(null); setStep(3); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-50"
              >
                <SkipForward className="w-4 h-4" />
                Passer cette question
              </button>
            </div>
          )}

          {/* Q3 */}
          {step === 3 && (
            <div className="space-y-3">
              {Q3_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleQ3Select(opt.value)}
                  disabled={isPending}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <p className="font-medium text-gray-800 group-hover:text-blue-700">{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 shrink-0" />
                </button>
              ))}
              {isPending && (
                <p className="text-center text-sm text-blue-500 animate-pulse pt-2">
                  Création de votre profil...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
