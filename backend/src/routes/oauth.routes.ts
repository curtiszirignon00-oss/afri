import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import { signJWT } from '../utils';
import config from '../config/environnement';

const router = Router();

// ─── Helper : générer JWT et rediriger vers le frontend ──────────────────────
function handleOAuthCallback(provider: string) {
  return (req: Request, res: Response) => {
    const user = req.user as any;
    console.log(`[OAuth] handleOAuthCallback ${provider}, req.user:`, user ? `id=${user.id} email=${user.email}` : 'NULL');
    if (!user) {
      return res.redirect(
        `${config.app.frontendUrl}/login?error=oauth_failed`
      );
    }

    const token = signJWT({ id: user.id, email: user.email, role: user.role });

    // Stocker le JWT dans un cookie httpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
    });

    // Rediriger vers le dashboard avec le token en query param (pour mobile/localStorage)
    res.redirect(
      `${config.app.frontendUrl}/dashboard?oauth=success&provider=${provider}&token=${token}`
    );
  };
}

// ─── TEST (diagnostic) ────────────────────────────────────────────────────────
router.get('/test', (_req, res) => {
  res.json({ status: 'oauth router ok', ts: new Date().toISOString() });
});

// ─── GOOGLE ───────────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { session: false, scope: ['email', 'profile'] })
);
router.get(
  '/google/callback',
  (req, res, next) => {
    console.log('[OAuth] Google callback received. query:', JSON.stringify(req.query));
    passport.authenticate('google', { session: false }, (err: any, user: any, info: any) => {
      console.log('[OAuth] Google authenticate result:', {
        err: err ? String(err) : null,
        user: user ? `id=${user.id}` : null,
        info: info ? String(info) : null,
      });
      if (err || !user) {
        return res.redirect(`${config.app.frontendUrl}/login?error=google_failed&detail=${encodeURIComponent(err?.message || info?.message || 'unknown')}`);
      }
      req.user = user;
      return handleOAuthCallback('google')(req, res);
    })(req, res, next);
  }
);

// ─── X / TWITTER ──────────────────────────────────────────────────────────────
router.get(
  '/twitter',
  (req, res, next) => {
    console.log('[OAuth] Twitter init. sessionID:', (req as any).sessionID, 'CLIENT_ID set:', !!process.env.TWITTER_CLIENT_ID);
    const originalRedirect = res.redirect.bind(res);
    (res as any).redirect = (url: string) => {
      console.log('[OAuth] Twitter redirect URL:', url);
      return originalRedirect(url);
    };
    passport.authenticate('twitter')(req, res, next);
  }
);
router.get(
  '/twitter/callback',
  (req, res, next) => {
    console.log('[OAuth] Twitter callback query:', JSON.stringify(req.query));
    console.log('[OAuth] Twitter callback sessionID:', (req as any).sessionID, 'session keys:', req.session ? Object.keys(req.session) : 'NO SESSION');
    passport.authenticate('twitter', {}, (err: any, user: any, info: any) => {
      console.log('[OAuth] Twitter authenticate result:', {
        err: err ? String(err) : null,
        user: user ? `id=${user.id}` : null,
        info: info ? String(info) : null,
      });
      if (err || !user) {
        return res.redirect(`${config.app.frontendUrl}/login?error=twitter_failed&detail=${encodeURIComponent(err?.message || info?.message || req.query.error || 'unknown')}`);
      }
      req.user = user;
      return handleOAuthCallback('twitter')(req, res);
    })(req, res, next);
  }
);

// ─── LINKEDIN ─────────────────────────────────────────────────────────────────
router.get(
  '/linkedin',
  passport.authenticate('linkedin')
);
router.get(
  '/linkedin/callback',
  (req, res, next) => {
    console.log('[OAuth] LinkedIn callback query:', JSON.stringify(req.query));
    passport.authenticate('linkedin', {}, (err: any, user: any, info: any) => {
      console.log('[OAuth] LinkedIn authenticate result:', {
        err: err ? String(err) : null,
        user: user ? `id=${user.id}` : null,
        info: info ? String(info) : null,
      });
      if (err || !user) {
        return res.redirect(`${config.app.frontendUrl}/login?error=linkedin_failed&detail=${encodeURIComponent(err?.message || info?.message || req.query.error || 'unknown')}`);
      }
      req.user = user;
      return handleOAuthCallback('linkedin')(req, res);
    })(req, res, next);
  }
);

export default router;
