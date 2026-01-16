// src/services/moderation.service.ts
import { prisma } from '../config/database';
import type {
    ReportReason,
    ReportStatus,
    ContentType,
    ModerationAction,
    BanType
} from '@prisma/client';

// ============= TYPES =============

interface CreateReportDto {
    reporterId: string;
    contentType: ContentType;
    contentId: string;
    reason: ReportReason;
    description?: string;
}

interface ProcessReportDto {
    status: ReportStatus;
    resolution?: string;
}

interface BanUserDto {
    userId: string;
    bannedById: string;
    banType: BanType;
    reason: string;
    durationDays?: number; // For temporary bans
}

interface BannedKeywordDto {
    keyword: string;
    severity?: number;
    category?: string;
    isRegex?: boolean;
    addedById: string;
}

// ============= REPORTS =============

/**
 * Create a new content report
 */
export async function reportContent(data: CreateReportDto) {
    // Check if user already reported this content
    const existingReport = await prisma.report.findFirst({
        where: {
            reporter_id: data.reporterId,
            content_type: data.contentType,
            content_id: data.contentId,
            status: 'PENDING'
        }
    });

    if (existingReport) {
        throw new Error('Vous avez déjà signalé ce contenu');
    }

    const report = await prisma.report.create({
        data: {
            reporter_id: data.reporterId,
            content_type: data.contentType,
            content_id: data.contentId,
            reason: data.reason,
            description: data.description,
        },
        include: {
            reporter: {
                select: {
                    id: true,
                    name: true,
                    lastname: true
                }
            }
        }
    });

    return report;
}

/**
 * Get reports with filters
 */
