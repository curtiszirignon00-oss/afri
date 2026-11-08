import { Request, Response } from 'express';
import { log } from '../config/logger';
import {
  sanitizeClientError,
  isNoise,
  recordClientError,
  listClientErrors,
  setClientErrorResolved,
} from '../services/clientErrors.service';

interface AuthRequest extends Request {
  user?: { id: string; email: string; role?: string };
}

/**
 * POST /api/client-errors — public (optionalAuth), appelé par le front en keepalive.
 * Répond toujours 204 : le navigateur n'a rien à faire du résultat, et un échec
 * d'enregistrement ne doit pas générer d'erreur côté client.
 */
export const reportClientError = async (req: AuthRequest, res: Response) => {
  res.status(204).end();
  try {
    const input = sanitizeClientError(req.body);
    if (!input || isNoise(input)) return;
    if (!input.userAgent) input.userAgent = req.get('user-agent')?.slice(0, 400);
    await recordClientError(input, req.user ? { id: req.user.id, email: req.user.email } : null);
  } catch (error) {
    log.error('[CLIENT-ERRORS] Enregistrement impossible :', error);
  }
};

/** GET /api/admin/client-errors?status=open|resolved|all&q=&limit= */
export const getClientErrors = async (req: Request, res: Response) => {
  try {
    const status = ['open', 'resolved', 'all'].includes(String(req.query.status))
      ? (String(req.query.status) as 'open' | 'resolved' | 'all')
      : 'open';
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 300);
    const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.slice(0, 100) : undefined;
    const data = await listClientErrors({ status, q, limit });
    return res.json({ success: true, data });
  } catch (error) {
    log.error('[CLIENT-ERRORS] Liste impossible :', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/** PATCH /api/admin/client-errors/:id  { resolved: boolean } */
export const updateClientError = async (req: Request, res: Response) => {
  try {
    if (!/^[a-f0-9]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide' });
    }
    const item = await setClientErrorResolved(req.params.id, Boolean(req.body?.resolved));
    return res.json({ success: true, data: { id: item.id, resolved: item.resolved } });
  } catch (error: any) {
    if (error?.code === 'P2025') return res.status(404).json({ success: false, error: 'Erreur introuvable' });
    log.error('[CLIENT-ERRORS] Mise à jour impossible :', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};
