// src/pages/SurveyPage.tsx
// Page de survey d'onboarding pour les nouveaux utilisateurs — plein écran, sans header.
//
// Charte du site : fond ink-50, carte blanche, navy pour la selection et la
// progression, orange du logo pour l'action finale. Les emojis des options et
// des profils laissent la place a des icones.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, SkipForward, CheckCircle2, ArrowLeft,
  BookOpen, Lightbulb, TrendingUp, Globe, Briefcase,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDiscoverySurvey } from '../hooks/useOnboarding';
import { metaPixel } from '../utils/metaPixel';
import { HERO_GRID_STYLE } from '../utils/heroBackgrounds';

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

const PROFILE_META: Record<ProfileType, { label: string; icon: LucideIcon; description: string }> = {
  apprenti: {
    label: "L'Apprenti",
    icon: BookOpen,
    description: "Tu es en train de construire tes bases. AfriBourse t'accompagnera pas à pas dans la compréhension des marchés africains.",
  },
  decideur: {
    label: 'Le Décideur',
    icon: Briefcase,
    description: "Tu as une vision claire et prends des décisions stratégiques. AfriBourse t'apportera les données et analyses dont tu as besoin.",
  },
  investisseur: {
    label: "L'Investisseur",
    icon: TrendingUp,
    description: "Tu es focalisé sur la croissance de ton capital. AfriBourse te donnera les outils pour optimiser tes positions sur la BRVM.",
  },
  explorateur: {
    label: "L'Explorateur",
    icon: Globe,
    description: "Tu découvres les marchés africains avec curiosité. AfriBourse est la meilleure plateforme pour commencer cette aventure.",
  },
};

// ─── Questions ────────────────────────────────────────────────────────────────

const Q1_OPTIONS: { value: Q1Answer; label: string; icon: LucideIcon }[] = [
  { value: 'A', label: 'Apprendre les bases de la bourse', icon: BookOpen },
  { value: 'B', label: "Prendre des décisions d'investissement éclairées", icon: Lightbulb },
  { value: 'C', label: 'Investir et faire fructifier mon capital', icon: TrendingUp },
  { value: 'D', label: 'Explorer les marchés africains', icon: Globe },
];

const Q2_OPTIONS: { value: Q2Answer; label: string; sub: string }[] = [
  { value: 'A', label: 'Aucune expérience', sub: 'Je débute complètement' },
  { value: 'B', label: 'Quelques notions de base', sub: "J'ai lu quelques articles" },
  { value: 'C', label: 'Expérience intermédiaire', sub: "J'ai déjà investi" },
  { value: 'D', label: 'Expérimenté(e)', sub: 'Je gère un portefeuille actif' },
  { value: 'E', label: 'Expert(e) / Professionnel(le)', sub: 'Finance = mon domaine' },
];

const Q3_OPTIONS: { value: Q3Answer; label: string; sub: string }[] = [
  { value: 'A', label: "Dans moins d'un an", sub: 'Horizon court terme' },
  { value: 'B', label: 'Dans 1 à 3 ans', sub: 'Horizon moyen terme' },
  { value: 'C', label: 'Dans plus de 3 ans', sub: 'Horizon long terme' },
  { value: 'D', label: 'Je ne sais pas encore', sub: 'Pas de contrainte' },
];

const QUESTIONS = [
  { step: 1, title: 'Quel est votre objectif principal ?', subtitle: 'Cela nous permettra de personnaliser votre expérience.' },
  { step: 2, title: 'Votre niveau en bourse ?', subtitle: 'Question facultative, vous pouvez la passer.' },
  { step: 3, title: 'Quand comptez-vous utiliser ces fonds ?', subtitle: "Votre horizon d'investissement nous aide à adapter votre profil." },
];

/** Habillage commun a toutes les reponses proposees. */
const OPTION_ROW =
  'group w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white text-left ' +
  'transition-colors hover:border-brand-navy hover:bg-ink-50 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

// ─── Component ────────────────────────────────────────────────────────────────

