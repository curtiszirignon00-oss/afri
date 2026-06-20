// src/components/profile/ProfileHeader.tsx
import { useState } from 'react';
import { MapPin, Link as LinkIcon, Calendar, CheckCircle, Edit2, Linkedin, Twitter, Instagram, Facebook, MessageCircle, MoreHorizontal, Share2, ShieldCheck, ArrowLeft, Flame, Trophy, Copy, ImageDown } from 'lucide-react';
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

export default function ProfileHeader({ profile, isOwnProfile = false, onBack, heroStats, profileUrl, onShareCard }: ProfileHeaderProps) {
    const [showEditModal, setShowEditModal] = useState(false);

    const avatarColor = profile.profile?.avatar_color || 'from-blue-500 to-purple-600';
    const bannerColor = profile.profile?.banner_color || 'from-blue-600 via-indigo-600 to-purple-700';
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

    return (
        <div className="bg-white shadow-sm">
            {/* Banner */}
            <div className="relative">
                <div
                    className={`h-32 sm:h-48 md:h-56 lg:h-64 relative ${bannerUrl ? '' : `bg-gradient-to-br ${bannerColor}`}`}
                    style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-black/50 transition-colors cursor-pointer"
                            aria-label="Retour"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Retour</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 sm:-mt-20 pb-6">
                    {/* Top Row: Avatar + Stats + Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={`${profile.name} ${profile.lastname}`}
                                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-white object-cover shadow-xl ring-4 ring-white"
                                />
                            ) : (
                                <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-white bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-xl ring-4 ring-white`}>
                                    {initials}
                                </div>
                            )}
                        </div>

                        {/* Spacer pour pousser les actions à droite sur desktop */}
                        <div className="hidden sm:block flex-1" />

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:ml-auto mt-4 sm:mt-0">
                            {isOwnProfile ? (
                                <>
                                    <button
                                        onClick={handleCopyLink}
                                        className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        <span>Copier mon lien</span>
                                    </button>
                                    <button
                                        onClick={() => (onShareCard ? onShareCard() : toast('Carte partageable bientôt disponible', { icon: '🪪' }))}
                                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                                    >
                                        <ImageDown className="w-4 h-4" />
                                        <span>Partager ma carte</span>
                                    </button>
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        aria-label="Modifier le profil"
                                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => toast('Bientôt disponible', { icon: '🔜' })}
                                        aria-label="Plus d'options"
                                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => toast('Messagerie bientôt disponible', { icon: '💬' })}
                                        aria-label="Envoyer un message"
                                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                    </button>
                                    <div onClick={() => trackProfileFollowClicked(profile.id)}>
                                        <FollowButton userId={profile.id} initialFollowing={profile.isFollowing} />
                                    </div>
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
                                        className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Name & Username */}
                    <div className="mt-4 sm:mt-6">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {profile.name} {profile.lastname}
                            </h1>
                            <RareBadgeIcon badge={rareBadge} size="sm" />
                            {profile.role === 'admin' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium" title="Administrateur">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="hidden sm:inline">Admin</span>
                                </span>
                            )}
                            {profile.profile?.verified_investor && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium" title="Investisseur vérifié">
                                    <CheckCircle className="w-4 h-4" />
                                    <span className="hidden sm:inline">Vérifié</span>
                                </span>
                            )}
                        </div>
                        {profile.profile?.username && (
                            <p className="text-gray-500 mt-1">@{profile.profile.username}</p>
                        )}
                    </div>

                    {/* Identité : titre auto + chips de statut */}
                    <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-full text-sm font-semibold">
                                {levelTitle.emoji} {autoTitle}
                            </span>
                            {currentStreak > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                                    <Flame className="w-3.5 h-3.5" />
                                    {currentStreak} j
                                </span>
                            )}
                            {percentile != null && percentile > 0 && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                                    <Trophy className="w-3.5 h-3.5" />
                                    Top {Math.max(1, Math.round(percentile))}%
                                </span>
                            )}
                            {monthlyRoi != null && (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium ${monthlyRoi >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    ROI mois {monthlyRoi >= 0 ? '+' : ''}{monthlyRoi.toFixed(1)}%
                                </span>
                            )}
                        </div>

                        {/* Barre de progression XP vers le niveau suivant */}
                        <div className="mt-3 max-w-md">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Niveau {level}</span>
                                <span>{xpInLevel.toLocaleString('fr-FR')} / {xpNeeded.toLocaleString('fr-FR')} XP</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full transition-all motion-reduce:transition-none"
                                    style={{ width: `${xpProgressPct}%` }}
                                />
                            </div>
                        </div>

                        {/* Ligne de statistiques sociales */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                            <span className="text-gray-700"><span className="font-bold text-gray-900">{totalXp.toLocaleString('fr-FR')}</span> XP</span>
                            {showFollowing && (
                                <span className="text-gray-700"><span className="font-bold text-gray-900">{profile.stats?.following_count || 0}</span> abonnements</span>
                            )}
                            {showFollowers && (
                                <span className="text-gray-700"><span className="font-bold text-gray-900">{profile.stats?.followers_count || 0}</span> abonnés</span>
                            )}
                            {completedModules != null && (
                                <span className="text-gray-700"><span className="font-bold text-gray-900">{completedModules}</span> modules</span>
                            )}
                            {rank != null && rank > 0 && (
                                <span className="text-gray-700">Classement <span className="font-bold text-gray-900">#{rank}</span></span>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.profile?.bio ? (
                        <p className="mt-4 text-gray-700 text-base leading-relaxed max-w-3xl">
                            {profile.profile.bio}
                        </p>
                    ) : isOwnProfile ? (
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="mt-4 text-left text-sm text-gray-500 italic hover:text-teal-700 transition-colors cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
                        >
                            Ajoute une bio pour dire à la communauté quel type d'investisseur tu veux devenir →
                        </button>
                    ) : null}

                    {/* Tags de spécialité */}
                    {Array.isArray(profile.profile?.specialty_tags) && profile.profile.specialty_tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {profile.profile.specialty_tags.map((tag: string) => (
                                <span key={tag} className="inline-flex items-center px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Meta Info Row */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                        {profile.profile?.country && (
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                <span>{profile.profile.country}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>A rejoint en {new Date(profile.joined_at || profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                        </div>
                        {socialLinks?.website && (
                            <a
                                href={socialLinks.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-blue-600 hover:underline"
                            >
                                <LinkIcon className="w-4 h-4" />
                                <span className="truncate max-w-[200px]">{socialLinks.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                            </a>
                        )}
                    </div>

                    {/* Social Links */}
                    {hasSocialLinks && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {socialLinks?.linkedin && (
                                <a
                                    href={socialLinks.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="LinkedIn"
                                    className="p-2.5 bg-[#0077B5]/10 text-[#0077B5] rounded-xl hover:bg-[#0077B5]/20 transition-colors"
                                >
                                    <Linkedin className="w-5 h-5" />
                                </a>
                            )}
                            {socialLinks?.twitter && (
                                <a
                                    href={socialLinks.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Twitter/X"
                                    className="p-2.5 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    <Twitter className="w-5 h-5" />
                                </a>
                            )}
                            {socialLinks?.instagram && (
                                <a
                                    href={socialLinks.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram"
                                    className="p-2.5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-pink-600 rounded-xl hover:from-purple-500/20 hover:to-pink-500/20 transition-colors"
                                >
                                    <Instagram className="w-5 h-5" />
                                </a>
                            )}
                            {socialLinks?.facebook && (
                                <a
                                    href={socialLinks.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Facebook"
                                    className="p-2.5 bg-[#1877F2]/10 text-[#1877F2] rounded-xl hover:bg-[#1877F2]/20 transition-colors"
                                >
                                    <Facebook className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                profile={profile}
            />
        </div>
    );
}
