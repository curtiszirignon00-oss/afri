import path from 'path';
import Express, { Application, json, urlencoded } from 'express';
import { Server } from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';
import config from './config/environnement';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middlewares/errorHandlers';
// Seule l'importation de la connexion Prisma est conservée
import { connectPrismaDatabase, disconnectPrismaDatabase } from './config/database.prisma';
import { verifyApiKey } from './middlewares/apiCheck.middleware';
import compression from 'compression';

// Imports des routes
import userRoutes from './routes/user.routes';
import stockRoutes from './routes/stock.routes';
import indexRoutes from './routes/index.routes';
import portfolioRoutes from './routes/portfolio.routes';
import homepageRoutes from './routes/homepage.routes';
import watchlistRoutes from './routes/watchlist.routes';
import './jobs/scraping.job';
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
          console.warn(`⚠️ CORS blocked origin: ${origin}`);
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

    // Request Logger
    this.app?.use((req, res, next) => {
      const { method, url } = req;
      const timestamp = new Date().toISOString();
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      console.info(
        `\x1b[36m[${timestamp}]\x1b[0m \x1b[32m${method}\x1b[0m \x1b[33m${url}\x1b[0m \x1b[35mIP:\x1b[0m ${ip}`
      );
      next();
    });

    // Static Files
    this.app?.use('/', Express.static(path.join(__dirname, '../public/')));

    console.info('🗂  Middlewares initialisés');
  }

  private initializeRoutes() {
    // Health Check Route
    this.app?.use('/api/health', (req, res) => {
      return res.status(200).json({
        status: 'OK',
        timestamp: new Date().toLocaleDateString(),
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
      });
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

    // Static Uploads Route
    this.app?.use('/uploads', Express.static(path.join(__dirname, '../public/uploads')));

    console.info('🛣  Routes initialisés');
  }

  private initializeErrorsHandling() {
    // These should come AFTER routes
    this.app?.use(notFoundHandler); // Handle 404s first
    this.app?.use(errorHandler);    // Then handle other errors
    console.info('⭕ Gestion d\'erreurs initialisés');
  }

  public async start() {
    try {
      // CONSOLIDATION : Appel unique à la connexion Prisma
      await connectPrismaDatabase();

      // Start Server
      this.server?.listen(config.port, config.host as string, () => {
        console.info(
          `🚀 Serveur lancé sur http://${config.host}:${config.port}`
        );
        console.info(`📝 Environment: ${config.nodeEnv}`);
        console.info(`🌐 CORS origins autorisées: ${config.cors.origin}`);
        console.info(
          `📦 Base de données: ${config.database.uri.replace(
            /\/\/.*@/,
            '//***:***@'
          )}`
        );
      });

      // Graceful Shutdown Listeners
      process.on('SIGINT', this.shutdown.bind(this));
      process.on('SIGTERM', this.shutdown.bind(this));
    } catch (error) {
      // Disconnect DB on startup error
      await disconnectPrismaDatabase();
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async shutdown() {
    console.info('🛑 Arrêt du serveur...');
    await disconnectPrismaDatabase(); // Disconnect DB
    this.server?.close(() => {
      console.info('✅ Serveur arrêté');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      console.error('❌ Le serveur ne s\'est pas arrêté. Arrêt forcé.');
      process.exit(1);
    }, 10000);
  }
}

// Instantiate and start the App
const app = new App();
app.start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});



