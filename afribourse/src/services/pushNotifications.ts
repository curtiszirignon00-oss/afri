// afribourse/src/services/pushNotifications.ts
import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

let initialized = false;

export async function initPushNotifications() {
  if (initialized || !ONESIGNAL_APP_ID) {
    if (!ONESIGNAL_APP_ID) {
      console.warn('[OneSignal] APP_ID not configured, push notifications disabled');
    }
    return;
  }

  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      safari_web_id: 'web.onesignal.auto.68a9d4a9-72e3-41ba-a788-4f8badeb71ae',
      allowLocalhostAsSecureOrigin: true,
    });
    initialized = true;
    console.log('[OneSignal] Initialized successfully');
  } catch (error) {
    console.error('[OneSignal] Init error:', error);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permission = await OneSignal.Notifications.requestPermission();
    return permission;
  } catch (error) {
    console.error('[OneSignal] Permission request error:', error);
    return false;
  }
}

export async function getPlayerId(): Promise<string | null> {
  try {
    const playerId = OneSignal.User.onesignalId;
    return playerId ?? null;
  } catch (error) {
    console.error('[OneSignal] Get player ID error:', error);
    return null;
  }
}

export async function setUserTags(tags: Record<string, string>) {
  try {
    OneSignal.User.addTags(tags);
  } catch (error) {
    console.error('[OneSignal] Set tags error:', error);
  }
}

export async function setExternalUserId(userId: string) {
  try {
    await OneSignal.login(userId);
  } catch (error) {
    console.error('[OneSignal] Set external user ID error:', error);
  }
}

export async function logout() {
  try {
    await OneSignal.logout();
  } catch (error) {
    console.error('[OneSignal] Logout error:', error);
  }
}

export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

export function getPermissionStatus(): NotificationPermission {
  if (!isPushSupported()) {
    return 'denied';
  }
  return Notification.permission;
}
