import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import prisma from './prisma';

// ═══════════════════════════════════════════════════════
// STATE STORE IN-MEMORY (remplace le store basé session)
// Le cookie de session n'est pas transmis de manière
// fiable lors des redirections OAuth cross-site sur Render.
// Ce store utilise une Map Node.js, valide pour single-instance.
// ═══════════════════════════════════════════════════════
class MemoryStateStore {
  private _states = new Map<string, { codeVerifier?: string; expires: number }>();

  constructor() {
    // Nettoyage des états expirés toutes les 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, val] of this._states.entries()) {
        if (val.expires < now) this._states.delete(key);
      }
    }, 5 * 60 * 1000).unref();
  }

  store(_req: any, state: string, meta: any, callback: (err: any, state?: string) => void) {
    this._states.set(state, {
      codeVerifier: meta?.codeVerifier,
      expires: Date.now() + 10 * 60 * 1000, // 10 min
    });
    callback(null, state); // retourner state pour qu'il soit ajouté à l'URL
  }

  verify(_req: any, providedState: string, callback: (err: any, ok: boolean, state?: any) => void) {
    const data = this._states.get(providedState);
    if (!data || data.expires < Date.now()) {
      this._states.delete(providedState);
      return callback(null, false, { message: 'Invalid or expired OAuth state' });
    }
    this._states.delete(providedState);
    callback(null, true, { codeVerifier: data.codeVerifier });
  }
}

const twitterStateStore = new MemoryStateStore();
const linkedinStateStore = new MemoryStateStore();

// ═══════════════════════════════════════════════════════
// HELPER : Trouver ou créer un user OAuth
// ═══════════════════════════════════════════════════════
export async function findOrCreateOAuthUser(profile: any, provider: string) {
  const providerUserId = profile.id;
  const email = profile.emails?.[0]?.value;
  const avatar = profile.photos?.[0]?.value;
  const displayName = profile.displayName || profile.username || '';
  const firstName =
    profile.name?.givenName || displayName.split(' ')[0] || 'Utilisateur';
  const lastName =
    profile.name?.familyName ||
    displayName.split(' ').slice(1).join(' ') ||
    '';

  // 1. Compte OAuth déjà lié ?
  const existingOAuth = await (prisma as any).oAuthAccount.findUnique({
    where: {
      provider_provider_user_id: { provider, provider_user_id: providerUserId },
    },
    include: { user: true },
  });
  if (existingOAuth) return existingOAuth.user;

  // 2. Email déjà utilisé → fusionner les comptes
  let user = email
    ? await prisma.user.findUnique({ where: { email } })
    : null;

  // 3. Créer l'utilisateur si nouveau
  if (!user) {
    // X/Twitter OAuth 2.0 ne retourne pas l'email → email de substitution
    const fallbackEmail = email || `${provider}_${providerUserId}@oauth.afribourse.com`;
    user = await prisma.user.create({
      data: {
        email: fallbackEmail,
        name: firstName,
        lastname: lastName,
        password: '',
        role: 'user',
        email_verified_at: email ? new Date() : null,
      },
    });

    await (prisma as any).portfolio.create({
      data: {
        userId: (user as any).id,
        name: 'Mon Portefeuille',
        cash_balance: 1000000,
        initial_balance: 1000000,
      },
    });
  }

  // 4. Lier le compte OAuth
  await (prisma as any).oAuthAccount.create({
    data: {
      user_id: (user as any).id,
      provider,
      provider_user_id: providerUserId,
      provider_email: email,
      avatar_url: avatar,
    },
  });

  return user;
}

// ═══════════════════════════════════════════════════════
// STRATÉGIE GOOGLE
// ═══════════════════════════════════════════════════════
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await findOrCreateOAuthUser(profile, 'google');
        done(null, user as any);
      } catch (err) {
        console.error('[OAuth] Google error:', err);
        done(null, false as any);
      }
    }
  )
);

