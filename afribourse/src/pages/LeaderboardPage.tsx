// src/pages/LeaderboardPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    Crown, Medal,
    Loader2, ArrowLeft, Users, Flame
} from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://africbourse.com';
const OG_IMAGE = 'https://afribourse-api.onrender.com/api/og/image/page/classement';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatar_url: string | null;
    level: number;
    total_xp: number;
    title: string;
    title_emoji: string;
    rank_streak_days?: number;
}

interface LeaderboardResponse {
    type: string;
    entries: LeaderboardEntry[];
    total_participants: number;
    updated_at: string;
}

const RANK_DECORATIONS: Record<number, { icon: () => React.ReactNode }> = {
    1: { icon: () => <Crown className="w-5 h-5 text-brand-orange" /> },
    2: { icon: () => <Medal className="w-5 h-5 text-gray-400" /> },
    3: { icon: () => <Medal className="w-5 h-5 text-brand-orange-dark" /> },
};

export default function LeaderboardPage() {
    const { data, isLoading } = useQuery<LeaderboardResponse>({
        queryKey: ['leaderboard-page-roi'],
        queryFn: async () => {
            const response = await apiClient.get<LeaderboardResponse>(
                '/gamification/leaderboard/roi?limit=10'
            );
            return response.data;
        },
    });

    const entries = data?.entries || [];

    return (
        <div className="min-h-screen bg-gray-50">
            <Helmet>
                <title>Classement des Investisseurs BRVM — Top Traders | AfriBourse</title>
                <meta name="description" content="Découvrez le classement des meilleurs investisseurs AfriBourse. Compétition hebdomadaire basée sur la performance du portefeuille virtuel BRVM." />
                <meta name="keywords" content="classement investisseurs BRVM, leaderboard bourse Afrique, compétition investissement, meilleur portefeuille BRVM" />
                <link rel="canonical" href={`${SITE_URL}/classement`} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="AfriBourse" />
                <meta property="og:title" content="Classement des Investisseurs AfriBourse" />
                <meta property="og:description" content="Le classement hebdomadaire des meilleurs investisseurs sur la BRVM simulée." />
                <meta property="og:image" content={OG_IMAGE} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:url" content={`${SITE_URL}/classement`} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@AfriBourse" />
                <meta name="twitter:title" content="Classement AfriBourse" />
                <meta name="twitter:description" content="Les meilleurs investisseurs BRVM de la semaine." />
                <meta name="twitter:image" content={OG_IMAGE} />
            </Helmet>
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
                {/* Retour */}
                <Link
                    to="/community"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Retour à la communauté
                </Link>

                {/* En-tete — meme composition que les autres pages */}
                <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">
                        Classement
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-lg md:text-xl leading-relaxed">
                        Les dix meilleures performances du simulateur de portefeuille, mesurées
                        sur le rendement du capital virtuel.
                    </p>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && entries.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Aucun participant pour le moment</p>
                        <p className="text-sm text-gray-400 mt-1">Le classement sera disponible bientôt</p>
                    </div>
                )}

                {/* Classement — meme anatomie que la liste des actions de la page
                    Marchés : une carte unique, une ligne par participant separee
                    par un filet, identite a gauche et chiffres a droite. */}
                {!isLoading && entries.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <ul className="divide-y divide-gray-100">
                            {entries.map((entry) => {
                                const roi = entry.total_xp / 100;
                                const isPositive = roi >= 0;
                                const decoration = RANK_DECORATIONS[entry.rank];

                                return (
                                    <li key={entry.userId}>
                                        <Link
                                            to={`/profile/${entry.userId}`}
                                            className="group flex items-center gap-4 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 transition-colors duration-150 hover:bg-gray-50"
                                        >
                                            {/* Rang — les trois premiers gardent leur insigne */}
                                            <span className="w-8 text-center shrink-0">
                                                {decoration
                                                    ? decoration.icon()
                                                    : <span className="text-sm font-mono text-gray-300 tabular-nums">{entry.rank}</span>}
                                            </span>

                                            {/* Avatar, a la place du logo d'une action */}
                                            <span className="w-12 h-12 rounded-xl bg-ink-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                                {entry.avatar_url
                                                    ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    : <span className="text-sm font-bold text-brand-navy">
                                                          {entry.username.charAt(0).toUpperCase()}
                                                      </span>}
                                            </span>

                                            {/* Identite */}
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-gray-900 truncate group-hover:text-brand-navy transition-colors">
                                                        {entry.username}
                                                    </span>
                                                    {entry.rank_streak_days !== undefined && entry.rank_streak_days > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-brand-orange-dark text-xs font-semibold shrink-0">
                                                            <Flame className="w-3 h-3" />
                                                            {entry.rank_streak_days}j
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="block text-xs text-gray-400 mt-1 truncate">
                                                    Niveau {entry.level} · {entry.title}
                                                </span>
                                            </span>

                                            {/* Performance */}
                                            <span className="text-right shrink-0">
                                                <span className="block text-xl font-bold text-gray-900 font-mono tabular-nums leading-none">
                                                    {entry.total_xp.toLocaleString('fr-FR')}
                                                    <span className="text-xs font-semibold text-gray-400 ml-1.5">XP</span>
                                                </span>
                                                <span className={`block text-sm font-bold font-mono mt-1.5 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{roi.toFixed(1)}%
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
