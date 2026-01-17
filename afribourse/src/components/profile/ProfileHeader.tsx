// src/components/profile/ProfileHeader.tsx
import { useState, useRef } from 'react';
import { Camera, MapPin, Link as LinkIcon, Calendar, CheckCircle, Loader2, Edit2, Linkedin, Twitter, Instagram, Facebook, Globe, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';
import FollowButton from './FollowButton';
import EditProfileModal from './EditProfileModal';
import { useUploadAvatar, useUploadBanner } from '../../hooks/useUpload';
import toast from 'react-hot-toast';

interface ProfileHeaderProps {
    profile: any;
    isOwnProfile?: boolean;
}

export default function ProfileHeader({ profile, isOwnProfile = false }: ProfileHeaderProps) {
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar();
    const { mutate: uploadBanner, isPending: isUploadingBanner } = useUploadBanner();

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadAvatar(file);
        }
    };

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadBanner(file);
        }
    };

    // Déterminer l'image de bannière
    const bannerStyle = profile.profile?.banner_url
        ? { backgroundImage: `url(${profile.profile.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : {};

    const socialLinks = profile.profile?.social_links;
    const hasSocialLinks = socialLinks && (socialLinks.linkedin || socialLinks.twitter || socialLinks.instagram || socialLinks.facebook || socialLinks.website);

    return (
        <div className="bg-white shadow-sm">
            {/* Hidden file inputs */}
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
            />
            <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
            />

            {/* Banner - Taller and more dramatic */}
            <div className="relative">
                <div
                    className={`h-32 sm:h-48 md:h-56 lg:h-64 relative ${!profile.profile?.banner_url ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700' : ''}`}
                    style={bannerStyle}
                >
                    {/* Overlay gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                    {isOwnProfile && (
                        <button
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={isUploadingBanner}
                            className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                        >
                            {isUploadingBanner ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-700" />
                            ) : (
                                <Camera className="w-4 h-4 text-gray-700" />
                            )}
                            <span className="hidden sm:inline">{isUploadingBanner ? 'Upload...' : 'Modifier la bannière'}</span>
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
                            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-xl overflow-hidden ring-4 ring-white">
                                {profile.profile?.avatar_url ? (
                                    <img
                                        src={profile.profile.avatar_url}
                                        alt={profile.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    `${profile.name?.[0] || ''}${profile.lastname?.[0] || ''}`
                                )}
                            </div>
                            {/* Online indicator */}
                            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full" />
                            {isOwnProfile && (
                                <button
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                    className="absolute -bottom-1 -right-1 p-2.5 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isUploadingAvatar ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Camera className="w-4 h-4" />
                                    )}
                                </button>
                            )}
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
