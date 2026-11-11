import { ComponentType, lazy } from 'react';
import { isChunkLoadError, claimAutoReload, clearSwAndReload, isReloadScheduled } from './chunkErrors';

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
// on déclenche un window.location.reload() (one-shot, anti-boucle partagée — cf. chunkErrors).

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): ReturnType<typeof lazy<T>> {
  // Quand main.tsx intercepte vite:preloadError (preventDefault + reload), Vite résout
  // l'import() à undefined au lieu de rejeter : React.lazy lirait alors `.default` d'undefined
  // (« Cannot read properties of undefined (reading 'default') »). On valide le module.
  const load = async (): Promise<{ default: T }> => {
    const mod = await factory();
    if (mod && mod.default) return mod;
    // Reload déjà lancé : on reste sur le fallback Suspense jusqu'au rechargement.
    if (isReloadScheduled()) return new Promise<never>(() => {});
    throw new Error('Failed to fetch dynamically imported module (module vide)');
  };

  return lazy(async () => {
    try {
      return await load();
    } catch (err) {
      // Premier échec : on retente une fois après un court délai
      console.warn('[lazyWithRetry] échec import, retry dans 500ms', err);
      await new Promise((r) => setTimeout(r, 500));
      try {
        return await load();
      } catch (err2) {
        // Second échec : si c'est un chunk-load (probable deploy/cache stale), on recharge
        if (isChunkLoadError(err2) && typeof window !== 'undefined' && claimAutoReload()) {
          console.error('[lazyWithRetry] chunk introuvable après retry, reload SW+cache clear');
          return clearSwAndReload();
        }
        throw err2;
      }
    }
  });
}
