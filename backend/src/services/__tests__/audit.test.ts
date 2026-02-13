// backend/src/services/__tests__/audit.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeAuditLog, getClientIp, getUserAgent } from '../audit.service';
import prisma from '../../config/prisma';

describe('Audit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('writeAuditLog', () => {
    it('should create an audit log entry', async () => {
      const mockCreate = vi.mocked(prisma.auditLog.create);
      mockCreate.mockResolvedValueOnce({
        id: 'test-id',
        userId: 'user-123',
        userEmail: 'test@example.com',
        userRole: 'user',
        action: 'LOGIN',
        resource: null,
        details: 'Test login',
        metadata: null,
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
        errorMsg: null,
        created_at: new Date(),
      });

      await writeAuditLog({
        userId: 'user-123',
        userEmail: 'test@example.com',
        userRole: 'user',
        action: 'LOGIN',
        details: 'Test login',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          userEmail: 'test@example.com',
          action: 'LOGIN',
        }),
      });
    });

    it('should not throw error if database call fails', async () => {
      const mockCreate = vi.mocked(prisma.auditLog.create);
      mockCreate.mockRejectedValueOnce(new Error('Database error'));

      // Should not throw
      await expect(
        writeAuditLog({
          action: 'LOGIN',
          userEmail: 'test@example.com',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getClientIp', () => {
    it('should return x-forwarded-for header if present', () => {
      const req = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
        ip: '127.0.0.1',
      };

      expect(getClientIp(req)).toBe('192.168.1.1');
    });

    it('should return req.ip if no forwarded header', () => {
      const req = {
        headers: {},
        ip: '127.0.0.1',
      };

      expect(getClientIp(req)).toBe('127.0.0.1');
    });

    it('should return socket remote address as fallback', () => {
      const req = {
        headers: {},
        socket: { remoteAddress: '10.0.0.1' },
      };

      expect(getClientIp(req)).toBe('10.0.0.1');
    });
  });

  describe('getUserAgent', () => {
    it('should return user-agent header', () => {
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0 Test Browser',
        },
      };

      expect(getUserAgent(req)).toBe('Mozilla/5.0 Test Browser');
    });

    it('should return undefined if no user-agent header', () => {
      const req = {
        headers: {},
      };

      expect(getUserAgent(req)).toBeUndefined();
    });
  });
});
