import { Request, Response } from 'express';
import { log } from '../config/logger';
import { buildUserData, sendMetaEvent } from '../services/meta-capi.service';

// ============================================================
// Relais des évènements navigateur vers l'API Conversions (CAPI)
// POST /api/meta/track
//
// Le navigateur envoie l'évènement (même `event_id` que le Pixel) ;
// le serveur ajoute IP + User-Agent et le transmet à Meta.
// Public (aucune auth requise — peut concerner un visiteur anonyme).
// ============================================================

/** Récupère l'IP réelle du client (derrière proxy Render/Cloudflare). */
function getClientIp(req: Request): string | undefined {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  if (Array.isArray(xff) && xff.length) return xff[0];
  return req.ip || req.socket?.remoteAddress || undefined;
}

export async function trackMetaEvent(req: Request, res: Response) {
  try {
    const {
      eventName,
      eventId,
      eventSourceUrl,
      eventTime,
      customData,
      userData = {},
      fbp,
      fbc,
    } = req.body ?? {};

    if (!eventName || typeof eventName !== 'string') {
      return res.status(400).json({ error: 'eventName requis' });
    }

    const ud = buildUserData({
      email: userData.email,
      phone: userData.phone,
      firstName: userData.firstName,
      lastName: userData.lastName,
      city: userData.city,
      country: userData.country,
      gender: userData.gender,
      dateOfBirth: userData.dateOfBirth,
      externalId: userData.externalId,
      fbp: fbp ?? userData.fbp,
      fbc: fbc ?? userData.fbc,
      clientIpAddress: getClientIp(req),
      clientUserAgent: req.headers['user-agent'] as string | undefined,
    });

    // Fire-and-forget : ne pas bloquer la réponse au navigateur
    void sendMetaEvent({
      eventName,
      eventId,
      eventTime: typeof eventTime === 'number' ? eventTime : undefined,
      actionSource: 'website',
      eventSourceUrl,
      userData: ud,
      customData: customData && typeof customData === 'object' ? customData : undefined,
    });

    return res.status(202).json({ received: true });
  } catch (error) {
    log.error('[MetaCAPI] Erreur endpoint /meta/track', { error });
    // Ne jamais casser le tracking côté client
    return res.status(202).json({ received: false });
  }
}
