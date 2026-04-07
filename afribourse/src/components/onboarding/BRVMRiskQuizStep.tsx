// src/components/onboarding/BRVMRiskQuizStep.tsx
// Remplace RiskProfileStep — quiz contextuel BRVM avec scénarios réels

import { useState } from 'react';

type RiskProfile = 'CONSERVATIVE' | 'MODERATE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE';

const BRVM_QUIZ = [
  {
    q: 'Votre portefeuille BRVM perd 18% en 3 mois. Vous avez investi 200 000 FCFA (perte : 36 000 FCFA). Que faites-vous ?',
    answers: [
      { text: 'Je vends tout, c\'est trop stressant', score: 1 },
      { text: 'J\'attends en espérant une remontée', score: 2 },
      { text: 'Je garde, c\'est une opportunité long terme', score: 3 },
      { text: 'J\'achète davantage pendant la baisse', score: 4 },
    ],
  },
  {
    q: 'PALM CI annonce une hausse de dividende. Son cours monte de +22%. Vous êtes déjà actionnaire — que faites-vous ?',
    answers: [
      { text: 'Je vends immédiatement pour sécuriser le gain', score: 1 },
      { text: 'Je vends la moitié et garde le reste', score: 2 },
      { text: 'Je conserve toutes mes actions', score: 3 },
      { text: 'J\'achète encore plus d\'actions', score: 4 },
    ],
  },
  {
    q: 'Pour votre projet de vie, quelle perte temporaire pouvez-vous accepter sur 12 mois ?',
    answers: [
      { text: 'Aucune perte acceptable', score: 1 },
      { text: 'Jusqu\'à 10% si c\'est temporaire', score: 2 },
      { text: 'Jusqu\'à 25% si les perspectives sont bonnes', score: 3 },
      { text: 'Plus de 25% pour un fort potentiel', score: 4 },
    ],
  },
];

function scoreToProfile(avg: number): RiskProfile {
  if (avg <= 1.5) return 'CONSERVATIVE';
  if (avg <= 2.2) return 'MODERATE';
  if (avg <= 3.0) return 'BALANCED';
  if (avg <= 3.5) return 'GROWTH';
  return 'AGGRESSIVE';
}

const PROFILE_INFO: Record<RiskProfile, { label: string; color: string; desc: string }> = {
  CONSERVATIVE: { label: 'Conservateur', color: 'blue', desc: 'Priorité à la sécurité, capital préservé' },
  MODERATE:     { label: 'Modéré', color: 'cyan', desc: 'Équilibre entre sécurité et rendement' },
  BALANCED:     { label: 'Équilibré', color: 'emerald', desc: 'Diversification progressive' },
  GROWTH:       { label: 'Croissance', color: 'orange', desc: 'Accepte plus de risque pour plus de potentiel' },
  AGGRESSIVE:   { label: 'Agressif', color: 'red', desc: 'Cherche la performance maximale' },
};

interface Props {
  value?: RiskProfile;
  quizScore?: number;
  onNext: (riskProfile: RiskProfile, quizScore: number) => void;
  onBack?: () => void;
}

export default function BRVMRiskQuizStep({ onNext, onBack }: Props) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const totalQuestions = BRVM_QUIZ.length;
  const allAnswered = answers.length === totalQuestions;

  const avgScore = allAnswered
    ? answers.reduce((a, b) => a + b, 0) / totalQuestions
    : 0;
  const riskProfile = scoreToProfile(avgScore);
  const quizScore = allAnswered
    ? answers.reduce((a, b) => a + b, 0)
    : 0;

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setShowResult(true);
    }
  };

  if (showResult && allAnswered) {
    const info = PROFILE_INFO[riskProfile];
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Votre profil de risque</h2>
          <p className="text-gray-600 mt-1">Basé sur vos réponses aux scénarios BRVM</p>
        </div>

        <div className="bg-emerald-50 rounded-xl p-6 text-center space-y-2">
          <div className="text-4xl font-bold text-emerald-700">{info.label}</div>
          <p className="text-emerald-600 text-sm">{info.desc}</p>
          <div className="mt-3 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const levels: RiskProfile[] = ['CONSERVATIVE', 'MODERATE', 'BALANCED', 'GROWTH', 'AGGRESSIVE'];
              const activeIdx = levels.indexOf(riskProfile);
              return (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${i <= activeIdx ? 'bg-emerald-500' : 'bg-gray-200'}`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setAnswers([]);
              setCurrentQ(0);
              setShowResult(false);
            }}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
          >
            Recommencer
          </button>
          <button
            onClick={() => onNext(riskProfile, quizScore)}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  const question = BRVM_QUIZ[currentQ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">Profil de risque</h2>
          <span className="text-sm text-gray-500">
            Question {currentQ + 1} / {totalQuestions}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all"
            style={{ width: `${((currentQ) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Bulle Simba */}
      <div className="bg-emerald-50 rounded-xl p-4 flex gap-3 items-start">
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          AI
        </div>
        <p className="text-sm text-emerald-800">
          Scénario réel BRVM — choisissez votre réaction instinctive.
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-gray-900 font-medium">{question.q}</p>
      </div>

      <div className="space-y-3">
        {question.answers.map((ans, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(ans.score)}
            className="w-full flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 text-left hover:border-emerald-400 hover:bg-emerald-50 transition-all"
          >
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-gray-800 text-sm">{ans.text}</span>
          </button>
        ))}
      </div>

      {onBack && currentQ === 0 && (
        <button
          onClick={onBack}
          className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
        >
          Retour
        </button>
      )}
    </div>
  );
}
