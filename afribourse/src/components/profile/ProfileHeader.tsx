// src/components/profile/ProfileHeader.tsx
import { Camera, MapPin, Link as LinkIcon, Calendar, CheckCircle } from 'lucide-react';
import FollowButton from './FollowButton';

interface ProfileHeaderProps {
    profile: any;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
    const isOwnProfile = true; // TODO: Check if current user

    return (
        <div className="bg-white border-b border-gray-200">
            {/* Banner */}
            <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
                {isOwnProfile && (
                    <button className="absolute bottom-4 right-4 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50">
                        <Camera className="w-5 h-5 text-gray-700" />
                    </button>
                )}
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative pb-6">
                    {/* Avatar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                                {profile.profile?.avatar_url ? (
                                    <img
                                        src={profile.profile.avatar_url}
                                        alt={profile.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    `${profile.name?.[0]}${profile.lastname?.[0]}`
                                )}
                            </div>
                            {isOwnProfile && (
                                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50">
                                    <Camera className="w-4 h-4 text-gray-700" />
                                </button>
                            )}
                        </div>

                        {/* Name & Actions */}
                        <div className="flex-1 sm:ml-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                            {profile.name} {profile.lastname}
                                        </h1>
                                        {profile.profile?.verified_investor && (
                                            <span title="Investisseur vérifié">
                                                <CheckCircle className="w-6 h-6 text-blue-600" />
                                            </span>
                                        )}
                                    </div>
                                    {profile.profile?.username && (
                                        <p className="text-gray-600">@{profile.profile.username}</p>
                                    )}
                                </div>

                                {!isOwnProfile && (
                                    <FollowButton userId={profile.id} />
                                )}
                            </div>

                            {/* Bio */}
                            {profile.profile?.bio && (
                                <p className="mt-4 text-gray-700 max-w-2xl">
                                    {profile.profile.bio}
                                </p>
                            )}

                            {/* Meta Info */}
                            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                {profile.profile?.country && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {profile.profile.country}
                                    </div>
                                )}
                                {profile.profile?.social_links?.linkedin && (
                                    <a
                                        href={profile.profile.social_links.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-blue-600"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        LinkedIn
                                    </a>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Membre depuis {new Date(profile.joined_at || profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mt-4 flex gap-6 text-sm">
                                <div>
                                    <span className="font-bold text-gray-900">{profile.stats?.followers_count || 0}</span>
                                    <span className="text-gray-600 ml-1">Abonnés</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-900">{profile.stats?.following_count || 0}</span>
                                    <span className="text-gray-600 ml-1">Abonnements</span>
                                </div>
                                <div>
                                    <span className="font-bold text-gray-900">{profile.stats?.posts_count || 0}</span>
                                    <span className="text-gray-600 ml-1">Posts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