export async function getReports(
    page: number = 1,
    limit: number = 20,
    filters: {
        status?: ReportStatus;
        contentType?: ContentType;
        reason?: ReportReason;
    } = {}
) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.contentType) where.content_type = filters.contentType;
    if (filters.reason) where.reason = filters.reason;

    const [reports, total] = await Promise.all([
        prisma.report.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true
                    }
                },
                processor: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true
                    }
                }
            }
        }),
        prisma.report.count({ where })
    ]);

    return {
        data: reports,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Process a report (approve/dismiss)
 */
export async function processReport(
    reportId: string,
    moderatorId: string,
    data: ProcessReportDto
) {
    const report = await prisma.report.update({
        where: { id: reportId },
        data: {
            status: data.status,
            resolution: data.resolution,
            processed_by: moderatorId,
            processed_at: new Date()
        },
        include: {
            reporter: {
                select: {
                    id: true,
                    name: true,
                    lastname: true
                }
            }
        }
    });

    // Log the moderation action
    await logModerationAction(
        moderatorId,
        data.status === 'RESOLVED' ? 'CONTENT_HIDDEN' : 'REPORT_DISMISSED',
        report.content_type,
        report.content_id,
        data.resolution
    );

    // If report is resolved, hide the content
    if (data.status === 'RESOLVED') {
        await hideContent(report.content_type, report.content_id);
    }

    return report;
}

/**
 * Hide content based on type
 */
async function hideContent(contentType: ContentType, contentId: string) {
    switch (contentType) {
        case 'POST':
            await prisma.post.update({
                where: { id: contentId },
                data: { is_hidden: true }
            });
            break;
        case 'COMMENT':
            await prisma.comment.update({
                where: { id: contentId },
                data: { is_hidden: true }
            });
            break;
        case 'COMMUNITY_POST':
            await prisma.communityPost.update({
                where: { id: contentId },
                data: { is_hidden: true }
            });
            break;
        case 'COMMUNITY_COMMENT':
            await prisma.communityPostComment.update({
                where: { id: contentId },
                data: { is_hidden: true }
            });
            break;
    }
}

// ============= BANNED KEYWORDS =============

/**
 * Check text against banned keywords
 * Returns array of matched keywords with their severity
 */
export async function checkBannedKeywords(text: string): Promise<{
    hasBannedKeywords: boolean;
    matches: Array<{ keyword: string; severity: number; category: string | null }>;
    maxSeverity: number;
}> {
    const keywords = await prisma.bannedKeyword.findMany({
        where: { is_active: true }
    });

    const lowerText = text.toLowerCase();
    const matches: Array<{ keyword: string; severity: number; category: string | null }> = [];

    for (const kw of keywords) {
        let isMatch = false;

        if (kw.is_regex) {
            try {
                const regex = new RegExp(kw.keyword, 'gi');
                isMatch = regex.test(text);
            } catch (e) {
                // Invalid regex, skip
                continue;
            }
        } else {
            isMatch = lowerText.includes(kw.keyword.toLowerCase());
        }

        if (isMatch) {
            matches.push({
                keyword: kw.keyword,
                severity: kw.severity,
                category: kw.category
            });
        }
    }

    return {
        hasBannedKeywords: matches.length > 0,
        matches,
        maxSeverity: matches.length > 0 ? Math.max(...matches.map(m => m.severity)) : 0
    };
}

/**
 * Add a banned keyword
 */
export async function addBannedKeyword(data: BannedKeywordDto) {
    const keyword = await prisma.bannedKeyword.create({
        data: {
            keyword: data.keyword.toLowerCase(),
            severity: data.severity || 1,
            category: data.category,
            is_regex: data.isRegex || false,
            added_by: data.addedById
        }
    });

    // Log the action
    await logModerationAction(
        data.addedById,
        'KEYWORD_BLOCKED',
        'USER', // Target type doesn't matter for keywords
        keyword.id,
        `Mot-clé ajouté: ${data.keyword}`
    );

    return keyword;
}

/**
 * Remove a banned keyword
 */
export async function removeBannedKeyword(keywordId: string, removedById: string) {
    const keyword = await prisma.bannedKeyword.delete({
        where: { id: keywordId }
    });

    // Log the action
    await logModerationAction(
        removedById,
        'KEYWORD_BLOCKED', // Reuse this action type
        'USER',
        keywordId,
        `Mot-clé supprimé: ${keyword.keyword}`
    );

    return keyword;
}

/**
 * Get all banned keywords
 */
export async function getBannedKeywords(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [keywords, total] = await Promise.all([
        prisma.bannedKeyword.findMany({
            skip,
            take: limit,
            orderBy: { created_at: 'desc' }
        }),
        prisma.bannedKeyword.count()
    ]);

    return {
        data: keywords,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Toggle banned keyword active status
 */
export async function toggleBannedKeyword(keywordId: string) {
    const keyword = await prisma.bannedKeyword.findUnique({
        where: { id: keywordId }
    });

    if (!keyword) {
        throw new Error('Mot-clé non trouvé');
    }

    return prisma.bannedKeyword.update({
        where: { id: keywordId },
        data: { is_active: !keyword.is_active }
    });
}

// ============= USER BANS =============

/**
 * Ban a user
 */
export async function banUser(data: BanUserDto) {
    // Check if user is already banned
    const existingBan = await prisma.userBan.findFirst({
        where: {
            user_id: data.userId,
            is_active: true,
            OR: [
                { ends_at: null }, // Permanent ban
                { ends_at: { gt: new Date() } } // Active temp ban
            ]
        }
    });

    if (existingBan) {
        throw new Error('Cet utilisateur est déjà banni');
    }

    const endsAt = data.banType === 'TEMPORARY' && data.durationDays
        ? new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000)
        : null;

    const ban = await prisma.userBan.create({
        data: {
            user_id: data.userId,
            banned_by: data.bannedById,
            ban_type: data.banType,
            reason: data.reason,
            ends_at: endsAt
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
                    email: true
                }
            }
        }
    });

    // Log the action
    await logModerationAction(
        data.bannedById,
        'USER_BANNED',
        'USER',
        data.userId,
        data.reason,
        {
            ban_type: data.banType,
            duration_days: data.durationDays,
            ends_at: endsAt
        }
    );

    return ban;
}

/**
 * Unban a user (lift ban)
 */
export async function unbanUser(banId: string, liftedById: string, liftReason: string) {
    const ban = await prisma.userBan.update({
        where: { id: banId },
        data: {
            is_active: false,
            lifted_by: liftedById,
            lifted_at: new Date(),
            lift_reason: liftReason
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    lastname: true
                }
            }
        }
    });

    // Log the action
    await logModerationAction(
        liftedById,
        'BAN_LIFTED',
        'USER',
        ban.user_id,
        liftReason
    );

    return ban;
}

