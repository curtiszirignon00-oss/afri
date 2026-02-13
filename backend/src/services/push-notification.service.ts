// backend/src/services/push-notification.service.ts
import axios from 'axios';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

interface NotificationPayload {
  userIds: string[];  // External user IDs (nos user IDs)
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

/**
 * Envoie une notification push via OneSignal
 */
export async function sendPushNotification(payload: NotificationPayload): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('[OneSignal] Not configured, skipping push notification');
    return false;
  }

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      {
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: payload.userIds,
        headings: { en: payload.title, fr: payload.title },
        contents: { en: payload.message, fr: payload.message },
        url: payload.url,
        data: payload.data,
      },
      {
        headers: {
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('[OneSignal] Notification sent:', response.data.id);
    return response.data.id != null;
  } catch (error: any) {
    console.error('[OneSignal] Error sending notification:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Notification d'alerte de prix
 */
export async function sendPriceAlertNotification(
  userId: string,
  stockTicker: string,
  price: number,
  alertType: 'above' | 'below'
) {
  const direction = alertType === 'above' ? 'depasse' : 'est passe sous';
  return sendPushNotification({
    userIds: [userId],
    title: `Alerte ${stockTicker}`,
    message: `Le cours de ${stockTicker} ${direction} ${price} FCFA`,
    url: `/stocks/${stockTicker}`,
    data: { type: 'price_alert', ticker: stockTicker },
  });
}

/**
 * Notification de nouveau cours disponible
 */
export async function sendNewLessonNotification(
  userIds: string[],
  moduleTitle: string,
  moduleSlug: string
) {
  return sendPushNotification({
    userIds,
    title: 'Nouveau cours disponible!',
    message: `Decouvrez le nouveau module: ${moduleTitle}`,
    url: `/learn/${moduleSlug}`,
    data: { type: 'new_lesson', slug: moduleSlug },
  });
}

/**
 * Notification de badge debloque
 */
export async function sendAchievementUnlockedNotification(
  userId: string,
  achievementName: string,
  xpReward: number
) {
  return sendPushNotification({
    userIds: [userId],
    title: 'Badge debloque!',
    message: `Felicitations! Vous avez debloque le badge "${achievementName}" et gagne ${xpReward} XP!`,
    url: '/achievements',
    data: { type: 'achievement_unlocked', achievement: achievementName },
  });
}

/**
 * Notification de rappel quotidien
 */
export async function sendDailyReminderNotification(
  userIds: string[]
) {
  return sendPushNotification({
    userIds,
    title: 'Votre streak vous attend!',
    message: 'Connectez-vous pour maintenir votre serie et gagner des bonus XP!',
    url: '/dashboard',
    data: { type: 'daily_reminder' },
  });
}

/**
 * Notification de defi hebdomadaire
 */
export async function sendWeeklyChallengeNotification(
  userIds: string[],
  challengeTitle: string
) {
  return sendPushNotification({
    userIds,
    title: 'Nouveau defi hebdomadaire!',
    message: `Relevez le defi: ${challengeTitle}`,
    url: '/dashboard',
    data: { type: 'weekly_challenge', challenge: challengeTitle },
  });
}
