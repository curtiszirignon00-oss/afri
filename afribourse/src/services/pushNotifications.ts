// afribourse/src/services/pushNotifications.ts
// Push notifications natif avec Web Push API (sans OneSignal)

import { getCsrfToken, fetchCsrfToken } from '../config/api';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function getCsrfHeader(): Promise<Record<string, string>> {
  if (!getCsrfToken()) await fetchCsrfToken();
  const token = getCsrfToken();
  return token ? { 'X-CSRF-Token': token } : {};
}

let vapidPublicKey: string | null = null;

/**
 * Initialiser les push notifications (récupérer la clé VAPID)
 */
export async function initPushNotifications() {
  if (!isPushSupported()) return;

  try {
    const res = await fetch(`${API_BASE}/push/vapid-key`);
    if (res.ok) {
      const data = await res.json();
      vapidPublicKey = data.publicKey;
    }
  } catch {
    // Silencieux — les push ne seront pas disponibles
  }
}

/**
 * S'abonner aux notifications push
 */
export async function subscribeToPush(): Promise<boolean> {
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
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as Uint8Array<ArrayBuffer>,
      });
    }

    // Envoyer l'abonnement au backend — cookie httpOnly envoyé automatiquement
    const res = await fetch(`${API_BASE}/push/subscribe`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...await getCsrfHeader() },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (res.ok) {
      console.log('[Push] Subscribed successfully');
      return true;
    }

    return false;
  } catch {
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
      await fetch(`${API_BASE}/push/unsubscribe`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          ...await getCsrfHeader(),
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      }).catch(() => {});

      await subscription.unsubscribe();
    }

    return true;
  } catch {
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
