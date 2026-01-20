// src/components/challenge/EnrollmentModal.tsx
import React, { useState } from 'react';
import { useEnrollInChallenge, type EnrollmentData } from '../../hooks/useChallenge';
import './EnrollmentModal.css';

interface EnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const QUESTIONS = {
    experienceLevel: {
        label: 'Quel est votre niveau d\'expérience en bourse ?',
        options: [
            { value: 'DEBUTANT', label: '🌱 Débutant - Je découvre la bourse' },
            { value: 'INTERMEDIAIRE', label: '📈 Intermédiaire - J\'ai quelques connaissances' },
            { value: 'EXPERT', label: '🎯 Expert - Je maîtrise bien la bourse' },
        ],
    },
    hasRealAccount: {
        label: 'Possédez-vous déjà un compte titre réel ?',
        options: [
            { value: true, label: 'Oui, j\'ai un compte titre' },
            { value: false, label: 'Non, pas encore' },
        ],
    },
    discoverySource: {
        label: 'Comment avez-vous entendu parler du Challenge AfriBourse ?',
        options: [
            { value: 'SOCIAL_MEDIA', label: '📱 Réseaux sociaux' },
            { value: 'FRIEND', label: '👥 Recommandation d\'un ami' },
            { value: 'SCHOOL', label: '🎓 École / Université' },
            { value: 'PRESS', label: '📰 Presse / Médias' },
            { value: 'OTHER', label: '💡 Autre' },
        ],
    },
    primaryGoal: {
        label: 'Quel est votre objectif principal ?',
        options: [
            { value: 'WIN_PRIZE', label: '🏆 Gagner le prix' },
            { value: 'LEARN', label: '📚 Apprendre et me former' },
            { value: 'NETWORK', label: '🤝 Networker avec d\'autres investisseurs' },
        ],
    },
    preferredSector: {
        label: 'Quel secteur de la BRVM vous intéresse le plus ?',
        options: [
            { value: 'BANK', label: '🏦 Banque' },
            { value: 'TELECOM', label: '📡 Télécommunications' },
            { value: 'AGRICULTURE', label: '🌾 Agriculture' },
            { value: 'INDUSTRY', label: '🏭 Industrie' },
            { value: 'SERVICES', label: '💼 Services' },
            { value: 'ALL', label: '🌐 Tous les secteurs' },
        ],
    },
};

export function EnrollmentModal({ isOpen, onClose, onSuccess }: EnrollmentModalProps) {
    const [formData, setFormData] = useState<Partial<EnrollmentData>>({});
    const [currentStep, setCurrentStep] = useState(1);
    const enrollMutation = useEnrollInChallenge();

    const totalSteps = 6; // 5 questions + code parrainage

    const handleSelect = (field: keyof EnrollmentData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            await enrollMutation.mutateAsync(formData as EnrollmentData);
            onSuccess?.();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erreur lors de l\'inscription');
        }
    };

    if (!isOpen) return null;

    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="enrollment-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    ✕
                </button>

                <div className="modal-header">
                    <h2>🏆 Inscription Challenge AfriBourse 2026</h2>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="step-indicator">
                        Étape {currentStep} sur {totalSteps}
                    </p>
                </div>

                <div className="modal-body">
                    {currentStep === 1 && (
                        <QuestionStep
                            question={QUESTIONS.experienceLevel.label}
                            options={QUESTIONS.experienceLevel.options}
                            selected={formData.experienceLevel}
                            onSelect={(value) => handleSelect('experienceLevel', value)}
                        />
                    )}

                    {currentStep === 2 && (
                        <QuestionStep
                            question={QUESTIONS.hasRealAccount.label}
                            options={QUESTIONS.hasRealAccount.options}
                            selected={formData.hasRealAccount}
                            onSelect={(value) => handleSelect('hasRealAccount', value)}
                        />
                    )}

                    {currentStep === 3 && (
                        <QuestionStep
                            question={QUESTIONS.discoverySource.label}
                            options={QUESTIONS.discoverySource.options}
                            selected={formData.discoverySource}
                            onSelect={(value) => handleSelect('discoverySource', value)}
                        />
                    )}

                    {currentStep === 4 && (
                        <QuestionStep
                            question={QUESTIONS.primaryGoal.label}
                            options={QUESTIONS.primaryGoal.options}
                            selected={formData.primaryGoal}
                            onSelect={(value) => handleSelect('primaryGoal', value)}
                        />
                    )}

                    {currentStep === 5 && (
                        <QuestionStep
                            question={QUESTIONS.preferredSector.label}
                            options={QUESTIONS.preferredSector.options}
                            selected={formData.preferredSector}
                            onSelect={(value) => handleSelect('preferredSector', value)}
                        />
                    )}

                    {currentStep === 6 && (
                        <div className="referral-step">
                            <h3>Code de Parrainage</h3>
                            <p>Avez-vous un code de parrainage ? (Optionnel)</p>
                            <input
                                type="text"
                                placeholder="Entrez le code"
                                value={formData.referralCode || ''}
                                onChange={(e) => handleSelect('referralCode', e.target.value)}
                                className="referral-input"
                            />
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={handleBack} disabled={currentStep === 1}>
                        ← Précédent
                    </button>

                    {currentStep < totalSteps ? (
                        <button
                            className="btn-primary"
                            onClick={handleNext}
                            disabled={!isStepValid(currentStep, formData)}
                        >
                            Suivant →
                        </button>
                    ) : (
                        <button
                            className="btn-success"
                            onClick={handleSubmit}
                            disabled={enrollMutation.isPending || !isFormValid(formData)}
                        >
                            {enrollMutation.isPending ? 'Inscription...' : '✓ S\'inscrire'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sous-composant pour afficher une question
function QuestionStep({ question, options, selected, onSelect }: any) {
    return (
        <div className="question-step">
            <h3>{question}</h3>
            <div className="options-grid">
                {options.map((option: any) => (
                    <button
                        key={option.value.toString()}
                        className={`option-btn ${selected === option.value ? 'selected' : ''}`}
                        onClick={() => onSelect(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Validation par étape
function isStepValid(step: number, data: Partial<EnrollmentData>): boolean {
    switch (step) {
        case 1:
            return !!data.experienceLevel;
        case 2:
            return data.hasRealAccount !== undefined;
        case 3:
            return !!data.discoverySource;
        case 4:
            return !!data.primaryGoal;
        case 5:
            return !!data.preferredSector;
        case 6:
            return true; // Code parrainage optionnel
        default:
            return false;
    }
}

// Validation formulaire complet
function isFormValid(data: Partial<EnrollmentData>): boolean {
    return !!(
        data.experienceLevel &&
        data.hasRealAccount !== undefined &&
        data.discoverySource &&
        data.primaryGoal &&
        data.preferredSector
    );
}
