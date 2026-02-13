// backend/src/middlewares/request-logger.middleware.ts
import pinoHttp from 'pino-http';
import logger from '../config/logger';
import { randomUUID } from 'crypto';

export const requestLogger = pinoHttp({
  logger,
  // Generate unique request ID
  genReqId: (req) => {
    return (req.headers['x-request-id'] as string) || randomUUID();
  },
  // Customize the request log
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Customize what gets logged
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  // Add custom attributes
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },
  // Redact sensitive data
  redact: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password'],
  // Serialize request
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      // Don't log body by default (can contain sensitive data)
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

// Helper to attach request ID to response headers
export function attachRequestId(req: any, res: any, next: any) {
  const requestId = req.id || randomUUID();
  res.setHeader('X-Request-ID', requestId);
  next();
}
