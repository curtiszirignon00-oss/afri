import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import prisma from './prisma';
import config from './environnement';

// ═══════════════════════════════════════════════════════
// HELPER : Trouver ou créer un user OAuth
// ═══════════════════════════════════════════════════════
export async function findOrCreateOAuthUser(profile: any, provider: string) {
  const providerUserId = profile.id;
  const email = profile.emails?.[0]?.value;
  const avatar = profile.photos?.[0]?.value;
  const displayName = profile.displayName || '';
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
  if (!user && email) {
    user = await prisma.user.create({
      data: {
        email,
        name: firstName,
        lastname: lastName,
        password: '', // Pas de password pour les comptes OAuth
        role: 'user',
        email_verified_at: new Date(), // Email déjà vérifié par le provider
      },
    });

    // Créer le portfolio par défaut
    await (prisma as any).portfolio.create({
      data: {
        userId: (user as any).id,
        name: 'Mon Portefeuille',
        balance: 1000000,
      },
    });
  }

  if (!user) throw new Error('Impossible de créer le compte OAuth');

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
        done(err as Error);
      }
    }
  )
);

// ═══════════════════════════════════════════════════════
// STRATÉGIE FACEBOOK
// ═══════════════════════════════════════════════════════
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL!,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await findOrCreateOAuthUser(profile, 'facebook');
        done(null, user as any);
      } catch (err) {
        done(err as Error);
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
        done(err as Error);
      }
    }
  )
);

export default passport;
