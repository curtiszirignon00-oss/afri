// backend/src/services/price-alert.service.prisma.ts

import prisma from '../config/prisma';
import { PriceAlert, PriceAlertNotification } from '@prisma/client';

// Type pour les alertes avec la relation user
export type PriceAlertWithUser = PriceAlert & {
  user: {
    id: string;
    email: string;
    name: string | null;
    lastname: string | null;
  };
};

// Limites d'alertes selon l'abonnement
const ALERT_LIMITS: Record<string, number> = {
  free: 3,
  premium: 15,
  pro: Infinity,
  max: Infinity, // Alias pour le plan max
};

// Récupérer toutes les alertes d'un utilisateur
export async function getUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
  try {
    const alerts = await prisma.priceAlert.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return alerts;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des alertes pour l'utilisateur ${userId}:`, error);
    throw error;
  }
}

// Récupérer les alertes d'un utilisateur pour un ticker spécifique
export async function getUserPriceAlertsByTicker(userId: string, stockTicker: string): Promise<PriceAlert[]> {
  try {
    const alerts = await prisma.priceAlert.findMany({
      where: {
        userId: userId,
        stock_ticker: stockTicker,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return alerts;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des alertes pour ${stockTicker}:`, error);
    throw error;
  }
}

// Récupérer toutes les alertes actives (pour le cron job)
export async function getActiveAlerts(): Promise<PriceAlertWithUser[]> {
  try {
    const alerts = await prisma.priceAlert.findMany({
      where: {
        is_active: true,
        is_notified: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            lastname: true,
          },
        },
      },
    });
    return alerts;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des alertes actives:', error);
    throw error;
  }
}

// Créer une nouvelle alerte
export async function createPriceAlert(
  userId: string,
  stockTicker: string,
  alertType: 'ABOVE' | 'BELOW',
  targetPrice: number,
  notifyEmail: boolean = true,
  notifyInApp: boolean = true,
  userSubscriptionTier: 'free' | 'premium' | 'pro' | 'max' = 'free'
): Promise<PriceAlert> {
  try {
    // Vérifier la limite d'alertes pour l'utilisateur
    const existingAlerts = await prisma.priceAlert.count({
      where: {
        userId: userId,
        is_active: true,
      },
    });

    const limit = ALERT_LIMITS[userSubscriptionTier];
    if (existingAlerts >= limit) {
      throw new Error(
        `Limite d'alertes atteinte (${limit}). Passez à un plan supérieur pour créer plus d'alertes.`
      );
    }

    const newAlert = await prisma.priceAlert.create({
      data: {
        userId: userId,
        stock_ticker: stockTicker,
        alert_type: alertType,
        target_price: targetPrice,
        notify_email: notifyEmail,
        notify_in_app: notifyInApp,
      },
    });

    return newAlert;
  } catch (error) {
    console.error(`❌ Erreur lors de la création de l'alerte pour ${stockTicker}:`, error);
    throw error;
  }
}

// Mettre à jour une alerte
export async function updatePriceAlert(
  alertId: string,
  userId: string,
  updates: {
    target_price?: number;
    alert_type?: 'ABOVE' | 'BELOW';
    notify_email?: boolean;
    notify_in_app?: boolean;
  }
): Promise<PriceAlert> {
  try {
    // Vérifier que l'alerte appartient à l'utilisateur
    const existingAlert = await prisma.priceAlert.findUnique({
      where: { id: alertId },
    });

    if (!existingAlert) {
      throw new Error('Alerte non trouvée');
    }

    if (existingAlert.userId !== userId) {
      throw new Error('Non autorisé à modifier cette alerte');
    }

    const updatedAlert = await prisma.priceAlert.update({
      where: { id: alertId },
      data: updates,
    });

    return updatedAlert;
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour de l'alerte ${alertId}:`, error);
    throw error;
  }
}

// Activer/Désactiver une alerte
export async function togglePriceAlert(alertId: string, userId: string, isActive: boolean): Promise<PriceAlert> {
  try {
    // Vérifier que l'alerte appartient à l'utilisateur
    const existingAlert = await prisma.priceAlert.findUnique({
      where: { id: alertId },
    });

    if (!existingAlert) {
      throw new Error('Alerte non trouvée');
    }

    if (existingAlert.userId !== userId) {
      throw new Error('Non autorisé à modifier cette alerte');
    }

    const updatedAlert = await prisma.priceAlert.update({
      where: { id: alertId },
      data: {
        is_active: isActive,
        // Si on réactive, réinitialiser is_notified
        ...(isActive && { is_notified: false, triggered_at: null, triggered_price: null }),
      },
    });

    return updatedAlert;
  } catch (error) {
    console.error(`❌ Erreur lors de la modification du statut de l'alerte ${alertId}:`, error);
    throw error;
  }
}

// Supprimer une alerte
export async function deletePriceAlert(alertId: string, userId: string): Promise<{ success: boolean }> {
  try {
    // Vérifier que l'alerte appartient à l'utilisateur
    const existingAlert = await prisma.priceAlert.findUnique({
      where: { id: alertId },
    });

    if (!existingAlert) {
      throw new Error('Alerte non trouvée');
    }

    if (existingAlert.userId !== userId) {
      throw new Error('Non autorisé à supprimer cette alerte');
    }

    await prisma.priceAlert.delete({
      where: { id: alertId },
    });

    return { success: true };
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de l'alerte ${alertId}:`, error);
    throw error;
  }
}

// Marquer une alerte comme déclenchée
export async function markAlertAsTriggered(
  alertId: string,
  triggeredPrice: number
): Promise<PriceAlert> {
  try {
    const updatedAlert = await prisma.priceAlert.update({
      where: { id: alertId },
      data: {
        is_notified: true,
        is_active: false, // Désactiver automatiquement après déclenchement
        triggered_at: new Date(),
        triggered_price: triggeredPrice,
      },
    });

    return updatedAlert;
  } catch (error) {
    console.error(`❌ Erreur lors du marquage de l'alerte ${alertId} comme déclenchée:`, error);
    throw error;
  }
}

// Créer un enregistrement de notification
export async function createPriceAlertNotification(
  priceAlertId: string,
  triggeredPrice: number,
  notificationMethod: 'EMAIL' | 'IN_APP' | 'BOTH',
  emailSent: boolean = false
): Promise<PriceAlertNotification> {
  try {
    const notification = await prisma.priceAlertNotification.create({
      data: {
        priceAlertId: priceAlertId,
        triggered_price: triggeredPrice,
        notification_method: notificationMethod,
        email_sent: emailSent,
        email_sent_at: emailSent ? new Date() : null,
      },
    });

    return notification;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la notification:', error);
    throw error;
  }
}

// Récupérer l'historique des notifications pour une alerte
export async function getAlertNotifications(alertId: string): Promise<PriceAlertNotification[]> {
  try {
    const notifications = await prisma.priceAlertNotification.findMany({
      where: {
        priceAlertId: alertId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return notifications;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des notifications pour l'alerte ${alertId}:`, error);
    throw error;
  }
}

// Vérifier si une alerte doit être déclenchée
export function shouldTriggerAlert(currentPrice: number, alert: PriceAlert): boolean {
  if (!alert.is_active || alert.is_notified) {
    return false;
  }

  if (alert.alert_type === 'ABOVE') {
    return currentPrice >= alert.target_price;
  } else if (alert.alert_type === 'BELOW') {
    return currentPrice <= alert.target_price;
  }

  return false;
}
