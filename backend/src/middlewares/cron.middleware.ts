import { Request, Response, NextFunction } from 'express';
import config from '../config/environnement';

/**
 * Middleware de securisation des endpoints CRON.
 * Accepte les requetes avec:
 * 1. Header Authorization: Bearer <CRON_SECRET>
 * 2. Header Upstash-Signature (verification QStash)
 */
export async function verifyCronAuth(req: Request, res: Response, next: NextFunction) {
  const cronSecret = config.cron.secret;

  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET non configure. Requete rejetee.');
    return res.status(500).json({ error: 'CRON_SECRET non configure sur le serveur' });
  }

  // Methode 1: Bearer token (secret simple)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader === `Bearer ${cronSecret}`) {
    return next();
  }

  // Methode 2: Signature Upstash QStash
  const qstashSignature = req.headers['upstash-signature'] as string | undefined;
  if (qstashSignature && config.cron.qstashToken) {
    try {
      const { Receiver } = await import('@upstash/qstash');
      const receiver = new Receiver({
        currentSigningKey: config.cron.qstashToken,
        nextSigningKey: config.cron.qstashToken,
      });

      const body = JSON.stringify(req.body) || '';
      const isValid = await receiver.verify({
        signature: qstashSignature,
        body,
      });

      if (isValid) {
        return next();
      }
    } catch (error) {
      console.error('[CRON] Verification signature QStash echouee:', error);
    }
  }

  console.warn(`[CRON] Requete CRON non autorisee depuis ${req.ip}`);
  return res.status(401).json({ error: 'Non autorise: identifiants CRON invalides' });
}
