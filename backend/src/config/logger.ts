// backend/src/config/logger.ts
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Create transports array
const transports: pino.TransportTargetOptions[] = [];

// Add Logtail transport if token is configured
if (process.env.LOGTAIL_TOKEN) {
  transports.push({
    target: '@logtail/pino',
    options: {
      sourceToken: process.env.LOGTAIL_TOKEN,
    },
    level: logLevel,
  });
}

// Add console transport for development and as fallback
if (!isProduction || transports.length === 0) {
  transports.push({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
    level: logLevel,
  });
}

// Create logger instance
const logger = pino({
  level: logLevel,
  base: {
    service: 'afribourse-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: transports.length > 0 ? { targets: transports } : undefined,
});

// Export convenience methods
export const log = {
  info: (message: string, meta?: Record<string, any>) => logger.info(meta, message),
  warn: (message: string, meta?: Record<string, any>) => logger.warn(meta, message),
  error: (message: string, meta?: Record<string, any>) => logger.error(meta, message),
  debug: (message: string, meta?: Record<string, any>) => logger.debug(meta, message),
  child: (bindings: Record<string, any>) => logger.child(bindings),
};

export default logger;
