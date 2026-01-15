// src/components/onboarding/RiskProfileStep.tsx
import { useState } from 'react';
import { TrendingUp, Shield, BarChart3, Zap, Flame } from 'lucide-react';

interface RiskProfileStepProps {
    value?: 'CONSERVATIVE' | 'MODERATE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE';
    quizScore?: number;
    onNext: (riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE', quizScore: number) => void;
}

const riskProfiles = [
    {
        value: 'CONSERVATIVE' as const,
        label: 'Conservateur',
        icon: Shield,
        color: 'blue',
        description: 'Priorité à la sécurité, rendements stables',
        characteristics: ['Faible risque', 'Rendements modérés', 'Capital protégé'],
    },
    {
        value: 'MODERATE' as const,
        label: 'Modéré',
        icon: BarChart3,
        color: 'green',
        description: 'Équilibre entre sécurité et croissance',
        characteristics: ['Risque moyen', 'Diversification', 'Croissance stable'],
    },
    {
        value: 'BALANCED' as const,
        label: 'Équilibré',
        icon: TrendingUp,
        color: 'purple',
        description: 'Mix optimal risque/rendement',
        characteristics: ['Diversifié', 'Croissance régulière', 'Volatilité contrôlée'],
    },
    {
        value: 'GROWTH' as const,
        label: 'Croissance',
        icon: Zap,
        color: 'orange',
        description: 'Recherche de croissance à long terme',
        characteristics: ['Risque élevé', 'Fort potentiel', 'Horizon long terme'],
    },
    {
        value: 'AGGRESSIVE' as const,
        label: 'Agressif',
        icon: Flame,
        color: 'red',
        description: 'Maximisation des rendements',
        characteristics: ['Très haut risque', 'Rendements élevés', 'Volatilité forte'],
    },
];

const quizQuestions = [
    {
        question: 'Quelle est votre réaction si votre portefeuille perd 20% en un mois ?',
        answers: [
            { text: 'Je vends tout immédiatement', score: 1 },
            { text: 'Je suis inquiet mais j\'attends', score: 2 },
            { text: 'C\'est normal, je garde mes positions', score: 3 },
            { text: 'J\'achète plus pour profiter des prix bas', score: 4 },
        ],
    },
    {
        question: 'Quel est votre objectif principal d\'investissement ?',
        answers: [
            { text: 'Préserver mon capital', score: 1 },
            { text: 'Revenus réguliers (dividendes)', score: 2 },
            { text: 'Croissance modérée', score: 3 },
            { text: 'Croissance maximale', score: 4 },
        ],
    },
    {
        question: 'Quelle est votre expérience en bourse ?',
        answers: [
            { text: 'Aucune expérience', score: 1 },
            { text: 'Débutant (< 1 an)', score: 2 },
            { text: 'Intermédiaire (1-5 ans)', score: 3 },
            { text: 'Expert (> 5 ans)', score: 4 },
        ],
    },
];

export default function RiskProfileStep({ value, quizScore: initialScore, onNext }: RiskProfileStepProps) {
    const [selectedProfile, setSelectedProfile] = useState(value);
    const [showQuiz, setShowQuiz] = useState(!value);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    const handleQuizAnswer = (score: number) => {
        const newAnswers = [...quizAnswers, score];
        setQuizAnswers(newAnswers);

        if (currentQuestion < quizQuestions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // Quiz terminé, calculer le profil
            const totalScore = newAnswers.reduce((sum, s) => sum + s, 0);
            const avgScore = totalScore / newAnswers.length;

            let suggestedProfile: typeof selectedProfile;
            if (avgScore <= 1.5) suggestedProfile = 'CONSERVATIVE';
            else if (avgScore <= 2.5) suggestedProfile = 'MODERATE';
            else if (avgScore <= 3) suggestedProfile = 'BALANCED';
            else if (avgScore <= 3.5) suggestedProfile = 'GROWTH';
            else suggestedProfile = 'AGGRESSIVE';

            setSelectedProfile(suggestedProfile);
            setShowQuiz(false);
        }
    };

    const handleSubmit = () => {
        if (selectedProfile) {
            const score = quizAnswers.length > 0
                ? Math.round((quizAnswers.reduce((sum, s) => sum + s, 0) / quizAnswers.length) * 25)
                : initialScore || 0;
            onNext(selectedProfile, score);
        }
    };

    if (showQuiz) {
        const question = quizQuestions[currentQuestion];
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Découvrez votre profil de risque
                    </h2>
                    <p className="text-gray-600">
                        Répondez à quelques questions pour identifier votre profil d'investisseur
                    </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                    <div className="mb-4">
                        <span className="text-sm text-blue-600 font-medium">
                            Question {currentQuestion + 1}/{quizQuestions.length}
                        </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {question.question}
                    </h3>
                    <div className="space-y-3">
                        {question.answers.map((answer, index) => (
                            <button
                                key={index}
                                onClick={() => handleQuizAnswer(answer.score)}
                                className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-white transition-all"
                            >
                                {answer.text}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => setShowQuiz(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    Passer le quiz →
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Quel est votre profil de risque ?
                </h2>
                <p className="text-gray-600">
                    Sélectionnez le profil qui correspond le mieux à votre tolérance au risque
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {riskProfiles.map((profile) => {
                    const Icon = profile.icon;
                    const isSelected = selectedProfile === profile.value;

                    return (
                        <button
                            key={profile.value}
                            onClick={() => setSelectedProfile(profile.value)}
                            className={`text-left p-6 rounded-xl border-2 transition-all ${isSelected
                                    ? `border-${profile.color}-500 bg-${profile.color}-50 shadow-lg`
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg bg-${profile.color}-100`}>
                                    <Icon className={`w-6 h-6 text-${profile.color}-600`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        {profile.label}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                        {profile.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.characteristics.map((char, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs px-2 py-1 bg-white rounded-full border border-gray-200"
                                            >
                                                {char}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-between pt-6">
                <button
                    onClick={() => setShowQuiz(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                >
                    ← Refaire le quiz
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!selectedProfile}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                    Continuer →
                </button>
            </div>
        </div>
    );
}