export default function SurveyPage() {
  const navigate = useNavigate();
  const { mutateAsync: submitSurvey, isPending } = useDiscoverySurvey();

  const [step, setStep] = useState<Step>(1);
  const [q1, setQ1] = useState<Q1Answer | null>(null);
  const [q2, setQ2] = useState<Q2Answer>(null);
  const [result, setResult] = useState<ProfileResult | null>(null);

  const currentStep = typeof step === 'number' ? step : 3;
  const question = QUESTIONS[currentStep - 1];

  async function handleQ3Select(answer: Q3Answer) {
    try {
      const data = await submitSurvey({ q1: q1!, q2, q3: answer });
      setResult(data);
      metaPixel.lead('onboarding_survey');
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
    const ProfileIcon = meta.icon;

    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-lg w-full animate-fadeIn">

          <div className="text-center mb-6">
            <button onClick={() => navigate('/')} aria-label="Retour à l'accueil" className="inline-flex cursor-pointer">
              <img src="/images/logo_afribourse.png" alt="AfriBourse" className="w-11 h-11 object-contain" />
            </button>
          </div>

          {/* Carte de profil : le bandeau navy signature du site */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-[#173F66] to-ink-950 text-center text-white px-6 py-8 mb-4">
            <div aria-hidden="true" className="absolute inset-0 opacity-[0.07] pointer-events-none" style={HERO_GRID_STYLE} />
            <div className="relative">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-white/15 items-center justify-center mb-4">
                <ProfileIcon className="w-7 h-7 text-white" />
              </span>
              <p className="text-white/60 text-[11px] uppercase tracking-widest font-semibold mb-1">
                Votre profil investisseur
              </p>
              <h1 className="text-3xl font-extrabold mb-3">{meta.label}</h1>
              <p className="text-white/70 text-sm leading-relaxed">{meta.description}</p>
            </div>
          </div>

          {/* Suite du parcours */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
            <CheckCircle2 className="w-9 h-9 text-green-600 mx-auto mb-3" />
            <h2 className="font-bold text-gray-900 text-lg mb-1">Profil créé</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              AfriBourse personnalisera votre expérience selon votre profil{' '}
              <strong className="text-gray-900">{meta.label}</strong>.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
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
    <div className="min-h-screen bg-ink-50 flex flex-col">

      {/* Barre haute */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => navigate('/')} aria-label="Retour à l'accueil" className="flex items-center gap-2 cursor-pointer">
          <img src="/images/logo_afribourse.png" alt="" className="w-9 h-9 object-contain" />
          <span className="font-display font-bold text-gray-900">AfriBourse</span>
        </button>
        <span className="text-sm font-mono tabular-nums text-gray-400">{currentStep} / 3</span>
      </div>

      {/* Progression */}
      <div className="px-6">
        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= currentStep ? 'bg-brand-navy' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">

          {/* En-tete de question */}
          <div className="mb-6">
            {step !== 1 && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            )}

            {step === 1 && (
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Bienvenue sur AfriBourse</h1>
                <p className="text-sm text-gray-500">Trois questions rapides pour personnaliser votre expérience.</p>
              </div>
            )}

            <h2 className="text-lg font-bold text-gray-900">{question.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{question.subtitle}</p>
          </div>

          {/* Q1 */}
          {step === 1 && (
            <div className="space-y-3">
              {Q1_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value} onClick={() => { setQ1(value); setStep(2); }} className={OPTION_ROW}>
                  <span className="w-10 h-10 shrink-0 rounded-lg bg-ink-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-navy" />
                  </span>
                  <span className="flex-1 font-medium text-gray-800 group-hover:text-brand-navy transition-colors">
                    {label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-navy shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Q2 — facultative */}
          {step === 2 && (
            <div>
              <div className="space-y-2.5 mb-4">
                {Q2_OPTIONS.map(({ value, label, sub }) => (
                  <button key={value} onClick={() => { setQ2(value); setStep(3); }} className={OPTION_ROW}>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-gray-800 group-hover:text-brand-navy transition-colors">{label}</span>
                      <span className="block text-xs text-gray-400 mt-0.5">{sub}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-navy shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setQ2(null); setStep(3); }}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-400 hover:text-gray-700 transition-colors rounded-xl hover:bg-gray-50"
              >
                <SkipForward className="w-4 h-4" />
                Passer cette question
              </button>
            </div>
          )}

          {/* Q3 */}
          {step === 3 && (
            <div className="space-y-3">
              {Q3_OPTIONS.map(({ value, label, sub }) => (
                <button key={value} onClick={() => handleQ3Select(value)} disabled={isPending} className={OPTION_ROW}>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-gray-800 group-hover:text-brand-navy transition-colors">{label}</span>
                    <span className="block text-xs text-gray-400 mt-0.5">{sub}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-navy shrink-0 transition-colors" />
                </button>
              ))}
              {isPending && (
                <p className="text-center text-sm text-brand-navy animate-pulse pt-2">
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