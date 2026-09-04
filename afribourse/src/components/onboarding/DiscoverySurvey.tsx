// src/components/onboarding/DiscoverySurvey.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, SkipForward, CheckCircle2, BookOpen, Lightbulb, TrendingUp, Globe, Briefcase } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { HERO_GRID_STYLE } from '../../utils/heroBackgrounds';
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
  icon: LucideIcon;
  description: string;
}> = {
  apprenti: {
    label: 'L\'Apprenti',
    icon: BookOpen,
    description: 'Tu es en train de construire tes bases. AfriBourse t\'accompagnera pas à pas dans la compréhension des marchés africains.',
  },
  decideur: {
    label: 'Le Décideur',
    icon: Briefcase,
    description: 'Tu as une vision claire et prends des décisions stratégiques. AfriBourse t\'apportera les données et analyses dont tu as besoin.',
  },
  investisseur: {
    label: 'L\'Investisseur',
    icon: TrendingUp,
    description: 'Tu es focalisé sur la croissance de ton capital. AfriBourse te donnera les outils pour optimiser tes positions sur la BRVM.',
  },
  explorateur: {
    label: 'L\'Explorateur',
    icon: Globe,
    description: 'Tu découvres les marchés africains avec curiosité. AfriBourse est la meilleure plateforme pour commencer cette aventure.',
  },
};

// ─── Questions ────────────────────────────────────────────────────────────────

const Q1_OPTIONS: { value: Q1Answer; label: string; icon: LucideIcon }[] = [
  { value: 'A', label: 'Apprendre les bases de la bourse', icon: BookOpen },
  { value: 'B', label: "Prendre des décisions d'investissement éclairées", icon: Lightbulb },
  { value: 'C', label: 'Investir et faire fructifier mon capital', icon: TrendingUp },
  { value: 'D', label: 'Explorer les marchés africains', icon: Globe },
];

/** Habillage commun a toutes les reponses proposees. */
const OPTION_ROW =
  'group w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white text-left ' +
  'transition-colors hover:border-brand-navy hover:bg-ink-50 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

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
  const [result, setResult] = useState<ProfileResult | null>(null);

  async function handleQ3Select(answer: Q3Answer) {
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
    if (onComplete) {
      onComplete();
    } else {
      navigate('/dashboard');
    }
  }

  // ─── Result screen ────────────────────────────────────────────────────────

  if (step === 'result' && result) {
    const meta = PROFILE_META[result.profile_type];
    const ProfileIcon = meta.icon;
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-ink-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Carte de profil : le bandeau navy signature du site */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-[#173F66] to-ink-950 text-center text-white px-6 py-8 mb-4">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.07] pointer-events-none" style={HERO_GRID_STYLE} />
            <div className="relative">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-white/15 items-center justify-center mb-4">
                <ProfileIcon className="w-7 h-7 text-white" />
              </span>
              <p className="text-white/60 text-[11px] uppercase tracking-widest font-semibold mb-1">Votre profil</p>
              <h2 className="text-3xl font-extrabold mb-3">{meta.label}</h2>
              <p className="text-white/70 text-sm leading-relaxed">{meta.description}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
            <CheckCircle2 className="w-9 h-9 text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 text-lg mb-1">Profil créé</h3>
            <p className="text-sm text-gray-500 mb-6">
              AfriBourse personnalisera votre expérience selon votre profil <strong>{meta.label}</strong>.
            </p>
            <button
              onClick={handleGoToDashboard}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-brand-orange text-white font-semibold hover:bg-brand-orange-hover transition-colors"
            >
              Accéder à mon tableau de bord
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Survey steps ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-ink-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-ink-50 border border-ink-100 rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 bg-brand-navy rounded-full"></span>
            <span className="text-xs font-semibold text-brand-navy">
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
                  ? 'bg-brand-navy'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Q1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Quel est votre objectif principal ?</h2>
            <p className="text-sm text-gray-500 mb-6">Cela nous permettra de personnaliser votre expérience sur AfriBourse.</p>
            <div className="space-y-3">
              {Q1_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setQ1(opt.value); setStep(2); }}
                  className={OPTION_ROW}
                >
                  <span className="w-10 h-10 shrink-0 rounded-lg bg-ink-50 flex items-center justify-center">
                    <opt.icon className="w-5 h-5 text-brand-navy" />
                  </span>
                  <span className="flex-1 font-medium text-gray-800 group-hover:text-brand-navy transition-colors">{opt.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-navy shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Q2 — optional */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
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
                  className={OPTION_ROW}
                >
                  <span className="flex-1 font-medium text-gray-800 group-hover:text-brand-navy transition-colors">{opt.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-navy shrink-0 transition-colors" />
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Quand comptez-vous utiliser ces fonds ?</h2>
            <p className="text-sm text-gray-500 mb-6">Votre horizon d'investissement nous aide à adapter votre profil.</p>
            <div className="space-y-3">
              {Q3_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleQ3Select(opt.value)}
                  disabled={isPending}
                  className={OPTION_ROW}
                >
                  <div>
                    <p className="font-medium text-gray-800 group-hover:text-brand-navy transition-colors">{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-navy shrink-0 transition-colors" />
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
