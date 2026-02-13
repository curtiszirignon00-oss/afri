// IMPORTANT: Sentry MUST be initialized before any other imports
import { initSentry, Sentry } from './config/sentry';
initSentry();

import path from 'path';
import Express, { Application, json, urlencoded } from 'express';
import { Server } from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import config from './config/environnement';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middlewares/errorHandlers';
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
    // Note: Sentry v8+ auto-instruments Express via Sentry.init() integrations
    // No need for manual requestHandler/tracingHandler

    // --- Security Headers (Helmet) ---
    this.app?.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Permettre les ressources cross-origin
      hsts: {
        maxAge: 31536000, // 1 an
        includeSubDomains: true,
        preload: true,
      },
    }));

    // --- CORS Configuration ---
    // Supporter plusieurs origines pour le développement et la production
    const allowedOrigins = config.cors.origin.split(',').map((origin: string) => origin.trim());

    this.app?.use(cors({
      origin: (origin, callback) => {
        // Permettre les requêtes sans origine (comme curl, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn(`CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }));
    // --- END CORS Configuration ---

    // Body Parsers
    this.app?.use(bodyParser.json());
    this.app?.use(json({ limit: '10mb' }));
    this.app?.use(urlencoded({ extended: true, limit: '10mb' }));

    // Other Middlewares
    this.app?.use(compression());
    this.app?.use(cookieParser());


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

    // Request Logger (Pino with structured logging)
    this.app?.use(attachRequestId);
    this.app?.use(requestLogger);

    // Static Files
    this.app?.use('/', Express.static(path.join(__dirname, '../public/')));

    logger.info('Middlewares initialized');
  }

  private initializeRoutes() {
    // Health Check Routes (liveness, readiness, deep)
    this.app?.use('/health', healthRoutes);
    this.app?.use('/api/health', healthRoutes); // Also expose at /api/health for backwards compatibility

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

    // Static Uploads Route
    this.app?.use('/uploads', Express.static(path.join(__dirname, '../public/uploads')));

    logger.info('Routes initialized');
  }

  private initializeErrorsHandling() {
    // Sentry v8+ error handler (MUST come before custom error handlers)
    if (process.env.SENTRY_DSN && this.app) {
      Sentry.setupExpressErrorHandler(this.app);
    }

    // These should come AFTER Sentry error handler
    this.app?.use(notFoundHandler); // Handle 404s first
    this.app?.use(errorHandler);    // Then handle other errors
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



