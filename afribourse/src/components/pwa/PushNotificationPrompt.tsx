// afribourse/src/components/pwa/PushNotificationPrompt.tsx
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import {
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  getPlayerId,
  setExternalUserId,
} from '../../services/pushNotifications';
import { useAuth } from '../../contexts/AuthContext';

export function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    // Afficher seulement si:
    // - Push supporte
    // - Permission pas encore demandee
    // - Utilisateur connecte
    // - Pas deja dismiss (localStorage)
    const dismissed = localStorage.getItem('push-prompt-dismissed');
    if (
      isPushSupported() &&
      getPermissionStatus() === 'default' &&
      isLoggedIn &&
      user &&
      !dismissed
    ) {
      // Attendre 30 secondes avant d'afficher
      const timer = setTimeout(() => setShow(true), 30000);
      return () => clearTimeout(timer);
    }
  }, [user, isLoggedIn]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted && user?.id) {
        await setExternalUserId(user.id);
        const playerId = await getPlayerId();
        if (playerId) {
          // Enregistrer le playerId dans le backend
          try {
            await fetch('/api/users/me/push-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerId }),
            });
          } catch (error) {
            console.error('[Push] Failed to save player ID to backend:', error);
          }
        }
      }
    } finally {
      setLoading(false);
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-prompt-dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-slate-800 text-white p-4 rounded-lg shadow-lg border border-slate-700">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-slate-700 rounded"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-500 rounded-full">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Activer les notifications</h3>
          <p className="text-sm text-slate-300 mb-3">
            Recevez des alertes de prix, des rappels de cours et des actualites du marche.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="bg-emerald-500 px-4 py-2 rounded text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? 'Activation...' : 'Activer'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded text-sm hover:bg-slate-700"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
