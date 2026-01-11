// backend/src/controllers/price-alert.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as priceAlertService from '../services/price-alert.service.prisma';

// Interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

// GET /api/price-alerts - Récupérer toutes les alertes de l'utilisateur
export async function getUserAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const { stockTicker } = req.query;

    let alerts;
    if (stockTicker && typeof stockTicker === 'string') {
      alerts = await priceAlertService.getUserPriceAlertsByTicker(userId, stockTicker.toUpperCase());
    } else {
      alerts = await priceAlertService.getUserPriceAlerts(userId);
    }

    return res.status(200).json(alerts);
  } catch (error) {
    return next(error);
  }
}

// POST /api/price-alerts - Créer une nouvelle alerte
export async function createAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const { stockTicker, alertType, targetPrice, notifyEmail, notifyInApp, subscriptionTier } = req.body;

    // Validation
    if (!stockTicker || typeof stockTicker !== 'string') {
      return res.status(400).json({ message: 'Ticker invalide' });
    }

    if (!alertType || !['ABOVE', 'BELOW'].includes(alertType)) {
      return res.status(400).json({ message: 'Type d\'alerte invalide. Utilisez ABOVE ou BELOW.' });
    }

    if (!targetPrice || typeof targetPrice !== 'number' || targetPrice <= 0) {
      return res.status(400).json({ message: 'Prix cible invalide' });
    }

    const newAlert = await priceAlertService.createPriceAlert(
      userId,
      stockTicker.toUpperCase(),
      alertType,
      targetPrice,
      notifyEmail !== false, // Par défaut true
      notifyInApp !== false, // Par défaut true
      subscriptionTier || 'free' // Par défaut free
    );

    return res.status(201).json(newAlert);
  } catch (error: any) {
    // Gestion spécifique de l'erreur de limite
    if (error.message && error.message.includes('Limite d\'alertes atteinte')) {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  }
}

// PUT /api/price-alerts/:id - Mettre à jour une alerte
export async function updateAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const alertId = req.params.id;
    const { targetPrice, alertType, notifyEmail, notifyInApp } = req.body;

    const updates: any = {};
    if (targetPrice !== undefined) updates.target_price = targetPrice;
    if (alertType !== undefined) updates.alert_type = alertType;
    if (notifyEmail !== undefined) updates.notify_email = notifyEmail;
    if (notifyInApp !== undefined) updates.notify_in_app = notifyInApp;

    const updatedAlert = await priceAlertService.updatePriceAlert(alertId, userId, updates);

    return res.status(200).json(updatedAlert);
  } catch (error: any) {
    if (error.message === 'Alerte non trouvée') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Non autorisé à modifier cette alerte') {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  }
}

// PATCH /api/price-alerts/:id/toggle - Activer/Désactiver une alerte
export async function toggleAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const alertId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive doit être un booléen' });
    }

    const updatedAlert = await priceAlertService.togglePriceAlert(alertId, userId, isActive);

    return res.status(200).json(updatedAlert);
  } catch (error: any) {
    if (error.message === 'Alerte non trouvée') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Non autorisé à modifier cette alerte') {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  }
}

// DELETE /api/price-alerts/:id - Supprimer une alerte
export async function deleteAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const alertId = req.params.id;

    await priceAlertService.deletePriceAlert(alertId, userId);

    return res.status(204).send(); // 204 No Content
  } catch (error: any) {
    if (error.message === 'Alerte non trouvée') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Non autorisé à supprimer cette alerte') {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  }
}

// GET /api/price-alerts/:id/notifications - Récupérer l'historique des notifications
export async function getAlertNotifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const alertId = req.params.id;

    // Vérifier que l'alerte appartient à l'utilisateur
    const alerts = await priceAlertService.getUserPriceAlerts(userId);
    const userAlert = alerts.find(alert => alert.id === alertId);

    if (!userAlert) {
      return res.status(404).json({ message: 'Alerte non trouvée' });
    }

    const notifications = await priceAlertService.getAlertNotifications(alertId);

    return res.status(200).json(notifications);
  } catch (error) {
    return next(error);
  }
}
