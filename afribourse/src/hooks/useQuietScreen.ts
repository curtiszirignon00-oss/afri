// src/hooks/useQuietScreen.ts
// Attend que l'écran soit « calme » avant d'afficher un guide : délai minimal
// (les popups globaux apparaissent en différé), puis aucune modale ouverte
// pendant `quietMs` d'affilée. Une fois atteint, l'état reste vrai.

import { useEffect, useState } from 'react';

/** Overlays considérés comme bloquants (modales plein écran, dialogues). */
const OVERLAY_SELECTOR = '[aria-modal="true"], [role="dialog"], .fixed.inset-0';

export function hasBlockingOverlay(ignoreSelector?: string): boolean {
  const nodes = document.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR);
  for (const el of Array.from(nodes)) {
    if (ignoreSelector && el.closest(ignoreSelector)) continue;
    const cs = window.getComputedStyle(el);
    // Calques décoratifs (pointer-events: none) ou masqués : non bloquants
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none' || Number(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) continue;
    return true;
  }
  return false;
}

interface Options {
  /** Délai minimal après activation (popups différés : bienvenue, webinaire…). */
  minDelayMs?: number;
  /** Durée sans aucune modale avant de considérer l'écran libre. */
  quietMs?: number;
  /** Éléments à ignorer (le guide lui-même). */
  ignoreSelector?: string;
}

export function useQuietScreen(enabled: boolean, { minDelayMs = 4000, quietMs = 2000, ignoreSelector }: Options = {}): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled || ready) return;
    const start = Date.now();
    let lastBusy = start;
    const id = window.setInterval(() => {
      const now = Date.now();
      // Onglet en arrière-plan : on repart de zéro au retour
      if (document.hidden || hasBlockingOverlay(ignoreSelector)) { lastBusy = now; return; }
      if (now - start >= minDelayMs && now - lastBusy >= quietMs) {
        window.clearInterval(id);
        setReady(true);
      }
    }, 400);
    return () => window.clearInterval(id);
  }, [enabled, ready, minDelayMs, quietMs, ignoreSelector]);

  return ready;
}
