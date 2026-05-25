// backend/src/controllers/certificate.controller.ts

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { log } from '../config/logger';
import { sendCertificateEmail } from '../services/email.service';
import { generateCertificatePng } from '../services/certificate-image.service';
import config from '../config/environnement';

interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string; role?: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function certUrl(uuid: string): string {
  return `${config.app.frontendUrl}/certificat/${uuid}`;
}

// ─── ADMIN — Modules ─────────────────────────────────────────────────────────

export const listModules = async (_req: Request, res: Response) => {
  try {
    const modules = await prisma.webinarModule.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return res.json({ success: true, data: modules });
  } catch (err) {
    log.error('listModules:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const createModule = async (req: Request, res: Response) => {
  try {
    const { moduleId, name, subtitle, order } = req.body;
    if (!moduleId || !name || !subtitle) {
      return res.status(400).json({ success: false, message: 'moduleId, name et subtitle sont requis' });
    }
    const mod = await prisma.webinarModule.create({
      data: { moduleId, name, subtitle, order: order ?? 0 },
    });
    return res.status(201).json({ success: true, data: mod });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Un module avec cet identifiant existe déjà' });
    }
    log.error('createModule:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const updateModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, subtitle, order, isActive } = req.body;
    const mod = await prisma.webinarModule.update({
      where: { id },
      data: { name, subtitle, order, isActive },
    });
    return res.json({ success: true, data: mod });
  } catch (err) {
    log.error('updateModule:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── ADMIN — Certificats ─────────────────────────────────────────────────────

export const issueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { email, participantName, moduleId, webinarDate, internalNote, sendEmailFlag } = req.body;
    const adminId = req.user!.id;

    if (!email || !participantName || !moduleId || !webinarDate) {
      return res.status(400).json({
        success: false,
        message: 'email, participantName, moduleId et webinarDate sont requis',
      });
    }

    // Vérifier que le compte existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun compte trouvé avec cet email sur afribourse.com',
      });
    }

    // Vérifier que le module existe
    const mod = await prisma.webinarModule.findUnique({ where: { id: moduleId } });
    if (!mod) {
      return res.status(404).json({ success: false, message: 'Module introuvable' });
    }

    // Vérifier doublon
    const existing = await prisma.certificate.findFirst({
      where: { userId: user.id, moduleId, status: { not: 'revoked' } },
    });
    if (existing) {
      return res.status(200).json({
        success: false,
        duplicate: true,
        message: `Cet utilisateur possède déjà un certificat pour ce module (décerné le ${new Intl.DateTimeFormat('fr-FR').format(existing.issuedAt)})`,
        existingId: existing.id,
      });
    }

    // Créer le certificat
    const cert = await prisma.certificate.create({
      data: {
        userId: user.id,
        participantName,
        email,
        moduleId,
        webinarDate: new Date(webinarDate),
        issuedBy: adminId,
        internalNote,
        status: 'pending',
      },
      include: { module: true },
    });

    // Notification in-app
    await prisma.notification.create({
      data: {
        user_id: user.id,
        type: 'CERTIFICATE',
        title: '🏅 Nouveau certificat !',
        message: `Vous avez reçu un certificat pour le webinaire : ${mod.name}`,
        metadata: { certificateId: cert.id },
      },
    });

    // Email optionnel
    if (sendEmailFlag !== false) {
      try {
        await sendCertificateEmail({
          email: user.email,
          name: participantName,
          moduleName: mod.name,
          webinarDate: new Date(webinarDate),
          certificateUrl: certUrl(cert.id),
        });
      } catch (emailErr) {
        log.error('issueCertificate — email error (non-fatal):', emailErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Certificat décerné à ${participantName} pour le module ${mod.name}`,
      data: cert,
    });
  } catch (err) {
    log.error('issueCertificate:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const listCertificatesAdmin = async (req: Request, res: Response) => {
  try {
    const { status, moduleId, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};
    if (status) where.status = status;
    if (moduleId) where.moduleId = moduleId;
    if (search) {
      where.OR = [
        { participantName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [certs, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: { module: true },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.certificate.count({ where }),
    ]);

    return res.json({ success: true, data: certs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    log.error('listCertificatesAdmin:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const revokeCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificat introuvable' });
    if (cert.status === 'revoked') {
      return res.status(400).json({ success: false, message: 'Ce certificat est déjà révoqué' });
    }

    await prisma.certificate.update({
      where: { id },
      data: { status: 'revoked', revokedAt: new Date(), revokedBy: adminId, revokeReason: reason },
    });

    return res.json({ success: true, message: 'Certificat révoqué' });
  } catch (err) {
    log.error('revokeCertificate:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const resendCertificateEmail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cert = await prisma.certificate.findUnique({ where: { id }, include: { module: true } });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificat introuvable' });
    if (cert.status === 'revoked') {
      return res.status(400).json({ success: false, message: 'Impossible de renvoyer un certificat révoqué' });
    }

    await sendCertificateEmail({
      email: cert.email,
      name: cert.participantName,
      moduleName: cert.module.name,
      webinarDate: cert.webinarDate,
      certificateUrl: certUrl(cert.id),
    });

    return res.json({ success: true, message: 'Email renvoyé' });
  } catch (err) {
    log.error('resendCertificateEmail:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── APPRENANT — Mes certificats ─────────────────────────────────────────────

export const getMyCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const certs = await prisma.certificate.findMany({
      where: { userId, status: { not: 'revoked' } },
      include: { module: true },
      orderBy: { issuedAt: 'desc' },
    });
    return res.json({ success: true, data: certs });
  } catch (err) {
    log.error('getMyCertificates:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const getPendingCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const certs = await prisma.certificate.findMany({
      where: { userId, status: 'pending' },
      include: { module: true },
      orderBy: { issuedAt: 'desc' },
    });
    return res.json({ success: true, data: certs });
  } catch (err) {
    log.error('getPendingCertificates:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const markViewed = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const userId = req.user!.id;

    const cert = await prisma.certificate.findFirst({ where: { id: uuid, userId } });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificat introuvable' });

    if (cert.status === 'pending') {
      await prisma.certificate.update({
        where: { id: uuid },
        data: { status: 'viewed', viewedAt: new Date() },
      });
    }

    return res.json({ success: true });
  } catch (err) {
    log.error('markViewed:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const trackDownload = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const userId = req.user!.id;

    const cert = await prisma.certificate.findFirst({ where: { id: uuid, userId } });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificat introuvable' });

    if (cert.status !== 'downloaded' && cert.status !== 'shared' && cert.status !== 'revoked') {
      await prisma.certificate.update({
        where: { id: uuid },
        data: { status: 'downloaded', downloadedAt: cert.downloadedAt ?? new Date() },
      });
    }

    return res.json({ success: true });
  } catch (err) {
    log.error('trackDownload:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const trackShare = async (req: AuthRequest, res: Response) => {
  try {
    const { uuid } = req.params;
    const { network } = req.body;
    const userId = req.user!.id;

    const cert = await prisma.certificate.findFirst({ where: { id: uuid, userId } });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificat introuvable' });

    const sharedOn = cert.sharedOn.includes(network) ? cert.sharedOn : [...cert.sharedOn, network];
    await prisma.certificate.update({
      where: { id: uuid },
      data: {
        status: 'shared',
        sharedAt: cert.sharedAt ?? new Date(),
        sharedOn,
      },
    });

    return res.json({ success: true });
  } catch (err) {
    log.error('trackShare:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

export const getCertificate = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const cert = await prisma.certificate.findUnique({
      where: { id: uuid },
      include: { module: true },
    });

    if (!cert) return res.status(404).json({ success: false, message: 'Certificat introuvable' });

    if (cert.status === 'revoked') {
      return res.json({
        success: false,
        revoked: true,
        message: 'Ce certificat n\'est plus disponible',
      });
    }

    // Ne pas exposer internalNote, issuedBy, revokedBy aux publics
    const { internalNote: _, issuedBy: __, revokedBy: ___, revokeReason: ____, ...publicCert } = cert;
    return res.json({ success: true, data: publicCert });
  } catch (err) {
    log.error('getCertificate:', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const downloadCertificate = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const cert = await prisma.certificate.findUnique({
      where: { id: uuid },
      include: { module: true },
    });

    if (!cert) return res.status(404).json({ success: false, message: 'Certificat introuvable' });
    if (cert.status === 'revoked') return res.status(403).json({ success: false, message: 'Ce certificat n\'est plus disponible' });

    const png = await generateCertificatePng({
      participantName: cert.participantName,
      moduleName: cert.module.name,
      moduleSubtitle: cert.module.subtitle,
      webinarDate: cert.webinarDate,
      issuedAt: cert.issuedAt,
    });

    const slug = cert.participantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const modSlug = cert.module.moduleId;
    const filename = `certificat-afribourse-${slug}-${modSlug}.png`;

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', png.length);
    res.setHeader('Cache-Control', 'no-store');
    return res.end(png);
  } catch (err) {
    log.error('downloadCertificate:', err);
    return res.status(500).json({ success: false, message: 'Erreur lors de la génération du PNG' });
  }
};
