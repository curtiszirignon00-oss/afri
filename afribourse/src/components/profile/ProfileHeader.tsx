// src/components/profile/ProfileHeader.tsx
import { useState } from 'react';
import { MapPin, Link as LinkIcon, Calendar, CheckCircle, Edit2, Linkedin, Twitter, Instagram, Facebook, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';
import FollowButton from './FollowButton';
import EditProfileModal from './EditProfileModal';
import toast from 'react-hot-toast';

interface ProfileHeaderProps {
    profile: any;
    isOwnProfile?: boolean;
}

export default function ProfileHeader({ profile, isOwnProfile = false }: ProfileHeaderProps) {
    const [showEditModal, setShowEditModal] = useState(false);

    // Couleur de l'avatar (par défaut gradient bleu-violet)
    const avatarColor = profile.profile?.avatar_color || 'from-blue-500 to-purple-600';
    // Couleur de la bannière (par défaut gradient bleu-violet)
    const bannerColor = profile.profile?.banner_color || 'from-blue-600 via-indigo-600 to-purple-700';

    const socialLinks = profile.profile?.social_links;
    const hasSocialLinks = socialLinks && (socialLinks.linkedin || socialLinks.twitter || socialLinks.instagram || socialLinks.facebook || socialLinks.website);

    return (
        <div className="bg-white shadow-sm">
            {/* Banner */}
            <div className="relative">
                <div className={`h-32 sm:h-48 md:h-56 lg:h-64 relative bg-gradient-to-br ${bannerColor}`}>
                    {/* Overlay gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
            </div>

            {/* Profile Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 sm:-mt-20 pb-6">
                    {/* Top Row: Avatar + Stats + Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-white bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-xl ring-4 ring-white`}>
                                {`${profile.name?.[0] || ''}${profile.lastname?.[0] || ''}`}
                            </div>
                            {/* Online indicator */}
                            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
                        </div>

                        {/* Stats Cards - Desktop */}
                        <div className="hidden sm:flex items-center gap-3 flex-1 mt-4 sm:mt-0">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                                <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-colors">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{profile.stats?.following_count || 0}</p>
                                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Abonnements</p>
                                </div>
                                <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-colors">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{profile.stats?.followers_count || 0}</p>
                                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Abonnés</p>
                                </div>
                                <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-colors">
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{profile.stats?.posts_count || 0}</p>
                                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Publications</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto mt-4 sm:mt-0">
                            {isOwnProfile ? (
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    <span>Modifier le profil</span>
                                </button>
                            ) : (
                                <>
                                    <button className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                    <button className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
                                        <MessageCircle className="w-5 h-5" />
                                    </button>
                                    <FollowButton userId={profile.id} initialFollowing={profile.isFollowing} />
                                </>
                            )}
                            <button
                                onClick={() => {
                                    const shareData = {
                                        title: `Profil de ${profile.name} ${profile.lastname}`,
                                        text: `Découvrez le profil de ${profile.name} sur AfriBourse`,
                                        url: window.location.href,
                                    };
                                    if (navigator.share) {
                                        navigator.share(shareData).catch(() => {
                                            // Fallback si l'utilisateur annule
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success('Lien copié !');
                                        });
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                        toast.success('Lien copié !');
                                    }
                                }}
                                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards - Mobile */}
                    <div className="sm:hidden mt-4">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-gray-900">{profile.stats?.following_count || 0}</p>
                                <p className="text-xs text-gray-500">Abonnements</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-gray-900">{profile.stats?.followers_count || 0}</p>
                                <p className="text-xs text-gray-500">Abonnés</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-gray-900">{profile.stats?.posts_count || 0}</p>
                                <p className="text-xs text-gray-500">Publications</p>
                            </div>
                        </div>
                    </div>

                    {/* Name & Username */}
                    <div className="mt-4 sm:mt-6">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {profile.name} {profile.lastname}
                            </h1>
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

                    {/* Bio */}
                    {profile.profile?.bio && (
                        <p className="mt-4 text-gray-700 text-base leading-relaxed max-w-3xl">
                            {profile.profile.bio}
                        </p>
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
                                    className="p-2.5 bg-[#0077B5]/10 text-[#0077B5] rounded-xl hover:bg-[#0077B5]/20 transition-colors"
                                    title="LinkedIn"
                                >
                                    <Linkedin className="w-5 h-5" />
                                </a>
                            )}
                            {socialLinks?.twitter && (
                                <a
                                    href={socialLinks.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
                                    title="Twitter/X"
                                >
                                    <Twitter className="w-5 h-5" />
                                </a>
                            )}
                            {socialLinks?.instagram && (
                                <a
                                    href={socialLinks.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-pink-600 rounded-xl hover:from-purple-500/20 hover:to-pink-500/20 transition-colors"
                                    title="Instagram"
                                >
                                    <Instagram className="w-5 h-5" />
                                </a>
                            )}
                            {socialLinks?.facebook && (
                                <a
                                    href={socialLinks.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 bg-[#1877F2]/10 text-[#1877F2] rounded-xl hover:bg-[#1877F2]/20 transition-colors"
                                    title="Facebook"
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
