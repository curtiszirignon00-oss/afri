// src/lib/chunkErrors.ts
// Détection et récupération des échecs de chargement de chunk (deploy en cours,
// ancien onglet, réseau mobile instable). Partagé par main.tsx, lazyWithRetry et
// l'ErrorBoundary pour qu'ils reconnaissent les mêmes erreurs et partagent l'anti-boucle.

// Même clé partout : un seul reload auto par fenêtre de 30 s, quel que soit le déclencheur.
export const CHUNK_RELOAD_KEY = 'afribourse_chunk_reload_attempt';
const RELOAD_WINDOW_MS = 30_000;

export function isChunkLoadError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; message?: string };
  const msg = e.message || '';
  return (
    e.name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) || // Safari / WebKit
    /Unable to preload CSS/i.test(msg) ||
    /is not a valid javascript mime type/i.test(msg)
  );
}

/** true si aucun reload auto n'a eu lieu dans les 30 dernières secondes (et le note). */
export function claimAutoReload(): boolean {
  try {
    if (Date.now() - Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0) < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch { /* stockage indisponible : on autorise le reload */ }
  return true;
}

// Unregister SW + wipe all caches before reloading so the SW cannot re-serve
// stale HTML for JS chunk requests (iOS WebKit rejects text/html for ES modules).
export async function clearSwAndReload(): Promise<never> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (_) {
    // ignore — reload anyway
  }
  window.location.reload();
  return new Promise(() => {}) as never;
}
