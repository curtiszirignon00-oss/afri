import zod from 'zod';
import { validate } from '../utils/validate.util';

const RESERVED_USERNAMES = new Set([
    'afribourse', 'admin', 'administrator', 'support', 'official',
    'help', 'contact', 'info', 'service', 'team',
]);

const urlOrEmpty = zod.string().url('URL invalide').optional().or(zod.literal(''));

export const updateProfileSchema = zod.object({
    name: zod.string().min(1).max(50, 'Le prénom ne peut pas dépasser 50 caractères').optional(),
    lastname: zod.string().min(1).max(50, 'Le nom ne peut pas dépasser 50 caractères').optional(),
    username: zod.string()
        .min(3, 'Le nom d\'utilisateur doit contenir entre 3 et 30 caractères')
        .max(30, 'Le nom d\'utilisateur doit contenir entre 3 et 30 caractères')
        .regex(/^[a-zA-Z0-9_]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores')
        .refine(u => !RESERVED_USERNAMES.has(u.toLowerCase()), 'Ce nom d\'utilisateur est réservé')
        .optional(),
    bio: zod.string().max(200, 'La bio ne peut pas dépasser 200 caractères').optional(),
    avatar_url: urlOrEmpty,
    country: zod.string().max(100).optional(),
    birth_date: zod.string().datetime({ offset: true }).optional().or(zod.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    investment_style: zod.string().max(100).optional(),
    risk_tolerance: zod.string().max(50).optional(),
    investment_horizon: zod.string().max(50).optional(),
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Au moins un champ est requis pour la mise à jour' }
);

const booleanField = zod.boolean().optional();

export const updatePrivacySchema = zod.object({
    is_public: booleanField,
    show_avatar: booleanField,
    show_bio: booleanField,
    show_country: booleanField,
    show_birth_date: booleanField,
    show_level: booleanField,
    show_xp: booleanField,
    show_rank: booleanField,
    show_streak: booleanField,
    show_portfolio_value: booleanField,
    show_roi: booleanField,
    show_positions: booleanField,
    show_transactions: booleanField,
    show_watchlist: booleanField,
    show_achievements: booleanField,
    show_badges: booleanField,
    show_completed_modules: booleanField,
    show_quiz_scores: booleanField,
    show_followers_count: booleanField,
    show_following_count: booleanField,
    show_followers_list: booleanField,
    show_following_list: booleanField,
    show_activity_feed: booleanField,
    appear_in_search: booleanField,
    appear_in_suggestions: booleanField,
    allow_follow_requests: booleanField,
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Au moins un champ est requis' }
);

export const validateUpdateProfile = validate(updateProfileSchema);
export const validateUpdatePrivacy = validate(updatePrivacySchema);
