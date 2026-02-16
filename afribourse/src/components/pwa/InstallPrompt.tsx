import { useState } from 'react';
import { Download, X, Smartphone, Share, MoreVertical } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

function InstallInstructions({ platform, onClose }: { platform: 'ios' | 'android' | 'desktop'; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Installer AfriBourse</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {platform === 'ios' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Pour installer l'application sur votre iPhone/iPad :</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span className="text-sm text-gray-700 pt-1">
                  Appuyez sur le bouton <Share className="w-4 h-4 inline text-blue-500 -mt-0.5" /> <strong>Partager</strong> en bas de Safari
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span className="text-sm text-gray-700 pt-1">
                  Faites defiler et appuyez sur <strong>"Sur l'ecran d'accueil"</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span className="text-sm text-gray-700 pt-1">
                  Appuyez sur <strong>"Ajouter"</strong> en haut a droite
                </span>
              </li>
            </ol>
          </div>
        )}

        {platform === 'android' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Pour installer l'application sur votre Android :</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span className="text-sm text-gray-700 pt-1">
                  Appuyez sur <MoreVertical className="w-4 h-4 inline text-gray-600 -mt-0.5" /> le menu <strong>(3 points)</strong> en haut a droite de Chrome
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span className="text-sm text-gray-700 pt-1">
                  Appuyez sur <strong>"Installer l'application"</strong> ou <strong>"Ajouter a l'ecran d'accueil"</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span className="text-sm text-gray-700 pt-1">
                  Confirmez en appuyant sur <strong>"Installer"</strong>
                </span>
              </li>
            </ol>
          </div>
        )}

        {platform === 'desktop' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Pour installer l'application sur votre ordinateur :</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span className="text-sm text-gray-700 pt-1">
                  Dans Chrome, cliquez sur l'icone <Download className="w-4 h-4 inline text-gray-600 -mt-0.5" /> dans la barre d'adresse (a droite)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span className="text-sm text-gray-700 pt-1">
                  Cliquez sur <strong>"Installer"</strong> dans le popup
                </span>
              </li>
            </ol>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Compris !
        </button>
      </div>
    </div>
  );
}

export function InstallPrompt() {
  const { isInstallable, isInstalled, installApp, showInstructions, closeInstructions, platform } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    const d = localStorage.getItem('install-banner-dismissed');
    if (!d) return false;
    // Re-afficher apres 7 jours
    return Date.now() - parseInt(d, 10) < 7 * 24 * 60 * 60 * 1000;
  });

  if (!isInstallable || isInstalled || dismissed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await installApp();
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('install-banner-dismissed', Date.now().toString());
    setDismissed(true);
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom animate-slide-up">
        <div className="mx-2 mb-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl shadow-2xl p-4">
          <button
            onClick={handleDismiss}
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

      {showInstructions && (
        <InstallInstructions platform={platform} onClose={closeInstructions} />
      )}
    </>
  );
}
