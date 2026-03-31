import zod from 'zod';
import { validate } from '../utils/validate.util';

const urlOrEmpty = zod.string().url('URL invalide').optional().or(zod.literal(''));

const communityRuleSchema = zod.object({
    title: zod.string().min(1).max(100),
    description: zod.string().max(500).optional(),
});

const communitySettingsSchema = zod.object({
    allow_posts: zod.boolean().optional(),
    require_post_approval: zod.boolean().optional(),
    min_level: zod.number().int().nonnegative().optional(),
    allow_invitations: zod.boolean().optional(),
}).optional();

export const createCommunitySchema = zod.object({
    name: zod.string().min(3, 'Le nom doit contenir au moins 3 caractères').max(100),
    description: zod.string().max(1000).optional(),
    avatar_url: urlOrEmpty,
    banner_url: urlOrEmpty,
    visibility: zod.enum(['PUBLIC', 'PRIVATE', 'SECRET']).optional(),
    rules: zod.array(communityRuleSchema).max(20).optional(),
    category: zod.string().max(100).optional(),
    tags: zod.array(zod.string().max(50)).max(10).optional(),
    settings: communitySettingsSchema,
});

export const updateCommunitySchema = createCommunitySchema.partial().refine(
    data => Object.keys(data).length > 0,
    { message: 'Au moins un champ est requis pour la mise à jour' }
);

export const updateMemberRoleSchema = zod.object({
    role: zod.enum(['ADMIN', 'MODERATOR', 'MEMBER']),
});

export const processJoinRequestSchema = zod.object({
    action: zod.enum(['approve', 'reject']),
    rejectReason: zod.string().max(500).optional(),
});

const postTypeEnum = zod.enum(['ANALYSIS', 'TRANSACTION', 'OPINION', 'NEWS', 'QUESTION', 'EDUCATION']);

export const createCommunityPostSchema = zod.object({
    type: postTypeEnum.optional(),
    content: zod.string().min(1, 'Le contenu est requis').max(5000),
    title: zod.string().max(200).optional(),
    stock_symbol: zod.string().max(10).optional(),
    stock_price: zod.number().nonnegative().optional(),
    stock_change: zod.number().optional(),
    images: zod.array(zod.string().url('URL d\'image invalide')).max(10).optional(),
    video_url: urlOrEmpty,
    tags: zod.array(zod.string().max(50)).max(10).optional(),
});

export const commentCommunityPostSchema = zod.object({
    content: zod.string().min(1, 'Le commentaire est requis').max(2000),
    parentId: zod.string().optional(),
});

export const validateCreateCommunity = validate(createCommunitySchema);
export const validateUpdateCommunity = validate(updateCommunitySchema);
export const validateUpdateMemberRole = validate(updateMemberRoleSchema);
export const validateProcessJoinRequest = validate(processJoinRequestSchema);
export const validateCreateCommunityPost = validate(createCommunityPostSchema);
export const validateCommentCommunityPost = validate(commentCommunityPostSchema);
