import { ComponentType, lazy } from 'react';

// Wrapper autour de React.lazy avec retry réseau et auto-reload après deploy.
//
// Pourquoi :
// 1. Sur mobile flaky (3G/4G instable), un dynamic import() peut échouer ponctuellement
//    (timeout, perte réseau brève). Sans retry → ChunkLoadError → ErrorBoundary.
// 2. Après un deploy, le SW peut servir l'ancien index.html qui référence d'anciens hash
//    de chunks. Si l'utilisateur navigue vers une route lazy, le chunk demandé n'existe
//    plus sur le serveur (nouveau hash) → 404 → erreur. On force un reload pour récupérer
//    l'index.html à jour.
//
// Stratégie : 1 retry après 500ms. Si l'erreur persiste ET ressemble à un chunk-load,
// on déclenche un window.location.reload() (one-shot par session, anti-boucle).

const RELOAD_FLAG = 'afribourse_lazy_reload_attempt';

function isChunkLoadError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; message?: string };
  const msg = e.message || '';
  return (
    e.name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /is not a valid javascript mime type/i.test(msg)
  );
}

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): ReturnType<typeof lazy<T>> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      // Premier échec : on retente une fois après un court délai
      console.warn('[lazyWithRetry] échec import, retry dans 500ms', err);
      await new Promise((r) => setTimeout(r, 500));
      try {
        return await factory();
      } catch (err2) {
        // Second échec : si c'est un chunk-load (probable deploy/cache stale), on recharge
        if (isChunkLoadError(err2) && typeof window !== 'undefined') {
          const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
          if (Date.now() - last > 30_000) {
            sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
            console.error('[lazyWithRetry] chunk introuvable après retry, reload');
            window.location.reload();
            // Reload imminent — on retourne une promise pendante pour éviter un re-throw
            return new Promise(() => {}) as never;
          }
        }
        throw err2;
      }
    }
  });
}
