// src/components/profile/InvestorDNA.tsx
import { BookOpen, Briefcase, TrendingUp, Globe, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';

type ProfileType = 'apprenti' | 'decideur' | 'investisseur' | 'explorateur';

const PROFILE_CONFIG: Record<ProfileType, {
    label: string;
    description: string;
    goal: string;
    gradient: string;
    headerGradient: string;
    icon: React.ElementType;
}> = {
    apprenti: {
        label: "L'Apprenti",
        description: 'Apprendre les bases de la BRVM',
        goal: 'Comprendre les marchés africains pas à pas',
        gradient: 'from-teal-500 to-emerald-600',
        headerGradient: 'from-teal-600 to-emerald-700',
        icon: BookOpen,
    },
    decideur: {
        label: 'Le Décideur',
        description: 'Prendre des décisions éclairées',
        goal: 'Analyser et choisir ses investissements avec méthode',
        gradient: 'from-amber-500 to-orange-600',
        headerGradient: 'from-amber-600 to-orange-700',
        icon: Briefcase,
    },
    investisseur: {
        label: "L'Investisseur",
        description: 'Faire fructifier son capital',
        goal: 'Construire un portefeuille performant sur la BRVM',
        gradient: 'from-violet-500 to-purple-600',
        headerGradient: 'from-violet-600 to-purple-700',
        icon: TrendingUp,
    },
    explorateur: {
        label: "L'Explorateur",
        description: 'Explorer les marchés africains',
        goal: 'Découvrir les opportunités de la BRVM et au-delà',
        gradient: 'from-blue-500 to-cyan-600',
        headerGradient: 'from-blue-600 to-cyan-700',
        icon: Globe,
    },
};

interface InvestorDNAProps {
    profileType: string | null;
    isOwnProfile?: boolean;
}

export default function InvestorDNA({ profileType, isOwnProfile = false }: InvestorDNAProps) {
    const config = profileType ? PROFILE_CONFIG[profileType as ProfileType] ?? null : null;

    if (!config) {
        if (!isOwnProfile) return null;

        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">ADN Investisseur</h3>
                </div>
                <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">Profil non encore déterminé</p>
                    <p className="text-xs text-gray-400 mt-1">Complète le Module 3 pour découvrir ton profil</p>
                    <Link
                        to="/learn"
                        className="text-indigo-600 text-sm font-medium hover:underline mt-3 inline-block"
                    >
                        Aller au Module 3 →
                    </Link>
                </div>
            </div>
        );
    }

    const Icon = config.icon;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header gradient */}
            <div className={`bg-gradient-to-r ${config.headerGradient} px-6 py-4`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">ADN Investisseur</h3>
                        <p className="text-white/70 text-sm">Profil déterminé par le Module 3</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Profile type card */}
                <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl p-5 text-white`}>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-xs uppercase tracking-wide font-medium">Profil investisseur</p>
                            <p className="text-xl font-bold text-white">{config.label}</p>
                        </div>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">{config.goal}</p>
                </div>

                {/* Objective */}
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Objectif</p>
                    <p className="text-sm font-medium text-gray-800">{config.description}</p>
                </div>

                {isOwnProfile && (
                    <Link
                        to="/learn"
                        className="mt-4 block text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Revoir le Module 3 →
                    </Link>
                )}
            </div>
        </div>
    );
}
