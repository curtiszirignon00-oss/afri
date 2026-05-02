import { useState, useEffect, useRef, useCallback } from 'react';

const LS_KEY = 'afribourse_onboarding_guide';

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

export function useOnboardingGuide(isNewUser: boolean | undefined): OnboardingGuideState {
  /**
   * `stored === null`  → flux inactif
   * `stored !== null`  → flux actif, localStorage est la source de vérité
   *
   * On vérifie le localStorage EN PREMIER — si l'utilisateur était en cours
   * d'onboarding et a rafraîchi la page, on restaure son état même si
   * isNewUser est maintenant false (le flag est flippé au premier /me).
   */
  const [stored, setStored] = useState<StoredState | null>(() => {
    const saved = readStorage();
    if (saved) return saved;                // reprise mid-onboarding
    if (isNewUser === true) return DEFAULT_STATE; // tout premier démarrage
    return null;                            // utilisateur existant
  });

  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialisation différée : auth peut être encore en cours au premier render
  useEffect(() => {
    if (isNewUser === true && stored === null) {
      const saved = readStorage();
      setStored(saved ?? DEFAULT_STATE);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewUser]);

  // Persistance localStorage à chaque changement d'état
  useEffect(() => {
    if (stored === null) return;
    writeStorage(stored);
  }, [stored]);

  const isActive = stored !== null;
  const completedCount = stored
    ? [stored.steps.cours, stored.steps.achat].filter(Boolean).length
    : 0;
  const isComplete = completedCount === 2;

  // Masquer la checklist 5 s après complétion totale
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
      if (!prev || prev.steps[key]) return prev; // null ou déjà fait → no-op
      return { ...prev, steps: { ...prev.steps, [key]: true } };
    });
  }, []);

  // Appelé à la fermeture de CelebrationModal : efface l'état définitivement
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
