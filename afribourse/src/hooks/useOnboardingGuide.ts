import { useState, useEffect, useRef, useCallback } from 'react';

const LS_KEY = 'afribourse_onboarding_guide';

export interface OnboardingSteps {
  cours: boolean;
  achat: boolean;
}

interface StoredState {
  hasSeenWelcome: boolean;
  steps: OnboardingSteps;
  startedAt: number;
}

function makeDefaultState(): StoredState {
  return {
    hasSeenWelcome: false,
    steps: { cours: false, achat: false },
    startedAt: Date.now(),
  };
}

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
  } catch {}
}

function clearStorage() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

export interface OnboardingGuideState {
  isActive: boolean;
  showWelcome: boolean;
  steps: OnboardingSteps;
  completedCount: number;
  isComplete: boolean;
  isChecklistVisible: boolean;
  startedAt: number;
  dismissWelcome: () => void;
  completeStep: (key: keyof OnboardingSteps) => void;
  forceHideChecklist: () => void;
}

export const INACTIVE_STATE: OnboardingGuideState = {
  isActive: false,
  showWelcome: false,
  steps: { cours: false, achat: false },
  completedCount: 0,
  isComplete: false,
  isChecklistVisible: false,
  startedAt: 0,
  dismissWelcome: () => {},
  completeStep: () => {},
  forceHideChecklist: () => {},
};

export function useOnboardingGuide(
  isNewUser: boolean | undefined,
  isLoggedIn: boolean
): OnboardingGuideState {
  /**
   * Activation rules:
   *  - restore from localStorage if there is in-progress data (page refresh)
   *  - start fresh when isNewUser === true (first ever login after signup)
   * Deactivation:
   *  - cleared on logout (isLoggedIn becomes false)
   */
  const [stored, setStored] = useState<StoredState | null>(() => {
    const saved = readStorage();
    if (saved) return saved;                          // resume mid-guide
    if (isNewUser === true) return makeDefaultState(); // first start
    return null;
  });

  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delayed init: auth context may still be loading on first render
  useEffect(() => {
    if (isNewUser === true && stored === null) {
      const saved = readStorage();
      setStored(saved ?? makeDefaultState());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewUser]);

  // Clear guide on logout so the widget disappears immediately
  const prevLoggedInRef = useRef(isLoggedIn);
  useEffect(() => {
    const wasLoggedIn = prevLoggedInRef.current;
    prevLoggedInRef.current = isLoggedIn;
    // Only act on a real logout transition (true → false), not the initial false state
    if (wasLoggedIn && !isLoggedIn) {
      clearStorage();
      setStored(null);
      setIsChecklistVisible(true);
    }
  }, [isLoggedIn]);

  // Persist to localStorage
  useEffect(() => {
    if (stored === null) return;
    writeStorage(stored);
  }, [stored]);

  const isActive = stored !== null;
  const completedCount = stored
    ? [stored.steps.cours, stored.steps.achat].filter(Boolean).length
    : 0;
  const isComplete = completedCount === 2;

  // Hide checklist 5 s after full completion
  useEffect(() => {
    if (!isActive || !isComplete) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setIsChecklistVisible(false), 5000);
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [isComplete, isActive]);

  const dismissWelcome = useCallback(() => {
    setStored(prev => prev ? { ...prev, hasSeenWelcome: true } : prev);
  }, []);

  const completeStep = useCallback((key: keyof OnboardingSteps) => {
    setStored(prev => {
      if (!prev || prev.steps[key]) return prev;
      return { ...prev, steps: { ...prev.steps, [key]: true } };
    });
  }, []);

  // Called when CelebrationModal closes — permanently ends the guide flow
  const forceHideChecklist = useCallback(() => {
    setIsChecklistVisible(false);
    clearStorage();
    setStored(null);
  }, []);

  if (!isActive || !stored) return INACTIVE_STATE;

  return {
    isActive: true,
    showWelcome: !stored.hasSeenWelcome,
    steps: stored.steps,
    completedCount,
    isComplete,
    isChecklistVisible,
    startedAt: stored.startedAt,
    dismissWelcome,
    completeStep,
    forceHideChecklist,
  };
}
