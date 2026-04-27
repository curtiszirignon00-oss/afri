import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingGuide, OnboardingGuideState } from '../hooks/useOnboardingGuide';

const OnboardingGuideContext = createContext<OnboardingGuideState | undefined>(undefined);

export function OnboardingGuideProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  const guide = useOnboardingGuide(userProfile?.isNewUser);

  return (
    <OnboardingGuideContext.Provider value={guide}>
      {children}
    </OnboardingGuideContext.Provider>
  );
}

export function useOnboardingGuideContext(): OnboardingGuideState {
  const ctx = useContext(OnboardingGuideContext);
  if (!ctx) throw new Error('useOnboardingGuideContext must be used within OnboardingGuideProvider');
  return ctx;
}
