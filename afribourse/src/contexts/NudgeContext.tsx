// src/contexts/NudgeContext.tsx
// Registre central du système de nudges comportementaux

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { type NudgeConfig, getNudgeById } from '../data/nudges';

const LS_KEY = 'afribourse_nudges_seen';
const QUEUE_DELAY_MS = 30_000;

interface NudgeContextValue {
  activeNudge: NudgeConfig | null;
  actionCallback: ((action: string) => void) | null;
  showNudge: (id: string, onAction?: (action: string) => void) => void;
  dismissNudge: (id: string) => void;
}

const NudgeContext = createContext<NudgeContextValue>({
  activeNudge: null,
  actionCallback: null,
  showNudge: () => {},
  dismissNudge: () => {},
});

export function useNudgeContext() {
  return useContext(NudgeContext);
}

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set<string>(parsed);
  } catch {
    // ignore malformed localStorage
  }
  return new Set();
}

function persistSeenIds(ids: Set<string>) {
  localStorage.setItem(LS_KEY, JSON.stringify([...ids]));
}

export function NudgeProvider({ children }: { children: ReactNode }) {
  const [activeNudge, setActiveNudge] = useState<NudgeConfig | null>(null);
  const [actionCallback, setActionCallback] = useState<((action: string) => void) | null>(null);

  const seenIdsRef = useRef<Set<string>>(loadSeenIds());
  const queueRef = useRef<Array<{ id: string; onAction?: (action: string) => void }>>([]);
  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether a nudge is already scheduled/active to prevent timer collisions
  const isOccupiedRef = useRef(false);

  const activateNudge = useCallback((nudge: NudgeConfig, onAction?: (action: string) => void) => {
    isOccupiedRef.current = true;
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = setTimeout(() => {
      setActiveNudge(nudge);
      setActionCallback(onAction ?? null);
    }, nudge.delay_ms);
  }, []);

  const showNudge = useCallback((id: string, onAction?: (action: string) => void) => {
    const nudge = getNudgeById(id);
    if (!nudge) return;

    if (!nudge.no_dedupe && seenIdsRef.current.has(id)) return;

    // Use isOccupiedRef (not just activeNudge state) to handle rapid synchronous calls
    if (isOccupiedRef.current) {
      queueRef.current.push({ id, onAction });
      return;
    }

    activateNudge(nudge, onAction);
  }, [activateNudge]);

  const dismissNudge = useCallback((id: string) => {
    const nudge = getNudgeById(id);

    if (nudge && !nudge.no_dedupe) {
      seenIdsRef.current.add(id);
      persistSeenIds(seenIdsRef.current);
    }

    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    setActiveNudge(null);
    setActionCallback(null);

    if (queueRef.current.length > 0) {
      if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
      queueTimerRef.current = setTimeout(() => {
        isOccupiedRef.current = false;
        // Drain stale/seen entries and activate the first valid one
        while (queueRef.current.length > 0) {
          const next = queueRef.current.shift()!;
          const nextNudge = getNudgeById(next.id);
          if (!nextNudge) continue;
          if (!nextNudge.no_dedupe && seenIdsRef.current.has(next.id)) continue;
          activateNudge(nextNudge, next.onAction);
          return;
        }
      }, QUEUE_DELAY_MS);
    } else {
      isOccupiedRef.current = false;
    }
  }, [activateNudge]);

  return (
    <NudgeContext.Provider value={{ activeNudge, actionCallback, showNudge, dismissNudge }}>
      {children}
    </NudgeContext.Provider>
  );
}
