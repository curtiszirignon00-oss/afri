import dotenv from "dotenv";

dotenv.config();

interface IConfig {
    nodeEnv: string,
    port: number,
    host: number | string,

    apiKey: string,
    
    database: {
      uri: string,
    },
    
    redis: {
      url: string | undefined,
    },
    
    jwt: {
      secret: string,
      expiresIn: string,
    },
    
    cors: {
      origin: string,
    },
    
    email: {
      host: string | undefined,
      port: number | undefined,
      user: string | undefined,
      pass: string | undefined,
    },
    
    rateLimit: {
      windowMs: number,
      maxRequests: number,
    },
    
    upload: {
      maxFileSize: number,
      path: string,
    },
    
    log: {
      level: string,
    },
}

const getEnvVar = (name : String, defaultValue: String) => {
  const value = process.env[name as string];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue as string;
    }
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
};

const config : IConfig = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: parseInt(getEnvVar('PORT', '3001') as string, 10),
  host: getEnvVar('HOST', '0.0.0.0'),

  apiKey: getEnvVar('API_KEY', 'default-api-key-change-in-production'),

  /** Configuration de la base de données
   * Adapter le nom
   * 
   */
  database: {
    uri: getEnvVar('DATABASE_URI', 'mysql://root:@localhost:3306/yourdbname'),
  },
  
  redis: {
    url: process.env.REDIS_URL,
  },
  
  jwt: {
    secret: getEnvVar('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
  },
  
  cors: {
    origin: getEnvVar('CORS_ORIGIN', 'http://localhost:5173'),
  },
  
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  
  rateLimit: {
    windowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    maxRequests: parseInt(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  },
  
  upload: {
    maxFileSize: parseInt(getEnvVar('MAX_FILE_SIZE', '10485760'), 10),
    path: getEnvVar('UPLOAD_PATH', 'public/uploads'),
  },
  
  log: {
    level: getEnvVar('LOG_LEVEL', 'info'),
  },
}

export default config;