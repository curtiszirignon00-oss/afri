// backend/src/routes/push.routes.ts
import { Router, Request, Response } from 'express';
import { auth } from '../middlewares/auth.middleware';
import {
  saveSubscription,
  removeSubscription,
  getVapidPublicKey,
  sendPushToAll,
  sendPushToUser,
} from '../services/push-notification.service';

const router = Router();

// GET /api/push/vapid-key - Récupérer la clé publique VAPID (public)
router.get('/vapid-key', (_req: Request, res: Response) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res.status(503).json({ error: 'Push notifications non configurées' });
  }
  res.json({ publicKey: key });
});

// POST /api/push/subscribe - S'abonner aux notifications push
router.post('/subscribe', auth, async (req: Request, res: Response) => {
  try {
    const { subscription } = req.body;
    const userId = (req as any).user?.id;

    if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Données d\'abonnement invalides' });
    }

    const saved = await saveSubscription(userId, subscription, req.headers['user-agent']);
    if (saved) {
      res.json({ success: true, message: 'Abonnement push enregistré' });
    } else {
      res.status(500).json({ error: 'Erreur lors de l\'enregistrement' });
    }
  } catch (error) {
    console.error('[Push Route] Subscribe error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/push/unsubscribe - Se désabonner
router.post('/unsubscribe', auth, async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint manquant' });
    }

    await removeSubscription(endpoint);
    res.json({ success: true, message: 'Désabonnement effectué' });
  } catch (error) {
    console.error('[Push Route] Unsubscribe error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/push/send - Envoyer une notification (admin only)
router.post('/send', auth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }

    const { title, body, url, userId } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Titre et message requis' });
    }

    let sent = 0;
    if (userId) {
      // Envoyer à un utilisateur spécifique
      sent = await sendPushToUser(userId, { title, body, url });
    } else {
      // Envoyer à tous les abonnés
      sent = await sendPushToAll({ title, body, url });
    }

    res.json({ success: true, sent, message: `Notification envoyée à ${sent} appareil(s)` });
  } catch (error) {
    console.error('[Push Route] Send error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
