// backend/src/services/audit.service.ts
import prisma from '../config/prisma';
import { AuditAction } from '@prisma/client';

export interface AuditLogInput {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resource?: string;
  details?: string;
  metadata?: any;
  ip?: string;
  userAgent?: string;
  success?: boolean;
  errorMsg?: string;
}

/**
 * Ecrit un log d'audit dans la base de donnees
 * @param input Les donnees du log d'audit
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userEmail: input.userEmail,
        userRole: input.userRole,
        action: input.action,
        resource: input.resource,
        details: input.details,
        metadata: input.metadata,
        ip: input.ip,
        userAgent: input.userAgent,
        success: input.success ?? true,
        errorMsg: input.errorMsg,
      },
    });
  } catch (error) {
    // Ne pas faire echouer l'operation principale si l'audit echoue
    console.error('[AUDIT] Failed to write audit log:', error);
  }
}

/**
 * Extrait l'IP du client depuis la requete Express
 * @param req Express Request object
 */
export function getClientIp(req: any): string | undefined {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ips?.trim();
  }
  return req.ip || req.socket?.remoteAddress;
}

/**
 * Extrait le User-Agent depuis la requete Express
 * @param req Express Request object
 */
export function getUserAgent(req: any): string | undefined {
  return req.headers?.['user-agent'];
}
