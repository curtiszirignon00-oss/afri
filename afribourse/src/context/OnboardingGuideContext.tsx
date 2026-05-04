import { createContext, useContext, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingGuide, OnboardingGuideState } from '../hooks/useOnboardingGuide';

const OnboardingGuideContext = createContext<OnboardingGuideState | undefined>(undefined);

export function OnboardingGuideProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  const { pathname } = useLocation();
  const guide = useOnboardingGuide(isLoggedIn, pathname);

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
