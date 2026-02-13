// afribourse/src/components/pwa/UpdatePrompt.tsx
import { useServiceWorker } from '../../hooks/useServiceWorker';
import { RefreshCw, X } from 'lucide-react';

export function UpdatePrompt() {
  const { offlineReady, needRefresh, updateServiceWorker, close } = useServiceWorker();

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
      {offlineReady ? (
        <div className="flex items-center gap-3">
          <span>Application prete pour utilisation hors ligne</span>
          <button onClick={close} className="p-1 hover:bg-slate-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <span>Nouvelle version disponible!</span>
          <div className="flex gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex items-center gap-2 bg-emerald-500 px-3 py-1 rounded hover:bg-emerald-600"
            >
              <RefreshCw className="w-4 h-4" />
              Mettre a jour
            </button>
            <button onClick={close} className="px-3 py-1 hover:bg-slate-700 rounded">
              Plus tard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
