// src/components/profile/SimilarProfiles.tsx
// Profils similaires (même ADN / niveau / pays) — encourage les visites croisées.
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../lib/api-client';
import { getDnaShortLabel } from './InvestorDNA';
import { trackSimilarProfileClicked } from '../../lib/amplitude';
import FollowButton from './FollowButton';
import ProfileSectionCard from './ProfileSectionCard';

interface SimilarUser {
    userId: string;
    username: string | null;
    name: string | null;
    lastname: string | null;
    avatar_url: string | null;
    avatar_color: string | null;
    level: number;
    profile_type: string | null;
    specialty_tags: string[];
}

export default function SimilarProfiles({ enabled = true, dnaType }: { enabled?: boolean; dnaType?: string | null }) {
    const navigate = useNavigate();
    const { data, isLoading } = useQuery({
        queryKey: ['similar-users'],
        queryFn: async () => {
            const res = await apiClient.get('/profile/similar-users');
            return res.data as SimilarUser[];
        },
        enabled,
        staleTime: 5 * 60 * 1000,
    });

    if (!enabled || isLoading || !data || data.length === 0) return null;

    const dnaLabel = getDnaShortLabel(dnaType);
    const goToProfile = (u: SimilarUser) => {
        trackSimilarProfileClicked(u.userId, u.profile_type ?? undefined);
        navigate(u.username ? `/u/${u.username}` : `/profile/${u.userId}`);
    };

    return (
        <ProfileSectionCard
            id="profils-similaires"
            title={dnaLabel ? `D'autres ${dnaLabel} à suivre` : 'Profils similaires'}
            subtitle="Même ADN, niveau ou pays"
        >
            <div className="space-y-1">
                {data.map((u) => {
                    const initials = `${u.name?.[0] || ''}${u.lastname?.[0] || ''}`;
                    return (
                        <div key={u.userId} className="flex items-center gap-3 -mx-2 px-2 py-1.5 rounded-xl hover:bg-ink-50 transition-colors">
                            <button
                                onClick={() => goToProfile(u)}
                                aria-label={`Voir le profil de ${u.name ?? ''} ${u.lastname ?? ''}`}
                                className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy focus-visible:ring-offset-2"
                            >
                                {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                                ) : (
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${u.avatar_color || 'from-brand-navy to-ink-700'} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                                        {initials}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-ink-900 truncate">{u.name} {u.lastname}</p>
                                    <p className="text-xs text-ink-500 truncate">
                                        Niveau {u.level}
                                        {u.specialty_tags?.[0] ? ` · ${u.specialty_tags[0]}` : ''}
                                    </p>
                                </div>
                            </button>
                            <FollowButton userId={u.userId} size="sm" />
                        </div>
                    );
                })}
            </div>
        </ProfileSectionCard>
    );
}
