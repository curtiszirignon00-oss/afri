// src/components/profile/ProfileHeader.tsx
//
// Hero identitaire du profil — « Passeport Investisseur ».
//
// L'ancien bandeau partait sur un degrade bleu -> indigo -> violet et posait
// l'identite sur du blanc : trois familles de couleurs absentes du logo, et une
// entete qui ne ressemblait a aucune autre page du site. Il reprend desormais le
// fond navy signature (utils/heroBackgrounds), comme l'accueil, /communities et
// les pages editoriales : degrade navy, halo bleu clair, trame quadrillee. Toute
// l'identite (nom, ADN, XP, statistiques, bio) vit sur ce fond sombre, l'orange
// de marque servant d'unique accent.
import { useState } from 'react';
import { MapPin, Link as LinkIcon, CheckCircle, Edit2, Linkedin, Twitter, Instagram, Facebook, MessageCircle, MoreHorizontal, Share2, ShieldCheck, ArrowLeft, Copy, ImageDown, Clock } from 'lucide-react';
import FollowButton from './FollowButton';
import EditProfileModal from './EditProfileModal';
import toast from 'react-hot-toast';
import RareBadgeIcon, { getRareBadge } from '../common/RareBadgeIcon';
import { getLevelTitle, getXPRequiredForLevel } from '../../hooks/useGamification';
import { getDnaShortLabel } from './InvestorDNA';
import { trackProfileLinkCopied, trackProfileFollowClicked } from '../../lib/amplitude';

export interface HeroStats {
    level?: number;
    totalXp?: number;
    currentStreak?: number;
    percentile?: number | null;
    rank?: number | null;
    monthlyRoi?: number | null;
    completedModules?: number | null;
    profileType?: string | null;
}

interface ProfileHeaderProps {
    profile: any;
    isOwnProfile?: boolean;
    onBack?: () => void;
    /** Données calculées pour le hero identitaire (niveau, XP, percentile, ROI…). */
    heroStats?: HeroStats;
    /** URL publique du profil à copier / partager. */
    profileUrl?: string;
    /** Ouvre la génération de la carte ADN partageable (chantier 2). */
    onShareCard?: () => void;
}

/** Bouton icone pose sur le fond sombre du hero. */
const GHOST_ICON_BTN =
    'p-2.5 rounded-xl bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20 transition-colors ' +
    'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy';

/** Pastille de statut sur fond sombre. */
const CHIP =
    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ' +
    'bg-white/10 text-white ring-1 ring-white/15';

