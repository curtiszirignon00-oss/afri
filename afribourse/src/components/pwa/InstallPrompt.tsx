import { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export function InstallPrompt() {
  const { isInstallable, isInstalled, installApp, dismiss } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);

  if (!isInstallable || isInstalled) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await installApp();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom animate-slide-up">
      <div className="mx-2 mb-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl shadow-2xl p-4">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 p-2.5 bg-white/20 rounded-xl">
            <Smartphone className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm">Installer AfriBourse</h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Acces rapide, mode hors ligne, notifications
            </p>
          </div>

          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-shrink-0 flex items-center gap-1.5 bg-white text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {installing ? '...' : 'Installer'}
          </button>
        </div>
      </div>
    </div>
  );
}
