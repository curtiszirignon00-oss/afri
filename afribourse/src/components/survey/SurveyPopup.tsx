// src/components/survey/SurveyPopup.tsx
// Non-blocking popup for existing users who haven't completed the discovery survey
import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboardingStatus } from '../../hooks/useOnboarding';
import { useAuth } from '../../contexts/AuthContext';

export default function SurveyPopup() {
    const { isLoggedIn } = useAuth();
    const { data: status, isLoading } = useOnboardingStatus(isLoggedIn);
    const [dismissed, setDismissed] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Don't show on the onboarding/survey page itself, or if already done
    if (!isLoggedIn || isLoading || dismissed || status?.survey_completed || pathname.startsWith('/onboarding') || pathname.startsWith('/survey')) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 flex items-start justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <Sparkles className="w-5 h-5" />
                        <span className="font-semibold text-sm">Personnalisez votre expérience</span>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">
                        Répondez à 3 questions rapides pour qu'AfriBourse adapte son contenu à votre profil d'investisseur.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/onboarding')}
                            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Commencer — 1 min
                        </button>
                        <button
                            onClick={() => setDismissed(true)}
                            className="px-3 py-2.5 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                        >
                            Plus tard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
