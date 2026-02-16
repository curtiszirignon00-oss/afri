// afribourse/src/services/pushNotifications.ts
// Push notifications natif avec Web Push API (sans OneSignal)

const API_BASE = import.meta.env.VITE_API_URL || '';

let vapidPublicKey: string | null = null;

/**
 * Initialiser les push notifications (récupérer la clé VAPID)
 */
export async function initPushNotifications() {
  if (!isPushSupported()) {
    console.warn('[Push] Push notifications not supported in this browser');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/push/vapid-key`);
    if (res.ok) {
      const data = await res.json();
      vapidPublicKey = data.publicKey;
      console.log('[Push] VAPID key loaded');
    }
  } catch (error) {
    console.warn('[Push] Failed to load VAPID key:', error);
  }
}

/**
 * S'abonner aux notifications push
 */
export async function subscribeToPush(authToken: string): Promise<boolean> {
  if (!vapidPublicKey || !isPushSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;

    // Vérifier si déjà abonné
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    // Envoyer l'abonnement au backend
    const res = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (res.ok) {
      console.log('[Push] Subscribed successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Push] Subscribe error:', error);
    return false;
  }
}

/**
 * Se désabonner des notifications push
 */
export async function unsubscribeFromPush(authToken: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => {});

      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error('[Push] Unsubscribe error:', error);
    return false;
  }
}

/**
 * Vérifier si les push sont supportées
 */
export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Obtenir le statut de la permission
 */
export function getPermissionStatus(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Vérifier si l'utilisateur est déjà abonné
 */
export async function isSubscribed(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

// Utilitaire: convertir une clé base64url en Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
