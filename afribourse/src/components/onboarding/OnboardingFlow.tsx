// src/components/onboarding/OnboardingFlow.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompleteOnboarding } from '../../hooks/useOnboarding';
import type { OnboardingData } from '../../hooks/useOnboarding';
import RiskProfileStep from './RiskProfileStep';
import HorizonStep from './HorizonStep';
import SectorsStep from './SectorsStep';
import PrivacyStep from './PrivacyStep';
import CompletionStep from './CompletionStep';
import toast from 'react-hot-toast';

export default function OnboardingFlow() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<OnboardingData>>({
        favorite_sectors: [],
        investment_goals: [],
    });

    const { mutate: completeOnboarding, isPending } = useCompleteOnboarding();

    const totalSteps = 5;

    const updateFormData = (data: Partial<OnboardingData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleComplete = () => {
        if (!formData.risk_profile || !formData.investment_horizon) {
            toast.error('Veuillez compléter toutes les étapes obligatoires');
            return;
        }

        completeOnboarding(formData as OnboardingData, {
            onSuccess: () => {
                toast.success('Profil créé avec succès !');
                navigate('/profile');
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.error || 'Erreur lors de la création du profil');
            },
        });
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <RiskProfileStep
                        value={formData.risk_profile}
                        quizScore={formData.quiz_score}
                        onNext={(riskProfile, quizScore) => {
                            updateFormData({ risk_profile: riskProfile, quiz_score: quizScore });
                            nextStep();
                        }}
                    />
                );
            case 2:
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
            case 3:
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
            case 4:
                return (
                    <PrivacyStep
                        onNext={(privacy) => {
                            updateFormData(privacy);
                            nextStep();
                        }}
                        onBack={prevStep}
                    />
                );
            case 5:
                return (
                    <CompletionStep
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
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
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
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
