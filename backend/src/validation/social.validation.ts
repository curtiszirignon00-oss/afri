import zod from 'zod';
import { validate } from '../utils/validate.util';

const postTypeEnum = zod.enum(['ANALYSIS', 'TRANSACTION', 'OPINION', 'QUESTION', 'ACHIEVEMENT', 'ARTICLE']);
const visibilityEnum = zod.enum(['PUBLIC', 'FOLLOWERS', 'PRIVATE']);

// Images come exclusively from our own upload endpoint — no need to re-validate URL format.
// zod .url() rejects localhost and env-misconfigured URLs (missing https:// prefix).
const imageUrl = zod.string().min(1, 'URL d\'image invalide');

// For video_url: accept any non-empty string that looks like a URL, or empty string
const urlOrEmpty = zod.string().min(1).optional().or(zod.literal(''));

export const createPostSchema = zod.object({
    type: postTypeEnum,
    content: zod.string().min(1, 'Le contenu est requis').max(5000, 'Le contenu ne peut pas dépasser 5000 caractères'),
    title: zod.string().max(200).optional(),
    stock_symbol: zod.string().max(10).optional(),
    stock_price: zod.number().nonnegative().nullish(),
    stock_change: zod.number().nullish(),
    images: zod.array(imageUrl).max(10).optional(),
    video_url: urlOrEmpty,
    tags: zod.array(zod.string().max(50)).max(10).optional(),
    visibility: visibilityEnum.optional(),
    metadata: zod.record(zod.string(), zod.unknown()).optional(),
});

export const updatePostSchema = createPostSchema.partial().refine(
    data => Object.keys(data).length > 0,
    { message: 'Au moins un champ est requis pour la mise à jour' }
);

export const commentSchema = zod.object({
    content: zod.string().min(1, 'Le commentaire est requis').max(2000, 'Le commentaire ne peut pas dépasser 2000 caractères'),
    parentId: zod.string().optional(),
});

export const validateCreatePost = validate(createPostSchema);
export const validateUpdatePost = validate(updatePostSchema);
export const validateComment = validate(commentSchema);
