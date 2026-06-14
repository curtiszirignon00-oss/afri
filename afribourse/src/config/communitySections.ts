// src/config/communitySections.ts
// Catalogue des rubriques de communauté (UI + permissions côté client).
import type { PostType } from '../hooks/useCommunity';

export type CommunitySection =
    | 'DEAL_FLOW'
    | 'RECAPS_REPLAYS'
    | 'MES_ANALYSES'
    | 'EXERCICES_CHALLENGES'
    | 'GENERAL'
    | 'ANNONCES';

export type SectionWrite = 'admin' | 'members' | 'everyone';

export interface SectionConfig {
    key: CommunitySection;
    label: string;
    emoji: string;
    description: string;
    write: SectionWrite;
    /** L'admin peut publier du contenu riche (HTML). */
    adminHtml: boolean;
    /** Types de posts autorisés pour les membres (vide = membres ne peuvent pas poster). */
    memberPostTypes: PostType[];
    allowImages: boolean;
    allowVideo: boolean;
    allowPdf: boolean;
    levelGated: boolean;
    placeholder: string;
}

export const SECTION_CONFIG: Record<CommunitySection, SectionConfig> = {
    DEAL_FLOW: {
        key: 'DEAL_FLOW',
        label: 'Deal Flow',
        emoji: '📊',
        description: 'Opportunités et flux de deals — publié par l\'équipe AfriBourse.',
        write: 'admin',
        adminHtml: true,
        memberPostTypes: [],
        allowImages: false,
        allowVideo: false,
        allowPdf: false,
        levelGated: false,
        placeholder: 'Rédigez le deal flow (HTML/markdown autorisé)…',
    },
    RECAPS_REPLAYS: {
        key: 'RECAPS_REPLAYS',
        label: 'Récaps & Replays',
        emoji: '🎓',
        description: 'Récapitulatifs et rediffusions — vidéos et PDF déblocables selon votre niveau.',
        write: 'admin',
        adminHtml: true,
        memberPostTypes: [],
        allowImages: false,
        allowVideo: true,
        allowPdf: true,
        levelGated: true,
        placeholder: 'Décrivez le récap / replay…',
    },
    MES_ANALYSES: {
        key: 'MES_ANALYSES',
        label: 'Mes analyses',
        emoji: '📈',
        description: 'Partagez vos analyses, opinions et questions. L\'apprentissage par la pratique.',
        write: 'members',
        adminHtml: true,
        memberPostTypes: ['OPINION', 'ANALYSIS', 'QUESTION', 'TRANSACTION', 'ARTICLE'],
        allowImages: true,
        allowVideo: false,
        allowPdf: false,
        levelGated: false,
        placeholder: 'Partagez votre analyse avec la communauté…',
    },
    EXERCICES_CHALLENGES: {
        key: 'EXERCICES_CHALLENGES',
        label: 'Exercices & Challenges',
        emoji: '🎯',
        description: 'Exercices pratiques et défis — à lire et résoudre directement dans le fil.',
        write: 'admin',
        adminHtml: true,
        memberPostTypes: [],
        allowImages: true,
        allowVideo: false,
        allowPdf: false,
        levelGated: false,
        placeholder: 'Rédigez l\'exercice / le challenge (template, image de graphique optionnelle)…',
    },
    GENERAL: {
        key: 'GENERAL',
        label: 'Général',
        emoji: '💬',
        description: 'Espace libre — discussions, liens, partages. Aucune contrainte de format.',
        write: 'everyone',
        adminHtml: false,
        memberPostTypes: ['OPINION'],
        allowImages: true,
        allowVideo: false,
        allowPdf: false,
        levelGated: false,
        placeholder: 'Partagez quelque chose avec la communauté…',
    },
    ANNONCES: {
        key: 'ANNONCES',
        label: 'Annonces',
        emoji: '📢',
        description: 'Communications officielles — lecture seule pour les membres.',
        write: 'admin',
        adminHtml: true,
        memberPostTypes: [],
        allowImages: false,
        allowVideo: false,
        allowPdf: true,
        levelGated: false,
        placeholder: 'Rédigez l\'annonce officielle…',
    },
};

export const SECTION_ORDER: CommunitySection[] = [
    'DEAL_FLOW',
    'RECAPS_REPLAYS',
    'MES_ANALYSES',
    'EXERCICES_CHALLENGES',
    'GENERAL',
    'ANNONCES',
];

/** Slugs des communautés à rubriques activées par défaut. */
export const SECTIONS_ENABLED_SLUGS = ['investisseur-'];

export function isSectionsCommunity(slug?: string, settings?: { sections_enabled?: boolean } | null): boolean {
    if (slug && SECTIONS_ENABLED_SLUGS.includes(slug)) return true;
    return settings?.sections_enabled === true;
}

/**
 * Détermine si un utilisateur peut publier dans une rubrique.
 * isAdmin = admin plateforme OU owner/admin de la communauté.
 */
export function canPostInSection(section: CommunitySection, isAdmin: boolean): boolean {
    const cfg = SECTION_CONFIG[section];
    if (cfg.write === 'admin') return isAdmin;
    return true; // 'members' et 'everyone' : tout membre
}
