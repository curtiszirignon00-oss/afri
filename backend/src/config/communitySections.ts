// src/config/communitySections.ts
// Catalogue central des rubriques de communauté (ex: communauté "investisseur+").
// Source de vérité côté backend pour l'application des permissions.
import type { CommunitySection, PostType } from '@prisma/client';

export type SectionWrite = 'admin' | 'members' | 'everyone';
export type EmailPolicy = 'none' | 'all' | 'admin_only';

export interface SectionConfig {
    key: CommunitySection;
    /** Types de posts autorisés pour les membres (vide = membres ne peuvent pas poster). */
    memberPostTypes: PostType[];
    write: SectionWrite;
    /** L'admin peut publier du contenu riche (HTML). */
    adminHtml: boolean;
    allowImages: boolean;
    allowVideo: boolean;
    allowPdf: boolean;
    /** Déblocage des fichiers (vidéo/PDF) par niveau (unlock_level par post). */
    levelGated: boolean;
    /** Politique d'email aux membres lors d'un nouveau post. */
    emailOnPost: EmailPolicy;
}

export const SECTION_CONFIG: Record<CommunitySection, SectionConfig> = {
    DEAL_FLOW: {
        key: 'DEAL_FLOW',
        memberPostTypes: [], // admin only
        write: 'admin',
        adminHtml: true,
        allowImages: false,
        allowVideo: false,
        allowPdf: false,
        levelGated: false,
        emailOnPost: 'all',
    },
    RECAPS_REPLAYS: {
        key: 'RECAPS_REPLAYS',
        memberPostTypes: [],
        write: 'admin',
        adminHtml: true,
        allowImages: false,
        allowVideo: true,
        allowPdf: true,
        levelGated: true,
        emailOnPost: 'none',
    },
    MES_ANALYSES: {
        key: 'MES_ANALYSES',
        memberPostTypes: ['OPINION', 'ANALYSIS', 'QUESTION', 'TRANSACTION', 'ARTICLE'],
        write: 'members',
        adminHtml: true,
        allowImages: true,
        allowVideo: false,
        allowPdf: false,
        levelGated: false,
        emailOnPost: 'admin_only',
    },
    EXERCICES_CHALLENGES: {
        key: 'EXERCICES_CHALLENGES',
        memberPostTypes: [],
        write: 'admin',
        adminHtml: true,
        allowImages: true,
        allowVideo: false,
        allowPdf: false,
        levelGated: false,
        emailOnPost: 'none',
    },
    GENERAL: {
        key: 'GENERAL',
        memberPostTypes: ['OPINION'],
        write: 'everyone',
        adminHtml: false,
        allowImages: true,
        allowVideo: false,
        allowPdf: false,
        levelGated: false,
        emailOnPost: 'none',
    },
    ANNONCES: {
        key: 'ANNONCES',
        memberPostTypes: [],
        write: 'admin',
        adminHtml: true,
        allowImages: false,
        allowVideo: false,
        allowPdf: true,
        levelGated: false,
        emailOnPost: 'all',
    },
};

/** Slugs des communautés dont les rubriques sont activées par défaut (sans toucher la config DB). */
export const SECTIONS_ENABLED_SLUGS = ['investisseur-'];

export function isSectionsCommunity(slug: string, settings: unknown): boolean {
    if (SECTIONS_ENABLED_SLUGS.includes(slug)) return true;
    const s = (settings ?? {}) as Record<string, unknown>;
    return s.sections_enabled === true;
}