/**
 * Check if a user is currently banned
 */
export async function getUserBanStatus(userId: string): Promise<{
    isBanned: boolean;
    ban: any | null;
}> {
    const now = new Date();

    const activeBan = await prisma.userBan.findFirst({
        where: {
            user_id: userId,
            is_active: true,
            OR: [
                { ends_at: null }, // Permanent
                { ends_at: { gt: now } } // Temp ban not expired
            ]
        },
        orderBy: { created_at: 'desc' }
    });

    return {
        isBanned: !!activeBan,
        ban: activeBan
    };
}

/**
 * Get user's ban history
 */
export async function getUserBans(userId: string) {
    return prisma.userBan.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        include: {
            banner: {
                select: {
                    id: true,
                    name: true,
                    lastname: true
                }
            },
            lifter: {
                select: {
                    id: true,
                    name: true,
                    lastname: true
                }
            }
        }
    });
}

/**
 * Get all active bans
 */
export async function getActiveBans(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = {
        is_active: true,
        OR: [
            { ends_at: null },
            { ends_at: { gt: now } }
        ]
    };

    const [bans, total] = await Promise.all([
        prisma.userBan.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true
                    }
                },
                banner: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true
                    }
                }
            }
        }),
        prisma.userBan.count({ where })
    ]);

    return {
        data: bans,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}

/**
 * Clean up expired temporary bans
 */
export async function cleanupExpiredBans() {
    const now = new Date();

    const result = await prisma.userBan.updateMany({
        where: {
            is_active: true,
            ban_type: 'TEMPORARY',
            ends_at: { lte: now }
        },
        data: {
            is_active: false
        }
    });

    return result.count;
}

// ============= MODERATION LOGS =============

/**
 * Log a moderation action
 */
export async function logModerationAction(
    moderatorId: string,
    action: ModerationAction,
    targetType: ContentType,
    targetId: string,
    reason?: string,
    metadata?: any
) {
    return prisma.moderationLog.create({
        data: {
            moderator_id: moderatorId,
            action,
            target_type: targetType,
            target_id: targetId,
            reason,
            metadata
        }
    });
}

/**
 * Get moderation logs with filters
 */
export async function getModerationLogs(
    page: number = 1,
    limit: number = 50,
    filters: {
        moderatorId?: string;
        action?: ModerationAction;
        targetType?: ContentType;
        fromDate?: Date;
        toDate?: Date;
    } = {}
) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.moderatorId) where.moderator_id = filters.moderatorId;
    if (filters.action) where.action = filters.action;
    if (filters.targetType) where.target_type = filters.targetType;
    if (filters.fromDate || filters.toDate) {
        where.created_at = {};
        if (filters.fromDate) where.created_at.gte = filters.fromDate;
        if (filters.toDate) where.created_at.lte = filters.toDate;
    }

    const [logs, total] = await Promise.all([
        prisma.moderationLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
            include: {
                moderator: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true
                    }
                }
            }
        }),
        prisma.moderationLog.count({ where })
    ]);

    return {
        data: logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}

// ============= STATISTICS =============

/**
 * Get moderation statistics
 */
export async function getModerationStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
        pendingReports,
        resolvedReportsLast30Days,
        activeBans,
        bannedKeywords,
        moderationActionsLast30Days
    ] = await Promise.all([
        prisma.report.count({ where: { status: 'PENDING' } }),
        prisma.report.count({
            where: {
                status: 'RESOLVED',
                processed_at: { gte: thirtyDaysAgo }
            }
        }),
        prisma.userBan.count({
            where: {
                is_active: true,
                OR: [
                    { ends_at: null },
                    { ends_at: { gt: now } }
                ]
            }
        }),
        prisma.bannedKeyword.count({ where: { is_active: true } }),
        prisma.moderationLog.count({
            where: { created_at: { gte: thirtyDaysAgo } }
        })
    ]);

    return {
        pendingReports,
        resolvedReportsLast30Days,
        activeBans,
        bannedKeywords,
        moderationActionsLast30Days
    };
}
