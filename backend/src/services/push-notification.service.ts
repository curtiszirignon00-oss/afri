// backend/src/services/push-notification.service.ts
// Système de notifications push natif avec Web Push API (sans OneSignal)
import webpush from 'web-push';
import prisma from '../config/prisma';

// Configuration VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:noreply@africbourse.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[Push] Web Push configured with VAPID keys');
} else {
  console.warn('[Push] VAPID keys not configured, push notifications disabled');
}

// =============================================
// Gestion des abonnements
// =============================================

interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Sauvegarder un abonnement push pour un utilisateur
 */
export async function saveSubscription(userId: string, subscription: PushSubscriptionInput, userAgent?: string) {
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent,
      },
    });
    return true;
  } catch (error) {
    console.error('[Push] Failed to save subscription:', error);
    return false;
  }
}

/**
 * Supprimer un abonnement push
 */
export async function removeSubscription(endpoint: string) {
  try {
    await prisma.pushSubscription.delete({ where: { endpoint } });
    return true;
  } catch (error) {
    console.error('[Push] Failed to remove subscription:', error);
    return false;
  }
}

// =============================================
// Envoi de notifications
// =============================================

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

/**
 * Envoyer une notification push à un utilisateur
 */
export async function sendPushToUser(userId: string, payload: NotificationPayload): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return 0;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return 0;

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/AppImages/android/android-launchericon-192-192.png',
    badge: payload.badge || '/AppImages/android/android-launchericon-96-96.png',
    data: {
      url: payload.url || '/',
      ...payload.data,
    },
    tag: payload.tag,
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notification
      );
      sent++;
    } catch (error: any) {
      // 410 Gone ou 404 = abonnement expiré, le supprimer
      if (error.statusCode === 410 || error.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        console.error(`[Push] Failed to send to ${sub.endpoint.slice(0, 50)}:`, error.statusCode || error.message);
      }
    }
  }

  return sent;
}

/**
 * Envoyer une notification push à plusieurs utilisateurs
 */
export async function sendPushToUsers(userIds: string[], payload: NotificationPayload): Promise<number> {
  let total = 0;
  for (const userId of userIds) {
    total += await sendPushToUser(userId, payload);
  }
  return total;
}

/**
 * Envoyer une notification à TOUS les abonnés
 */
export async function sendPushToAll(payload: NotificationPayload): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return 0;

  const subscriptions = await prisma.pushSubscription.findMany();
  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/AppImages/android/android-launchericon-192-192.png',
    badge: payload.badge || '/AppImages/android/android-launchericon-96-96.png',
    data: { url: payload.url || '/', ...payload.data },
    tag: payload.tag,
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      );
      sent++;
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }

  return sent;
}

// =============================================
// Fonctions utilitaires par type de notification
// =============================================

export async function sendPriceAlertNotification(userId: string, stockTicker: string, price: number, alertType: 'above' | 'below') {
  const direction = alertType === 'above' ? 'depasse' : 'est passe sous';
  return sendPushToUser(userId, {
    title: `Alerte ${stockTicker}`,
    body: `Le cours de ${stockTicker} ${direction} ${price} FCFA`,
    url: `/stock/${stockTicker}`,
    tag: `price-alert-${stockTicker}`,
  });
}

export async function sendNewLessonNotification(userIds: string[], moduleTitle: string, moduleSlug: string) {
  return sendPushToUsers(userIds, {
    title: 'Nouveau cours disponible!',
    body: `Decouvrez le nouveau module: ${moduleTitle}`,
    url: `/learn`,
    tag: 'new-lesson',
  });
}

export async function sendAchievementUnlockedNotification(userId: string, achievementName: string, xpReward: number) {
  return sendPushToUser(userId, {
    title: 'Badge debloque!',
    body: `Felicitations! Vous avez debloque "${achievementName}" et gagne ${xpReward} XP!`,
    url: '/achievements',
    tag: 'achievement',
  });
}

export async function sendDailyReminderNotification(userIds: string[]) {
  return sendPushToUsers(userIds, {
    title: 'Votre streak vous attend!',
    body: 'Connectez-vous pour maintenir votre serie et gagner des bonus XP!',
    url: '/dashboard',
    tag: 'daily-reminder',
  });
}

export async function sendWeeklyChallengeNotification(userIds: string[], challengeTitle: string) {
  return sendPushToUsers(userIds, {
    title: 'Nouveau defi hebdomadaire!',
    body: `Relevez le defi: ${challengeTitle}`,
    url: '/dashboard',
    tag: 'weekly-challenge',
  });
}

/**
 * Retourne la clé publique VAPID (pour le frontend)
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