export default function ProfileHeader({ profile, isOwnProfile = false, onBack, heroStats, profileUrl, onShareCard }: ProfileHeaderProps) {
    const [showEditModal, setShowEditModal] = useState(false);

    // Avatar : la couleur choisie par l'utilisateur prime, sinon l'orange de marque.
    const avatarColor = profile.profile?.avatar_color || 'from-brand-orange to-brand-orange-dark';
    const bannerUrl = profile.profile?.banner_url;
    const avatarUrl = profile.profile?.avatar_url;

    const showFollowers = profile.investorProfile?.show_followers_count !== false;
    const showFollowing = profile.investorProfile?.show_following_count !== false;

    const socialLinks = profile.profile?.social_links;
    const hasSocialLinks = socialLinks && (socialLinks.linkedin || socialLinks.twitter || socialLinks.instagram || socialLinks.facebook || socialLinks.website);

    const rareBadge = getRareBadge(profile.achievements);
    const initials = `${profile.name?.[0] || ''}${profile.lastname?.[0] || ''}`;

    // ── Hero identitaire ──────────────────────────────────────────────────────
    const level = heroStats?.level ?? profile.investorProfile?.level ?? profile.profile?.level ?? 1;
    const totalXp = heroStats?.totalXp ?? profile.investorProfile?.total_xp ?? profile.profile?.total_xp ?? 0;
    const currentStreak = heroStats?.currentStreak ?? profile.investorProfile?.current_streak ?? 0;
    const percentile = heroStats?.percentile ?? null;
    const rank = heroStats?.rank ?? null;
    const monthlyRoi = heroStats?.monthlyRoi ?? null;
    const completedModules = heroStats?.completedModules ?? null;

    // Titre auto : ADN + niveau (ex. « Investisseur Croissance · Niveau 7 »).
    const dnaLabel = getDnaShortLabel(heroStats?.profileType ?? profile.investorProfile?.profile_type ?? null);
    const levelTitle = getLevelTitle(level);
    const autoTitle = `${dnaLabel || levelTitle.title} · Niveau ${level}`;

    // Progression XP vers le niveau suivant.
    const xpForCurrent = level <= 1 ? 0 : getXPRequiredForLevel(level);
    const xpForNext = getXPRequiredForLevel(level + 1);
    const xpInLevel = Math.max(0, totalXp - xpForCurrent);
    const xpNeeded = Math.max(1, xpForNext - xpForCurrent);
    const xpProgressPct = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

    const publicUrl = profileUrl || (typeof window !== 'undefined' ? window.location.href : '');

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicUrl)
            .then(() => {
                toast.success('Lien copié !');
                trackProfileLinkCopied(profile.id, publicUrl);
            })
            .catch(() => toast.error('Impossible de copier le lien'));
    };

    // Rail de statistiques : uniquement les valeurs renseignees, en chiffres mono.
    const railStats: { label: string; value: string }[] = [
        { label: 'XP total', value: totalXp.toLocaleString('fr-FR') },
        ...(showFollowers ? [{ label: 'Abonnés', value: (profile.stats?.followers_count || 0).toLocaleString('fr-FR') }] : []),
        ...(showFollowing ? [{ label: 'Abonnements', value: (profile.stats?.following_count || 0).toLocaleString('fr-FR') }] : []),
        { label: 'Publications', value: (profile.stats?.posts_count || 0).toLocaleString('fr-FR') },
        ...(completedModules != null ? [{ label: 'Modules', value: String(completedModules) }] : []),
        ...(rank != null && rank > 0 ? [{ label: 'Classement', value: `#${rank}` }] : []),
    ];

    return (
        <header className="relative overflow-hidden text-white bg-brand-navy">

            {/* Banniere personnalisee : elle occupe la bande haute puis s'efface
                par masque. Un calque degrade aurait laisse une couture nette avec
                le fond du hero, dont la teinte varie horizontalement (135deg) ;
                le masque, lui, laisse le navy reapparaitre exactement. */}
            {bannerUrl && (
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-28 sm:h-36 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${bannerUrl})`,
                        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)',
                    }}
                />
            )}

            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 sm:left-6 lg:left-8 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-colors cursor-pointer"
                    aria-label="Retour"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                </button>
            )}

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-6 sm:pb-8">
                {/* Rangee haute : avatar + actions */}
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                    <div className="shrink-0">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={`${profile.name} ${profile.lastname}`}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-2 ring-white/25 shadow-xl shadow-ink-950/40"
                            />
                        ) : (
                            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-2xl sm:text-3xl font-bold ring-2 ring-white/25 shadow-xl shadow-ink-950/40`}>
                                {initials}
                            </div>
                        )}
                    </div>

                    <div className="hidden sm:block flex-1" />

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:ml-auto">
                        {isOwnProfile ? (
                            <>
                                <button
                                    onClick={() => (onShareCard ? onShareCard() : toast('Carte partageable bientôt disponible', { icon: '🪪' }))}
                                    className="px-5 py-2.5 rounded-xl bg-brand-orange text-white font-semibold shadow-sm hover:bg-brand-orange-hover hover:shadow-md hover:shadow-brand-orange/30 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
                                >
                                    <ImageDown className="w-4 h-4" />
                                    <span>Partager ma carte</span>
                                </button>
                                <button
                                    onClick={handleCopyLink}
                                    className="px-4 py-2.5 rounded-xl border-2 border-white/70 text-white font-semibold hover:bg-white hover:text-brand-navy transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
                                >
                                    <Copy className="w-4 h-4" />
                                    <span>Copier mon lien</span>
                                </button>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    aria-label="Modifier le profil"
                                    className={GHOST_ICON_BTN}
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <>
                                <div onClick={() => trackProfileFollowClicked(profile.id)}>
                                    <FollowButton userId={profile.id} initialFollowing={profile.isFollowing} onDark />
                                </div>
                                <button
                                    onClick={() => toast('Messagerie bientôt disponible', { icon: <MessageCircle className="w-5 h-5 text-brand-navy" /> })}
                                    aria-label="Envoyer un message"
                                    className={GHOST_ICON_BTN}
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </button>
                                <button
                                    aria-label="Partager le profil"
                                    onClick={() => {
                                        const shareData = {
                                            title: `Profil de ${profile.name} ${profile.lastname}`,
                                            text: `Découvrez le profil de ${profile.name} sur AfriBourse`,
                                            url: publicUrl,
                                        };
                                        if (navigator.share) {
                                            navigator.share(shareData).catch(handleCopyLink);
                                        } else {
                                            handleCopyLink();
                                        }
                                    }}
                                    className={GHOST_ICON_BTN}
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => toast('Bientôt disponible', { icon: <Clock className="w-5 h-5 text-brand-navy" /> })}
                                    aria-label="Plus d'options"
                                    className={GHOST_ICON_BTN}
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Nom + pseudo */}
                <div className="mt-5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                            {profile.name} {profile.lastname}
                        </h1>
                        <RareBadgeIcon badge={rareBadge} size="sm" />
                        {profile.role === 'admin' && (
                            <span className={CHIP} title="Administrateur">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Admin</span>
                            </span>
                        )}
                        {profile.profile?.verified_investor && (
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-brand-orange/20 text-brand-orange-light ring-1 ring-brand-orange/40"
                                title="Investisseur vérifié"
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Vérifié</span>
                            </span>
                        )}
                    </div>
                    {profile.profile?.username && (
                        <p className="text-ink-300 mt-1 font-mono text-sm">@{profile.profile.username}</p>
                    )}
                </div>

                {/* Identite : titre auto + pastilles de statut */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-brand-orange text-white shadow-sm shadow-brand-orange/30">
                        {autoTitle}
                    </span>
                    {currentStreak > 0 && (
                        <span className={CHIP}>
                            {currentStreak} j de série
                        </span>
                    )}
                    {percentile != null && percentile > 0 && (
                        <span className={CHIP}>
                            Top {Math.max(1, Math.round(percentile))}%
                        </span>
                    )}
                    {monthlyRoi != null && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium ring-1 ${monthlyRoi >= 0 ? 'bg-green-400/15 text-green-300 ring-green-400/30' : 'bg-red-400/15 text-red-300 ring-red-400/30'}`}>
                            ROI mois {monthlyRoi >= 0 ? '+' : ''}{monthlyRoi.toFixed(1)}%
                        </span>
                    )}
                </div>

                {/* Progression XP vers le niveau suivant */}
                <div className="mt-5 max-w-md">
                    <div className="flex items-center justify-between text-xs text-ink-300 mb-1.5">
                        <span>Niveau {level}</span>
                        <span className="font-mono">{xpInLevel.toLocaleString('fr-FR')} / {xpNeeded.toLocaleString('fr-FR')} XP</span>
                    </div>
                    <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-brand-orange to-brand-orange-light rounded-full transition-all duration-500 motion-reduce:transition-none"
                            style={{ width: `${xpProgressPct}%` }}
                        />
                    </div>
                </div>

                {/* Bio */}
                {profile.profile?.bio ? (
                    <p className="mt-5 text-ink-100 leading-relaxed max-w-3xl">
                        {profile.profile.bio}
                    </p>
                ) : isOwnProfile ? (
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="mt-5 text-left text-sm text-ink-300 italic hover:text-white transition-colors cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy"
                    >
                        Ajoute une bio pour dire à la communauté quel type d'investisseur tu veux devenir →
                    </button>
                ) : null}

                {/* Tags de spécialité */}
                {Array.isArray(profile.profile?.specialty_tags) && profile.profile.specialty_tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {profile.profile.specialty_tags.map((tag: string) => (
                            <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-ink-100 ring-1 ring-white/15">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Rail de statistiques */}
                {railStats.length > 0 && (
                    <div className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
                        {railStats.map((s) => (
                            <div key={s.label} className="flex-1 min-w-[7.5rem] bg-[#12395E]/60 backdrop-blur-sm px-4 py-3">
                                <div className="font-mono text-xl font-bold text-white tabular-nums">{s.value}</div>
                                <div className="text-[11px] uppercase tracking-wide text-ink-300 mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Meta + liens sociaux */}
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-ink-300">
                    {profile.profile?.country && (
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {profile.profile.country}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        A rejoint en {new Date(profile.joined_at || profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                    {socialLinks?.website && (
                        <a
                            href={socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-brand-orange-light hover:text-white transition-colors"
                        >
                            <LinkIcon className="w-4 h-4" />
                            <span className="truncate max-w-[200px]">{socialLinks.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                        </a>
                    )}

                    {hasSocialLinks && (
                        <span className="flex items-center gap-2">
                            {socialLinks?.linkedin && (
                                <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                            )}
                            {socialLinks?.twitter && (
                                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter/X" className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    <Twitter className="w-4 h-4" />
                                </a>
                            )}
                            {socialLinks?.instagram && (
                                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            )}
                            {socialLinks?.facebook && (
                                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                                    <Facebook className="w-4 h-4" />
                                </a>
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                profile={profile}
            />
        </header>
    );
}
