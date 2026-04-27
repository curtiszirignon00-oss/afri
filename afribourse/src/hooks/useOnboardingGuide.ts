import { useState, useEffect, useRef, useCallback } from 'react';

const LS_KEY = 'afribourse_onboarding_guide';

interface OnboardingSteps {
  cours: boolean;
  quiz: boolean;
  achat: boolean;
}

interface StoredState {
  hasSeenWelcome: boolean;
  steps: OnboardingSteps;
}

const DEFAULT_STATE: StoredState = {
  hasSeenWelcome: false,
  steps: { cours: false, quiz: false, achat: false },
};

function readStorage(): StoredState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

function writeStorage(state: StoredState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export interface OnboardingGuideState {
  isActive: boolean;
  showWelcome: boolean;
  steps: OnboardingSteps;
  completedCount: number;
  isComplete: boolean;
  isChecklistVisible: boolean;
  dismissWelcome: () => void;
  completeStep: (key: keyof OnboardingSteps) => void;
  forceHideChecklist: () => void;
}

const INACTIVE: OnboardingGuideState = {
  isActive: false,
  showWelcome: false,
  steps: { cours: false, quiz: false, achat: false },
  completedCount: 0,
  isComplete: false,
  isChecklistVisible: false,
  dismissWelcome: () => {},
  completeStep: () => {},
  forceHideChecklist: () => {},
};

export function useOnboardingGuide(isNewUser: boolean | undefined): OnboardingGuideState {
  const [stored, setStored] = useState<StoredState>(() => {
    if (!isNewUser) return DEFAULT_STATE;
    return readStorage() ?? DEFAULT_STATE;
  });

  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state to localStorage on every change
  useEffect(() => {
    if (!isNewUser) return;
    writeStorage(stored);
  }, [stored, isNewUser]);

  const completedCount = [stored.steps.cours, stored.steps.quiz, stored.steps.achat].filter(Boolean).length;
  const isComplete = completedCount === 3;

  // Masquer la checklist 5 secondes après la complétion totale
  useEffect(() => {
    if (!isNewUser || !isComplete) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setIsChecklistVisible(false), 5000);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isComplete, isNewUser]);

  const dismissWelcome = useCallback(() => {
    setStored(prev => ({ ...prev, hasSeenWelcome: true }));
  }, []);

  const completeStep = useCallback((key: keyof OnboardingSteps) => {
    setStored(prev => {
      if (prev.steps[key]) return prev; // idempotent
      return { ...prev, steps: { ...prev.steps, [key]: true } };
    });
  }, []);

  const forceHideChecklist = useCallback(() => {
    setIsChecklistVisible(false);
  }, []);

  if (!isNewUser) return INACTIVE;

  return {
    isActive: true,
    showWelcome: !stored.hasSeenWelcome,
    steps: stored.steps,
    completedCount,
    isComplete,
    isChecklistVisible,
    dismissWelcome,
    completeStep,
    forceHideChecklist,
  };
}