// ═══════════════════════════════════════════════════════
// STRATÉGIE X / TWITTER (OAuth 2.0)
// Stratégie custom : OAuth2Strategy + appel X API v2
// ═══════════════════════════════════════════════════════
class XStrategy extends OAuth2Strategy {
  constructor(options: any, verify: any) {
    super(
      {
        authorizationURL: 'https://twitter.com/i/oauth2/authorize',
        tokenURL: 'https://api.x.com/2/oauth2/token',
        ...options,
      },
      verify
    );
    this.name = 'twitter';
  }

  // Récupérer le profil depuis l'API X v2
  userProfile(accessToken: string, done: (err: any, profile?: any) => void) {
    this._oauth2.get(
      'https://api.x.com/2/users/me?user.fields=id,name,username,profile_image_url',
      accessToken,
      (err: any, body: any) => {
        if (err) return done(new Error('Échec de récupération du profil X'));
        try {
          const json = JSON.parse(body);
          const data = json.data;
          const profile = {
            provider: 'twitter',
            id: data.id,
            username: data.username,
            displayName: data.name,
            photos: data.profile_image_url
              ? [{ value: data.profile_image_url }]
              : [],
            emails: [], // X OAuth 2.0 : email nécessite scope 'email' + approbation X
          };
          done(null, profile);
        } catch (e) {
          done(e);
        }
      }
    );
  }
}

passport.use(
  new XStrategy(
    {
      clientID: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      callbackURL: process.env.TWITTER_CALLBACK_URL!,
      scope: ['tweet.read', 'users.read'],
      pkce: true,    // X/Twitter exige PKCE (code_challenge S256)
      store: twitterStateStore, // State store en mémoire (pas de sessions)
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const user = await findOrCreateOAuthUser(profile, 'twitter');
        done(null, user as any);
      } catch (err) {
        console.error('[OAuth] Twitter error:', err);
        done(null, false);
      }
    }
  )
);

// ═══════════════════════════════════════════════════════
// STRATÉGIE LINKEDIN (OpenID Connect 2023+ — /v2/userinfo)
// passport-linkedin-oauth2 utilise l'ancienne API /v2/me (dépréciée).
// Strategy custom sur OAuth2Strategy + endpoint OIDC /v2/userinfo.
// ═══════════════════════════════════════════════════════
class LinkedInOIDCStrategy extends OAuth2Strategy {
  constructor(options: any, verify: any) {
    super(
      {
        authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
        ...options,
      },
      verify
    );
    this.name = 'linkedin';
  }

  userProfile(accessToken: string, done: (err: any, profile?: any) => void) {
    this._oauth2.get(
      'https://api.linkedin.com/v2/userinfo',
      accessToken,
      (err: any, body: any) => {
        if (err) return done(new Error('Failed to fetch LinkedIn profile: ' + JSON.stringify(err)));
        try {
          const json = JSON.parse(body);
          const profile = {
            provider: 'linkedin',
            id: json.sub,
            displayName: json.name || `${json.given_name || ''} ${json.family_name || ''}`.trim(),
            name: { givenName: json.given_name || '', familyName: json.family_name || '' },
            emails: json.email ? [{ value: json.email }] : [],
            photos: json.picture ? [{ value: json.picture }] : [],
          };
          done(null, profile);
        } catch (e) {
          done(e);
        }
      }
    );
  }
}

passport.use(
  new LinkedInOIDCStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL!,
      scope: ['openid', 'profile', 'email'],
      store: linkedinStateStore, // State store en mémoire (pas de sessions)
    },
    async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const user = await findOrCreateOAuthUser(profile, 'linkedin');
        done(null, user as any);
      } catch (err) {
        console.error('[OAuth] LinkedIn error:', err);
        done(null, false);
      }
    }
  )
);

// Serialize/Deserialize pour la session temporaire X OAuth 2.0
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
