import path from 'path';
import Express, { Application, json, urlencoded } from 'express';
import { Server } from 'http';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import config from './config/environnement';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middlewares/errorHandlers';
import { doubleCsrfProtection, generateCsrfToken } from './middlewares/csrf.middleware';
// Seule l'importation de la connexion Prisma est conservée
import { connectPrismaDatabase, disconnectPrismaDatabase } from './config/database.prisma';
import { getRedisClient } from './config/redis';
import compression from 'compression';
import { requestLogger, attachRequestId } from './middlewares/request-logger.middleware';
import logger from './config/logger';

// Imports des routes
import userRoutes from './routes/user.routes';
import stockRoutes from './routes/stock.routes';
import indexRoutes from './routes/index.routes';
import portfolioRoutes from './routes/portfolio.routes';
import homepageRoutes from './routes/homepage.routes';
import watchlistRoutes from './routes/watchlist.routes';
// FALLBACK: Jobs node-cron in-process (gardes pour fiabilite en complement de QStash)
import './jobs/scraping.job';
import './jobs/backup.job';
import './jobs/notify-users.job';
import './jobs/gamification.job';
import learningRoutes from "./routes/learning.routes";
import newsRoutes from "./routes/news.routes";
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import achievementRoutes from './routes/achievement.routes';
import activityRoutes from './routes/activity.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import contactRoutes from './routes/contact.routes';
import subscriptionRoutes from './routes/subscription.routes';
import adminRoutes from './routes/admin.routes';
import analyticsRoutes from './routes/analytics.routes';
import priceAlertRoutes from './routes/price-alert.routes';
import socialRoutes from './routes/social.routes';
import investorProfileRoutes from './routes/investor-profile.routes';
import uploadRoutes from './routes/upload.routes';
import notificationRoutes from './routes/notification.routes';
import communityRoutes from './routes/community.routes';
import moderationRoutes from './routes/moderation.routes';
import challengeRoutes from './routes/challenge.routes'; // Challenge AfriBourse 2026
import eventsRoutes from './routes/events.routes'; // Événements Challenge
import gamificationRoutes from './routes/gamification.routes'; // Système de gamification
import cronRoutes from './routes/cron.routes'; // Endpoints CRON securises (QStash/Bearer)
import healthRoutes from './routes/health.routes'; // Health check endpoints
import pushRoutes from './routes/push.routes'; // Push notifications (Web Push API)
import passportConfig from './config/passport'; // OAuth Passport
import oauthRoutes from './routes/oauth.routes'; // OAuth Social Login
import aiRoutes from './routes/ai.routes'; // IA Proxy (Gemini)

class App {
  private app: Application | null = null;
  private server: Server | null = null;

  constructor() {
    this.app = Express();
    this.app.set('trust proxy', 1);
    this.server = new Server(this.app);
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorsHandling();
  }

