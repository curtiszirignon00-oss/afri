import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import { signJWT } from '../utils';
import config from '../config/environnement';

const router = Router();

// ─── Helper : générer JWT et rediriger vers le frontend ──────────────────────
function handleOAuthCallback(provider: string) {
  return (req: Request, res: Response) => {
    const user = req.user as any;
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

// ─── GOOGLE ───────────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { session: false, scope: ['email', 'profile'] })
);
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${config.app.frontendUrl}/login?error=google_failed`,
  }),
  handleOAuthCallback('google')
);

// ─── X / TWITTER (OAuth 1.0a — pas de session: false, Twitter l'exige) ───────
router.get(
  '/twitter',
  passport.authenticate('twitter')
);
router.get(
  '/twitter/callback',
  passport.authenticate('twitter', {
    failureRedirect: `${config.app.frontendUrl}/login?error=twitter_failed`,
  }),
  handleOAuthCallback('twitter')
);

// ─── LINKEDIN ─────────────────────────────────────────────────────────────────
router.get(
  '/linkedin',
  passport.authenticate('linkedin', { session: false })
);
router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', {
    session: false,
    failureRedirect: `${config.app.frontendUrl}/login?error=linkedin_failed`,
  }),
  handleOAuthCallback('linkedin')
);

export default router;
