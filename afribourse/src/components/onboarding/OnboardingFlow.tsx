// src/components/onboarding/OnboardingFlow.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function OnboardingFlow() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<OnboardingData>>({
        favorite_sectors: [],
        investment_goals: [],
        life_goal: undefined,
        income_source: undefined,
        monthly_budget: undefined,
        investor_score: undefined,
        score_breakdown: undefined,
        allocation_json: undefined,
    });

    const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();

    const totalSteps = 7;

    const updateFormData = (data: Partial<OnboardingData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep((prev) => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    };

    const handleComplete = () => {
        if (!formData.risk_profile || !formData.investment_horizon) {
            toast.error('Veuillez compléter toutes les étapes obligatoires');
            return;
        }

        completeOnboarding(
            { ...formData, disclaimer_accepted_at: new Date().toISOString() } as OnboardingData,
            {
                onSuccess: () => {
                    toast.success('Profil créé avec succès !');
                    navigate('/dashboard', { replace: true });
                },
                onError: (error: any) => {
                    toast.error(error.response?.data?.error || 'Erreur lors de la création du profil');
                },
            }
        );
    };

    const renderStep = () => {
        switch (currentStep) {
            // Step 1 — Objectif de vie
            case 1:
                return (
                    <LifeGoalStep
                        onNext={(lifeGoal) => {
                            updateFormData({ life_goal: lifeGoal });
                            nextStep();
                        }}
                        showBackButton={false}
                    />
                );

            // Step 2 — Contexte financier
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

            // Step 3 — Horizon d'investissement
            case 3:
                return (
                    <HorizonStep
                        value={formData.investment_horizon}
                        onNext={(horizon) => {
                            updateFormData({ investment_horizon: horizon });
                            nextStep();
                        }}
                        onBack={prevStep}
                    />
                );

            // Step 4 — Quiz risque BRVM
            case 4:
                return (
                    <BRVMRiskQuizStep
                        value={formData.risk_profile}
                        quizScore={formData.quiz_score}
                        onNext={(riskProfile, quizScore) => {
                            updateFormData({ risk_profile: riskProfile, quiz_score: quizScore });
                            nextStep();
                        }}
                        onBack={prevStep}
                    />
                );

            // Step 5 — Secteurs favoris
            case 5:
                return (
                    <SectorsStep
                        value={formData.favorite_sectors || []}
                        onNext={(sectors) => {
                            updateFormData({ favorite_sectors: sectors });
                            nextStep();
                        }}
                        onBack={prevStep}
                    />
                );

            // Step 6 — Score IA Simba
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

            // Step 7 — Allocation Simba + Disclaimer
            case 7:
                return (
                    <AllocationResultStep
                        data={formData}
                        onComplete={handleComplete}
                        onBack={prevStep}
                        isLoading={isPending}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Étape {currentStep} sur {totalSteps}
                        </span>
                        <span className="text-sm text-gray-500">
                            {Math.round((currentStep / totalSteps) * 100)}% complété
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {renderStep()}
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Vos données sont sécurisées et ne seront jamais partagées sans votre consentement</p>
                </div>
            </div>
        </div>
    );
}
