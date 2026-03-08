import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import prisma from './prisma';

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
      state: true,   // CSRF protection (stocké en session)
      pkce: true,    // X/Twitter exige PKCE pour tous les clients OAuth 2.0
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
// STRATÉGIE LINKEDIN (OpenID Connect depuis 2023)
// ═══════════════════════════════════════════════════════
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL!,
      scope: ['openid', 'profile', 'email'],
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