  private initializeMiddlewares() {
    // --- Security Headers (Helmet) ---
    this.app?.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],          // unsafe-inline supprimé
          imgSrc: ["'self'", "https:"],  // data: supprimé (risque XSS via URI)
          // connectSrc : autoriser les services tiers appelés côté backend (APIs externes)
          connectSrc: ["'self'", "https://api.x.com", "https://www.linkedin.com", "https://accounts.google.com"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          // formAction: restreindre les cibles de soumission de formulaires
          formAction: ["'self'"],
          // baseUri: empêcher les injections de base URI
          baseUri: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Permettre les ressources cross-origin
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: {
        maxAge: 31536000, // 1 an
        includeSubDomains: true,
        preload: true,
      },
    }));

    // --- CORS Configuration ---
    // En production, filtrer les origines localhost pour réduire la surface d'attaque
    const isProduction = config.nodeEnv === 'production';
    const allowedOrigins = config.cors.origin
      .split(',')
      .map((o: string) => o.trim())
      .filter((o: string) => !isProduction || !o.startsWith('http://localhost'));

    this.app?.use(cors({
      origin: (origin, callback) => {
        // En production, bloquer les requêtes sans origine (curl, scripts, iframes)
        // En développement, les autoriser pour faciliter les tests locaux
        if (!origin) {
          if (config.nodeEnv !== 'production') return callback(null, true);
          return callback(new Error('Not allowed by CORS: origin required'));
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      // X-CSRF-Token requis pour que le middleware CSRF accepte les requêtes cross-origin
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    }));
    // --- END CORS Configuration ---

    // Body Parsers
    this.app?.use(bodyParser.json());
    this.app?.use(json({ limit: '10mb' }));
    this.app?.use(urlencoded({ extended: true, limit: '10mb' }));

    // Other Middlewares
    this.app?.use(compression());
    this.app?.use(cookieParser());
    // Session pour OAuth state/PKCE (Twitter, LinkedIn). sameSite:'none' requis
    // pour que le cookie soit renvoyé lors de la redirection cross-site OAuth.
    this.app?.use(session({
      secret: (() => {
        const s = process.env.SESSION_SECRET;
        if (!s) throw new Error('SESSION_SECRET environment variable is required');
        return s;
      })(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
        maxAge: 10 * 60 * 1000, // 10 min (OAuth flow peut prendre du temps)
      },
    }));
    this.app?.use(passportConfig.initialize());
    this.app?.use(passportConfig.session());


    // Rate Limiting
    this.app?.use(
      '/api/',
      rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.maxRequests,
        message: {
          error: 'Trop de requêtes pour cette adresse IP. Réessayez plus tard.',
        },
        standardHeaders: true,
        legacyHeaders: false,
      })
    );

    // --- CSRF Protection (Double Submit Cookie Pattern) ---
    // Appliqué sur toutes les routes /api/ sauf GET/HEAD/OPTIONS (ignorés par le middleware)
    // Les endpoints publics de tracking analytics (page-view, page-duration) sont exemptés
    // car ils sont appelés par des visiteurs non authentifiés sans token CSRF.
    this.app?.use('/api/', doubleCsrfProtection);

    // Request Logger (Pino with structured logging)
    this.app?.use(attachRequestId);
    this.app?.use(requestLogger);

    // Static Files
    this.app?.use('/', Express.static(path.join(__dirname, '../public/')));

    logger.info('Middlewares initialized');
  }

  private initializeRoutes() {
    // OAuth Social Login (HORS /api — redirections navigateur)
    this.app?.use('/auth', oauthRoutes); // /auth/google, /auth/facebook, /auth/linkedin

    // Health Check Routes (liveness, readiness, deep)
    this.app?.use('/health', healthRoutes);
    this.app?.use('/api/health', healthRoutes); // Also expose at /api/health for backwards compatibility

    // CSRF Token endpoint — appelé par le frontend au démarrage et après login
    // Retourne le token dans le body ET pose le cookie CSRF (httpOnly)
    this.app?.get('/api/csrf-token', (req, res) => {
      const token = generateCsrfToken(req, res);
      res.json({ csrfToken: token });
    });

    // API Routes
    this.app?.use('/api/users', userRoutes);
    this.app?.use('/api/stocks', stockRoutes);
    this.app?.use('/api/indices', indexRoutes);
    this.app?.use('/api/portfolios', portfolioRoutes);
    this.app?.use('/api/homepage', homepageRoutes);
    this.app?.use('/api/watchlist', watchlistRoutes);
    this.app?.use("/api/learning-modules", learningRoutes);
    this.app?.use("/api/news", newsRoutes);
    this.app?.use('/api/', authRoutes);
    this.app?.use('/api/profile', profileRoutes);         // Profil social + follow
    this.app?.use('/api/achievements', achievementRoutes); // Achievements/badges
    this.app?.use('/api/activities', activityRoutes);      // Activités utilisateur
    this.app?.use('/api/leaderboard', leaderboardRoutes);  // Classements
    this.app?.use('/api/contact', contactRoutes);          // Formulaire de contact
    this.app?.use('/api/subscriptions', subscriptionRoutes); // Tracking abonnements
    this.app?.use('/api/admin', adminRoutes);              // Admin dashboard
    this.app?.use('/api/analytics', analyticsRoutes);       // Analytics tracking
    this.app?.use('/api/price-alerts', priceAlertRoutes);   // Price alerts
    this.app?.use('/api/social', socialRoutes);              // Social features (posts, likes, comments)
    this.app?.use('/api/investor-profile', investorProfileRoutes); // Investor DNA & onboarding
    this.app?.use('/api/upload', uploadRoutes);                    // File uploads (avatar, banner, posts)
    this.app?.use('/api/notifications', notificationRoutes);        // Notifications
    this.app?.use('/api/communities', communityRoutes);              // Communities (groupes)
    this.app?.use('/api/moderation', moderationRoutes);              // Moderation (reports, bans, keywords)
    this.app?.use('/api/challenge', challengeRoutes);                // Challenge AfriBourse 2026
    this.app?.use('/api/events', eventsRoutes);                      // Événements Challenge
    this.app?.use('/api/gamification', gamificationRoutes);          // Système de gamification (XP, niveaux, streaks, badges)
    this.app?.use('/api/cron', cronRoutes);                            // Endpoints CRON securises (QStash/Bearer)
    this.app?.use('/api/push', pushRoutes);                              // Push notifications (Web Push API)
    this.app?.use('/api/ai', aiRoutes);                                   // IA Proxy — Gemini (clé côté serveur uniquement)

    // Static Uploads Route
    this.app?.use('/uploads', Express.static(path.join(__dirname, '../public/uploads')));

    logger.info('Routes initialized');
  }

  private initializeErrorsHandling() {
    this.app?.use(notFoundHandler);
    this.app?.use(errorHandler);
    logger.info('Error handlers initialized');
  }

  public async start() {
    try {
      // CONSOLIDATION : Appel unique à la connexion Prisma
      await connectPrismaDatabase();

      // Redis Cache
      const redis = getRedisClient();
      if (redis) {
        logger.info('Redis cache: active (Upstash REST)');
      } else {
        logger.info('Redis cache: disabled');
      }

      // Start Server
      this.server?.listen(config.port, config.host as string, () => {
        logger.info({ port: config.port, host: config.host }, `Server started on http://${config.host}:${config.port}`);
        logger.info({ env: config.nodeEnv }, `Environment: ${config.nodeEnv}`);
        logger.info(`CORS origins: ${config.cors.origin}`);
        logger.info(`Database: ${config.database.uri.replace(/\/\/.*@/, '//***:***@')}`);
      });

      // Graceful Shutdown Listeners
      process.on('SIGINT', this.shutdown.bind(this));
      process.on('SIGTERM', this.shutdown.bind(this));
    } catch (error) {
      // Disconnect DB on startup error
      await disconnectPrismaDatabase();
      logger.error({ error }, 'Failed to start server');
      process.exit(1);
    }
  }

  public async shutdown() {
    logger.info('Server shutting down...');
    await disconnectPrismaDatabase();
    this.server?.close(() => {
      logger.info('Server stopped');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Server did not shut down gracefully. Forcing exit.');
      process.exit(1);
    }, 10000);
  }
}

// Instantiate and start the App
const app = new App();
app.start().catch((error) => {
  logger.error({ error }, 'Failed to start application');
  process.exit(1);
});



