// src/components/onboarding/OnboardingFlow.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCompleteOnboarding } from '../../hooks/useOnboarding';
import type { OnboardingData } from '../../hooks/useOnboarding';
import LifeGoalStep from './LifeGoalStep';
import FinancialContextStep from './FinancialContextStep';
import HorizonStep from './HorizonStep';
import BRVMRiskQuizStep from './BRVMRiskQuizStep';
import SectorsStep from './SectorsStep';
import AIScoreStep from './AIScoreStep';
import type { ScoreBreakdown } from './AIScoreStep';
import AllocationResultStep from './AllocationResultStep';
import toast from 'react-hot-toast';

// ─── Écran de bifurcation après étape 4 ──────────────────────────────────────
function ForkScreen({
    onDashboard,
    onContinue,
    isLoading,
}: {
    onDashboard: () => void;
    onContinue: () => void;
    isLoading: boolean;
}) {
    return (
        <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-900">Votre profil de base est prêt !</h2>
                <p className="text-gray-500 mt-2 text-sm">
                    Votre profil de risque a été déterminé. Vous pouvez accéder à votre dashboard
                    maintenant ou continuer pour obtenir votre score investisseur Simba.
                </p>
            </div>

            {/* Option A — Dashboard */}
            <button
                onClick={onDashboard}
                disabled={isLoading}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Accéder à mon dashboard
                    </>
                )}
            </button>

            {/* Option B — Continuer */}
            <button
                onClick={onContinue}
                disabled={isLoading}
                className="w-full py-4 border-2 border-emerald-500 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <span className="text-lg">🎯</span>
                Continuer — Déterminer mon score investisseur
                <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">3 étapes</span>
            </button>

            <p className="text-xs text-gray-400">
                Vous pourrez compléter votre score investisseur plus tard depuis votre profil.
            </p>
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface OnboardingFlowProps {
    /** Mode modal : pas de plein écran, appelle onDone à la fin */
    isModal?: boolean;
    /** Étape de départ (5 = phase 2) */
    startStep?: number;
    /** Callback appelé après sauvegarde réussie (mode modal) */
    onDone?: () => void;
}

export default function OnboardingFlow({ isModal = false, startStep = 1, onDone }: OnboardingFlowProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const initialStep = startStep > 1 ? startStep : (searchParams.get('phase') === '2' ? 5 : 1);
    const isPhase2 = initialStep >= 5;

    const [currentStep, setCurrentStep] = useState(initialStep);
    const [showFork, setShowFork] = useState(false);
    const [formData, setFormData] = useState<Partial<OnboardingData>>({
        favorite_sectors: [],
        investment_goals: [],
    });

    const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();

    const TOTAL_STEPS = 7;
    const displayTotal = isPhase2 ? 3 : TOTAL_STEPS;
    const displayCurrent = isPhase2 ? currentStep - 4 : currentStep;

    const updateFormData = (data: Partial<OnboardingData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const nextStep = () => {
        if (currentStep < TOTAL_STEPS) setCurrentStep((prev) => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    };

    const saveAndFinish = (extraData: Partial<OnboardingData> = {}) => {
        const payload = { ...formData, ...extraData } as OnboardingData;
        completeOnboarding(payload, {
            onSuccess: () => {
                const msg = isPhase2 ? 'Score investisseur enregistré !' : 'Profil configuré avec succès !';
                toast.success(msg);
                if (isModal && onDone) {
                    onDone();
                } else {
                    navigate('/profile', { replace: true });
                }
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
            },
        });
    };

    const handlePhase1Complete = () => {
        if (!formData.risk_profile || !formData.investment_horizon) {
            toast.error('Veuillez compléter toutes les étapes obligatoires');
            return;
        }
        saveAndFinish();
    };

    const handlePhase2Complete = () => {
        saveAndFinish({ disclaimer_accepted_at: new Date().toISOString() });
    };

    const handleBackFromPhase2Start = () => {
        if (isModal && onDone) { onDone(); return; }
        navigate('/profile');
    };

    const renderStep = () => {
        if (showFork) {
            return (
                <ForkScreen
                    onDashboard={handlePhase1Complete}
                    onContinue={() => { setShowFork(false); nextStep(); }}
                    isLoading={isPending}
                />
            );
        }

        switch (currentStep) {
            case 1:
                return (
                    <LifeGoalStep
                        onNext={(lifeGoal) => { updateFormData({ life_goal: lifeGoal }); nextStep(); }}
                        showBackButton={false}
                    />
                );
            case 2:
                return (
                    <FinancialContextStep
                        onNext={(incomeSource, monthlyBudget) => {
                            updateFormData({ income_source: incomeSource, monthly_budget: monthlyBudget });
                            nextStep();
                        }}
                        onBack={prevStep}
                    />
                );
            case 3:
                return (
                    <HorizonStep
                        value={formData.investment_horizon}
                        onNext={(horizon) => { updateFormData({ investment_horizon: horizon }); nextStep(); }}
                        onBack={prevStep}
                    />
                );
            case 4:
                return (
                    <BRVMRiskQuizStep
                        value={formData.risk_profile}
                        quizScore={formData.quiz_score}
                        onNext={(riskProfile, quizScore) => {
                            updateFormData({ risk_profile: riskProfile, quiz_score: quizScore });
                            setShowFork(true);
                        }}
                        onBack={prevStep}
                    />
                );
            case 5:
                return (
                    <SectorsStep
                        value={formData.favorite_sectors || []}
                        onNext={(sectors) => { updateFormData({ favorite_sectors: sectors }); nextStep(); }}
                        onBack={isPhase2 ? handleBackFromPhase2Start : () => setShowFork(true)}
                    />
                );
            case 6:
                return (
                    <AIScoreStep
                        formData={formData}
                        onNext={(score: number, breakdown: ScoreBreakdown) => {
                            updateFormData({ investor_score: score, score_breakdown: breakdown });
                            nextStep();
                        }}
                        onBack={prevStep}
                    />
                );
            case 7:
                return (
                    <AllocationResultStep
                        data={formData}
                        onComplete={handlePhase2Complete}
                        onBack={prevStep}
                        isLoading={isPending}
                    />
                );
            default:
                return null;
        }
    };

    const progressPct = showFork ? 57 : Math.round((displayCurrent / displayTotal) * 100);
    const progressLabel = showFork
        ? 'Profil de base complété ✓'
        : isPhase2
        ? `Score investisseur — Étape ${displayCurrent} sur ${displayTotal}`
        : `Étape ${displayCurrent} sur ${displayTotal}`;

    const inner = (
        <>
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{progressLabel}</span>
                    <span className="text-sm text-gray-500">{progressPct}% complété</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            {/* Step Content */}
            <div className={isModal ? '' : 'bg-white rounded-2xl shadow-xl p-8'}>
                {renderStep()}
            </div>

            {!isModal && (
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Vos données sont sécurisées et ne seront jamais partagées sans votre consentement</p>
                </div>
            )}
        </>
    );

    // Mode modal : rendu sans enveloppe plein écran
    if (isModal) return <div className="space-y-0">{inner}</div>;

    // Mode page complète
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">{inner}</div>
        </div>
    );
}
