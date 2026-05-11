import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api-client';
import { analytics } from '../services/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeMachineScenario {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  tier: string;
  years: number[];
  availableStocks: string[];
  startBudget: number;
  locked?: boolean;
  contextByYear?: any;
  fundamentalsByYear?: any;
  dividendsByYear?: any;
  availableActionsByYear?: any;
  lessonsByYear?: any;
  quizByYear?: any;
}

export interface TimeMachineSession {
  id: string;
  scenarioId: string;
  currentStep: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  portfolioByStep: Record<string, Record<string, number>>;
  noteByStep: Record<string, string>;
  capitalByStep: Record<string, number>;
  performanceByStep: Record<string, any>;
  scenario?: TimeMachineScenario;
  completedAt?: string;
}

interface TimeMachineState {
  scenario: TimeMachineScenario | null;
  session: TimeMachineSession | null;
  currentAllocation: Record<string, number>;
  currentNote: string;
  availableCapital: number;
  kofiMessage: string | null;
  kofiLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_SCENARIO'; payload: TimeMachineScenario }
  | { type: 'SET_SESSION'; payload: TimeMachineSession }
  | { type: 'SET_QTY'; payload: { ticker: string; qty: number } }
  | { type: 'SET_NOTE'; payload: string }
  | { type: 'SET_CAPITAL'; payload: number }
  | { type: 'SET_KOFI'; payload: string | null }
  | { type: 'SET_KOFI_LOADING'; payload: boolean }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_ALLOCATION' };

const STORAGE_KEY = 'tm_session';

function calcCost(allocation: Record<string, number>, fundamentals: any, year: number): number {
  const fund = fundamentals?.[String(year)] ?? {};
  return Object.entries(allocation).reduce((sum, [ticker, qty]) => {
    const cours = fund[ticker]?.cours ?? 0;
    return sum + qty * cours * 1.012;
  }, 0);
}

function reducer(state: TimeMachineState, action: Action): TimeMachineState {
  switch (action.type) {
    case 'SET_SCENARIO':
      return { ...state, scenario: action.payload, error: null };
    case 'SET_SESSION': {
      const s = action.payload;
      const step = s.currentStep;
      const capital = s.capitalByStep?.[String(step)] ?? s.scenario?.startBudget ?? 0;
      const existingAlloc = s.portfolioByStep?.[String(step)] ?? {};
      return {
        ...state,
        session: s,
        currentAllocation: existingAlloc,
        currentNote: s.noteByStep?.[String(step)] ?? '',
        availableCapital: capital,
      };
    }
    case 'SET_QTY': {
      const newAlloc = { ...state.currentAllocation, [action.payload.ticker]: action.payload.qty };
      if (action.payload.qty === 0) delete newAlloc[action.payload.ticker];
      const step = state.session?.currentStep ?? 0;
      const year = state.scenario?.years[step] ?? 0;
      const cost = calcCost(newAlloc, state.scenario?.fundamentalsByYear, year);
      const maxCapital = state.session?.capitalByStep?.[String(step)] ?? state.scenario?.startBudget ?? 0;
      return { ...state, currentAllocation: newAlloc, availableCapital: maxCapital - cost };
    }
    case 'SET_NOTE':
      return { ...state, currentNote: action.payload };
    case 'SET_CAPITAL':
      return { ...state, availableCapital: action.payload };
    case 'SET_KOFI':
      return { ...state, kofiMessage: action.payload };
    case 'SET_KOFI_LOADING':
      return { ...state, kofiLoading: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET_ALLOCATION':
      return { ...state, currentAllocation: {}, currentNote: '' };
    default:
      return state;
  }
}

const initialState: TimeMachineState = {
  scenario: null,
  session: null,
  currentAllocation: {},
  currentNote: '',
  availableCapital: 0,
  kofiMessage: null,
  kofiLoading: false,
  isSubmitting: false,
  error: null,
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface TimeMachineContextType extends TimeMachineState {
  loadScenario: (slug: string) => Promise<void>;
  startSession: (slug: string) => Promise<string>;
  loadSession: (sessionId: string) => Promise<void>;
  setQty: (ticker: string, qty: number) => void;
  setNote: (note: string) => void;
  submitStep: () => Promise<void>;
  requestKofiFeedback: (stepIndex: number) => Promise<void>;
  requestKofiRecap: () => Promise<void>;
}

const TimeMachineContext = createContext<TimeMachineContextType | null>(null);

export function TimeMachineProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist/restore session from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.session) {
          dispatch({ type: 'SET_SESSION', payload: parsed.session });
        }
        if (parsed.scenario) {
          dispatch({ type: 'SET_SCENARIO', payload: parsed.scenario });
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (state.session) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        session: state.session,
        scenario: state.scenario,
      }));
    }
  }, [state.session, state.scenario]);

  const loadScenario = useCallback(async (slug: string) => {
    try {
      const { data } = await apiClient.get(`/time-machine/scenarios/${slug}`);
      dispatch({ type: 'SET_SCENARIO', payload: data.scenario });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: 'Impossible de charger le scénario.' });
    }
  }, []);

  const startSession = useCallback(async (slug: string): Promise<string> => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const { data } = await apiClient.post('/time-machine/sessions', { scenarioSlug: slug });
      dispatch({ type: 'SET_SESSION', payload: data.session });
      if (data.session.scenario) {
        dispatch({ type: 'SET_SCENARIO', payload: data.session.scenario });
      }
      analytics.trackAction('TIME_MACHINE', 'time_machine_started', {
        scenarioSlug: slug,
        sessionId: data.session.id,
      });
      return data.session.id;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Impossible de démarrer la session.';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const { data } = await apiClient.get(`/time-machine/sessions/${sessionId}`);
      dispatch({ type: 'SET_SESSION', payload: data.session });
      if (data.session.scenario) {
        dispatch({ type: 'SET_SCENARIO', payload: data.session.scenario });
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: 'Impossible de charger la session.' });
    }
  }, []);

  const setQty = useCallback((ticker: string, qty: number) => {
    dispatch({ type: 'SET_QTY', payload: { ticker, qty } });
  }, []);

  const setNote = useCallback((note: string) => {
    dispatch({ type: 'SET_NOTE', payload: note });
  }, []);

  const submitStep = useCallback(async () => {
    if (!state.session) return;
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const { data } = await apiClient.put(`/time-machine/sessions/${state.session.id}/step`, {
        stepIndex: state.session.currentStep,
        allocation: state.currentAllocation,
        note: state.currentNote,
      });
      dispatch({ type: 'SET_SESSION', payload: data.session });
      const stepIdx = state.session!.currentStep;
      const isCompleted = data.session.status === 'COMPLETED';
      analytics.trackAction('TIME_MACHINE', isCompleted ? 'time_machine_completed' : 'time_machine_step_completed', {
        sessionId: state.session!.id,
        stepIndex: stepIdx,
        status: data.session.status,
        nbTickers: Object.keys(state.currentAllocation).length,
      });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Erreur lors de la soumission de l'étape.";
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw err;
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [state.session, state.currentAllocation, state.currentNote]);

  const requestKofiFeedback = useCallback(async (stepIndex: number) => {
    if (!state.session) return;
    dispatch({ type: 'SET_KOFI_LOADING', payload: true });
    dispatch({ type: 'SET_KOFI', payload: null });
    try {
      analytics.trackAction('TIME_MACHINE', 'time_machine_kofi_requested', {
        sessionId: state.session.id,
        type: 'feedback',
        stepIndex,
      });
      const { data } = await apiClient.post(`/time-machine/sessions/${state.session.id}/kofi`, { stepIndex });
      dispatch({ type: 'SET_KOFI', payload: data.feedback });
    } catch {
      dispatch({ type: 'SET_KOFI', payload: 'Analyse KOFI temporairement indisponible.' });
    } finally {
      dispatch({ type: 'SET_KOFI_LOADING', payload: false });
    }
  }, [state.session]);

  const requestKofiRecap = useCallback(async () => {
    if (!state.session) return;
    dispatch({ type: 'SET_KOFI_LOADING', payload: true });
    dispatch({ type: 'SET_KOFI', payload: null });
    try {
      analytics.trackAction('TIME_MACHINE', 'time_machine_kofi_requested', {
        sessionId: state.session.id,
        type: 'recap',
      });
      const { data } = await apiClient.post(`/time-machine/sessions/${state.session.id}/kofi-recap`, {});
      dispatch({ type: 'SET_KOFI', payload: data.recap });
    } catch {
      dispatch({ type: 'SET_KOFI', payload: 'Récapitulatif KOFI temporairement indisponible.' });
    } finally {
      dispatch({ type: 'SET_KOFI_LOADING', payload: false });
    }
  }, [state.session]);

  return (
    <TimeMachineContext.Provider value={{
      ...state,
      loadScenario,
      startSession,
      loadSession,
      setQty,
      setNote,
      submitStep,
      requestKofiFeedback,
      requestKofiRecap,
    }}>
      {children}
    </TimeMachineContext.Provider>
  );
}

export function useTimeMachine() {
  const ctx = useContext(TimeMachineContext);
  if (!ctx) throw new Error('useTimeMachine must be used within TimeMachineProvider');
  return ctx;
}
