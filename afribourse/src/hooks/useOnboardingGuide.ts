import { useState, useEffect, useRef, useCallback } from 'react';

const LS_KEY = 'afribourse_onboarding_guide';
const SESSION_KEY = 'onboarding_guide_start';

export interface OnboardingSteps {
  cours: boolean;
  achat: boolean;
}

interface StoredState {
  hasSeenWelcome: boolean;
  steps: OnboardingSteps;
}

const DEFAULT_STATE: StoredState = {
  hasSeenWelcome: false,
  steps: { cours: false, achat: false },
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
  dismissWelcome: () => {},
  completeStep: () => {},
  forceHideChecklist: () => {},
};

/**
 * Activation: set sessionStorage key 'onboarding_guide_start' before navigating
 * away from the onboarding survey. The guide activates on the next page render.
 * Deactivation: cleared automatically on logout (isLoggedIn = false).
 */
export function useOnboardingGuide(isLoggedIn: boolean, pathname: string): OnboardingGuideState {
  const [stored, setStored] = useState<StoredState | null>(() => {
    // Restore in-progress guide on page refresh (user was mid-guide).
    // Do NOT activate here for new users — that's handled by the session flag effect.
    return readStorage();
  });

  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Clear guide on logout ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) {
      clearStorage();
      sessionStorage.removeItem(SESSION_KEY);
      setStored(null);
      setIsChecklistVisible(true);
    }
  }, [isLoggedIn]);

  // ── Activate guide when DiscoverySurvey sets the session flag ────────────
  // Re-checked on every navigation so the guide starts on whichever page the
  // user lands on after completing the survey.
  useEffect(() => {
    if (!isLoggedIn || stored !== null) return;
    const flag = sessionStorage.getItem(SESSION_KEY);
    if (flag) {
      sessionStorage.removeItem(SESSION_KEY);
      setStored(DEFAULT_STATE);
    }
  // pathname is intentionally included so this re-runs on navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isLoggedIn]);

  // ── Persist to localStorage ──────────────────────────────────────────────
  useEffect(() => {
    if (stored === null) return;
    writeStorage(stored);
  }, [stored]);

  const isActive = stored !== null;
  const completedCount = stored
    ? [stored.steps.cours, stored.steps.achat].filter(Boolean).length
    : 0;
  const isComplete = completedCount === 2;

  // ── Hide checklist 5s after full completion ──────────────────────────────
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
    dismissWelcome,
    completeStep,
    forceHideChecklist,
  };
}
