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

// Convertit les args extra (style console) en contexte structuré pino
function toCtx(args: any[]): Record<string, any> | undefined {
  if (args.length === 0) return undefined;
  if (args.length === 1) return { ctx: args[0] };
  return { ctx: args };
}

// Export convenience methods — signatures compatibles console (message, ...args)
export const log = {
  info:  (message: string, ...args: any[]) => logger.info(toCtx(args) ?? {}, message),
  warn:  (message: string, ...args: any[]) => logger.warn(toCtx(args) ?? {}, message),
  error: (message: string, ...args: any[]) => logger.error(toCtx(args) ?? {}, message),
  debug: (message: string, ...args: any[]) => logger.debug(toCtx(args) ?? {}, message),
  child: (bindings: Record<string, any>) => logger.child(bindings),
};

export default logger;
