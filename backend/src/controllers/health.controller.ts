// backend/src/controllers/health.controller.ts
import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getRedisClient } from '../config/redis';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks?: Record<string, {
    status: 'ok' | 'error';
    latency?: number;
    message?: string;
  }>;
  version?: string;
}

/**
 * Simple liveness check - just confirms the server is running
 * GET /health
 */
export async function liveness(_req: Request, res: Response) {
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  };

  res.status(200).json(result);
}

/**
 * Readiness check - verifies core dependencies are connected
 * GET /health/ready
 */
export async function readiness(_req: Request, res: Response) {
  const checks: HealthCheckResult['checks'] = {};
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

  // Check MongoDB via Prisma
  const mongoStart = Date.now();
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    checks.mongodb = {
      status: 'ok',
      latency: Date.now() - mongoStart,
    };
  } catch (error: any) {
    checks.mongodb = {
      status: 'error',
      message: error.message,
    };
    overallStatus = 'unhealthy';
  }

  // Check Redis if configured
  const redis = getRedisClient();
  if (redis) {
    const redisStart = Date.now();
    try {
      await redis.ping();
      checks.redis = {
        status: 'ok',
        latency: Date.now() - redisStart,
      };
    } catch (error: any) {
      checks.redis = {
        status: 'error',
        message: error.message,
      };
      // Redis failure is degraded, not unhealthy (app works without cache)
      if (overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }
  }

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version || '1.0.0',
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(result);
}

/**
 * Deep health check - verifies all dependencies including external APIs
 * GET /health/deep
 * Note: Should NOT be exposed publicly, only for internal diagnostics
 */
export async function deepCheck(_req: Request, res: Response) {
  const checks: HealthCheckResult['checks'] = {};
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

  // Check MongoDB
  const mongoStart = Date.now();
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    checks.mongodb = {
      status: 'ok',
      latency: Date.now() - mongoStart,
    };
  } catch (error: any) {
    checks.mongodb = {
      status: 'error',
      message: error.message,
    };
    overallStatus = 'unhealthy';
  }

  // Check Redis
  const redis = getRedisClient();
  if (redis) {
    const redisStart = Date.now();
    try {
      await redis.ping();
      checks.redis = {
        status: 'ok',
        latency: Date.now() - redisStart,
      };
    } catch (error: any) {
      checks.redis = {
        status: 'error',
        message: error.message,
      };
      if (overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }
  } else {
    checks.redis = {
      status: 'ok',
      message: 'Not configured',
    };
  }

  // Check SikaFinance API (external dependency)
  const sikaStart = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.sikafinance.com', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      checks.sikafinance = {
        status: 'ok',
        latency: Date.now() - sikaStart,
      };
    } else {
      checks.sikafinance = {
        status: 'error',
        message: `HTTP ${response.status}`,
      };
      if (overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }
  } catch (error: any) {
    checks.sikafinance = {
      status: 'error',
      message: error.name === 'AbortError' ? 'Timeout' : error.message,
    };
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
  }

  // System info
  const memoryUsage = process.memoryUsage();
  checks.memory = {
    status: 'ok',
    message: `Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
  };

  checks.uptime = {
    status: 'ok',
    message: `${Math.round(process.uptime())} seconds`,
  };

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version || '1.0.0',
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  res.status(statusCode).json(result);
}
